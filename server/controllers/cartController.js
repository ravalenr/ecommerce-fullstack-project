/**
 * Cart Controller
 * Purpose: Handle shopping cart operations for both guest and authenticated users
 * Features: Add/remove items, update quantities, view cart, calculate totals
 */

const database = require('../config/database');
const { getCurrentUserId, getSessionId } = require('../middleware/authMiddleware');

/**
 * Get cart for current user (guest or authenticated)
 * @route GET /api/cart
 */
const getCart = async (req, res) => {
    try {
        const userId = getCurrentUserId(req);
        const sessionId = getSessionId(req);
        
        // Build query based on user authentication status
        let sql = `
            SELECT
                c.cart_id,
                c.product_id,
                c.quantity,
                c.added_at,
                p.product_name,
                p.price,
                p.discount_percentage,
                p.stock_quantity,
                p.description,
                p.image_url,
                ROUND((p.price * c.quantity), 2) as subtotal,
                ROUND((p.price - (p.price * p.discount_percentage / 100)), 2) as discounted_price,
                ROUND(((p.price - (p.price * p.discount_percentage / 100)) * c.quantity), 2) as discounted_subtotal
            FROM cart_items c
            INNER JOIN products p ON c.product_id = p.product_id
            WHERE p.is_active = TRUE
        `;
        
        const params = [];
        
        if (userId) {
            // Logged-in user - use user_id
            sql += ' AND c.user_id = ?';
            params.push(userId);
        } else if (sessionId) {
            // Guest user - use session_id
            sql += ' AND c.session_id = ? AND c.user_id IS NULL';
            params.push(sessionId);
        } else {
            // No session - return empty cart
            return res.status(200).json({
                success: true,
                data: {
                    items: [],
                    summary: {
                        total_items: 0,
                        subtotal: 0,
                        discount_amount: 0,
                        total_amount: 0
                    }
                }
            });
        }
        
        sql += ' ORDER BY c.added_at DESC';
        
        // ... inside getCart function (after database query)

        const cartItems = await database.query(sql, params);
        
        // Calculate cart summary
        const summary = {
            total_items: cartItems.reduce((sum, item) => sum + item.quantity, 0),
            
            // ... inside getCart function (after database query)
            subtotal: cartItems.reduce((sum, item) => sum + Number(item.subtotal), 0),
            discount_amount: cartItems.reduce((sum, item) => {
                const discount = Number(item.subtotal) - Number(item.discounted_subtotal);
                return sum + discount;
            }, 0),
            total_amount: cartItems.reduce((sum, item) => sum + Number(item.discounted_subtotal), 0)
        };
        
        // Round summary values to 2 decimal places
        summary.subtotal = Math.round(summary.subtotal * 100) / 100;
        summary.discount_amount = Math.round(summary.discount_amount * 100) / 100;
        summary.total_amount = Math.round(summary.total_amount * 100) / 100;

// ...
        
        res.status(200).json({
            success: true,
            data: {
                items: cartItems,
                summary: summary
            }
        });
        
    } catch (error) {
        console.error('Error in getCart:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cart',
            error: error.message
        });
    }
};

/**
 * Add product to cart
 * @route POST /api/cart/add
 * @body {product_id, quantity}
 */
const addToCart = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        const userId = getCurrentUserId(req);
        const sessionId = getSessionId(req);
        
        // Validation
        if (!product_id) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }
        
        const qty = parseInt(quantity) || 1;
        
        if (qty < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }
        
        // Check if product exists and is active
        const product = await database.get(
            'SELECT product_id, product_name, price, stock_quantity, is_active FROM products WHERE product_id = ?',
            [product_id]
        );
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        if (!product.is_active) {
            return res.status(400).json({
                success: false,
                message: 'Product is not available'
            });
        }
        
        // Check if item already exists in cart
        let existingItem;
        if (userId) {
            existingItem = await database.get(
                'SELECT cart_id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
                [userId, product_id]
            );
        } else if (sessionId) {
            existingItem = await database.get(
                'SELECT cart_id, quantity FROM cart_items WHERE session_id = ? AND product_id = ? AND user_id IS NULL',
                [sessionId, product_id]
            );
        }
        
        if (existingItem) {
            // Update existing cart item - add to quantity
            const newQuantity = existingItem.quantity + qty;
            
            // Check stock
            if (newQuantity > product.stock_quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${product.stock_quantity} items available in stock`
                });
            }
            
            await database.run(
                'UPDATE cart_items SET quantity = ?, added_at = CURRENT_TIMESTAMP WHERE cart_id = ?',
                [newQuantity, existingItem.cart_id]
            );
            
            return res.status(200).json({
                success: true,
                message: 'Cart updated - quantity increased',
                data: {
                    cart_id: existingItem.cart_id,
                    product_id: product_id,
                    quantity: newQuantity,
                    action: 'updated'
                }
            });
        }
        
        // Check stock for new item
        if (qty > product.stock_quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock_quantity} items available in stock`
            });
        }
        
        // Add new item to cart
        const sql = `
            INSERT INTO cart_items (user_id, session_id, product_id, quantity)
            VALUES (?, ?, ?, ?)
        `;
        
        const result = await database.run(sql, [
            userId || null,
            sessionId || null,
            product_id,
            qty
        ]);
        
        res.status(201).json({
            success: true,
            message: 'Product added to cart',
            data: {
                cart_id: result.lastID,
                product_id: product_id,
                quantity: qty,
                action: 'added'
            }
        });
        
    } catch (error) {
        console.error('Error in addToCart:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding product to cart',
            error: error.message
        });
    }
};

/**
 * Update cart item quantity
 * @route PUT /api/cart/update/:cart_id
 * @body {quantity}
 */
const updateCartItem = async (req, res) => {
    try {
        const { cart_id } = req.params;
        const { quantity } = req.body;
        const userId = getCurrentUserId(req);
        const sessionId = getSessionId(req);
        
        // Validation
        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }
        
        const qty = parseInt(quantity);
        
        // Verify cart item belongs to current user/session
        let cartItem;
        if (userId) {
            cartItem = await database.get(
                'SELECT cart_id, product_id, quantity FROM cart_items WHERE cart_id = ? AND user_id = ?',
                [cart_id, userId]
            );
        } else if (sessionId) {
            cartItem = await database.get(
                'SELECT cart_id, product_id, quantity FROM cart_items WHERE cart_id = ? AND session_id = ? AND user_id IS NULL',
                [cart_id, sessionId]
            );
        }
        
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }
        
        // Check product stock
        const product = await database.get(
            'SELECT stock_quantity, price, discount_percentage FROM products WHERE product_id = ?',
            [cartItem.product_id]
        );
        
        if (qty > product.stock_quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock_quantity} items available in stock`
            });
        }
        
        // Update quantity
        await database.run(
            'UPDATE cart_items SET quantity = ? WHERE cart_id = ?',
            [qty, cart_id]
        );
        
        // Calculate new subtotal
        const price = product.price;
        const discountedPrice = price - (price * product.discount_percentage / 100);
        const subtotal = discountedPrice * qty;
        
        res.status(200).json({
            success: true,
            message: 'Cart item updated',
            data: {
                cart_id: cart_id,
                quantity: qty,
                subtotal: Math.round(subtotal * 100) / 100
            }
        });
        
    } catch (error) {
        console.error('Error in updateCartItem:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating cart item',
            error: error.message
        });
    }
};

/**
 * Remove item from cart
 * @route DELETE /api/cart/remove/:cart_id
 */
const removeCartItem = async (req, res) => {
    try {
        const { cart_id } = req.params;
        const userId = getCurrentUserId(req);
        const sessionId = getSessionId(req);
        
        // Verify cart item belongs to current user/session
        let cartItem;
        if (userId) {
            cartItem = await database.get(
                'SELECT cart_id FROM cart_items WHERE cart_id = ? AND user_id = ?',
                [cart_id, userId]
            );
        } else if (sessionId) {
            cartItem = await database.get(
                'SELECT cart_id FROM cart_items WHERE cart_id = ? AND session_id = ? AND user_id IS NULL',
                [cart_id, sessionId]
            );
        }
        
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }
        
        // Delete cart item
        await database.run('DELETE FROM cart_items WHERE cart_id = ?', [cart_id]);
        
        res.status(200).json({
            success: true,
            message: 'Item removed from cart'
        });
        
    } catch (error) {
        console.error('Error in removeCartItem:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing cart item',
            error: error.message
        });
    }
};

/**
 * Clear entire cart
 * @route DELETE /api/cart/clear
 */
const clearCart = async (req, res) => {
    try {
        const userId = getCurrentUserId(req);
        const sessionId = getSessionId(req);
        
        let sql, params;
        
        if (userId) {
            sql = 'DELETE FROM cart_items WHERE user_id = ?';
            params = [userId];
        } else if (sessionId) {
            sql = 'DELETE FROM cart_items WHERE session_id = ? AND user_id IS NULL';
            params = [sessionId];
        } else {
            return res.status(400).json({
                success: false,
                message: 'No active session'
            });
        }
        
        await database.run(sql, params);
        
        res.status(200).json({
            success: true,
            message: 'Cart cleared'
        });
        
    } catch (error) {
        console.error('Error in clearCart:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing cart',
            error: error.message
        });
    }
};

/**
 * Get cart item count (for badge display)
 * @route GET /api/cart/count
 */
const getCartCount = async (req, res) => {
    try {
        const userId = getCurrentUserId(req);
        const sessionId = getSessionId(req);
        
        let sql, params;
        
        if (userId) {
            sql = 'SELECT COALESCE(SUM(quantity), 0) as count FROM cart_items WHERE user_id = ?';
            params = [userId];
        } else if (sessionId) {
            sql = 'SELECT COALESCE(SUM(quantity), 0) as count FROM cart_items WHERE session_id = ? AND user_id IS NULL';
            params = [sessionId];
        } else {
            return res.status(200).json({
                success: true,
                count: 0
            });
        }
        
        const result = await database.get(sql, params);
        
        res.status(200).json({
            success: true,
            count: parseInt(result.count) || 0
        });
        
    } catch (error) {
        console.error('Error in getCartCount:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting cart count',
            error: error.message
        });
    }
};

/**
 * Validate cart before checkout (future use)
 * Checks stock availability for all items
 * @route GET /api/cart/validate
 */
const validateCart = async (req, res) => {
    try {
        const userId = getCurrentUserId(req);
        const sessionId = getSessionId(req);
        
        let sql = `
            SELECT 
                c.cart_id,
                c.product_id,
                c.quantity,
                p.product_name,
                p.stock_quantity,
                p.is_active
            FROM cart_items c
            INNER JOIN products p ON c.product_id = p.product_id
        `;
        
        const params = [];
        
        if (userId) {
            sql += ' WHERE c.user_id = ?';
            params.push(userId);
        } else if (sessionId) {
            sql += ' WHERE c.session_id = ? AND c.user_id IS NULL';
            params.push(sessionId);
        } else {
            return res.status(200).json({
                success: true,
                valid: true,
                issues: []
            });
        }
        
        const cartItems = await database.query(sql, params);
        
        const issues = [];
        
        for (const item of cartItems) {
            if (!item.is_active) {
                issues.push({
                    cart_id: item.cart_id,
                    product_id: item.product_id,
                    product_name: item.product_name,
                    issue: 'Product is no longer available'
                });
            } else if (item.quantity > item.stock_quantity) {
                issues.push({
                    cart_id: item.cart_id,
                    product_id: item.product_id,
                    product_name: item.product_name,
                    issue: `Only ${item.stock_quantity} items in stock (you have ${item.quantity})`
                });
            }
        }
        
        res.status(200).json({
            success: true,
            valid: issues.length === 0,
            issues: issues
        });
        
    } catch (error) {
        console.error('Error in validateCart:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating cart',
            error: error.message
        });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    getCartCount,
    validateCart
};