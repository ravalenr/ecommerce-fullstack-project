const database = require('../config/database');
const { getCurrentUserId, getSessionId } = require('../middleware/authMiddleware');

// Get cart - works for both authenticated users and guests
const getCart = async (req, res) => {
    try {
        const userId = getCurrentUserId(req);
        const sessionId = getSessionId(req);

        let sql = `
            SELECT c.cart_id, c.product_id, c.quantity, c.added_at,
                   p.product_name, p.price, p.discount_percentage, p.stock_quantity, p.description, p.image_url,
                   ROUND((p.price * c.quantity), 2) as subtotal,
                   ROUND((p.price - (p.price * p.discount_percentage / 100)), 2) as discounted_price,
                   ROUND(((p.price - (p.price * p.discount_percentage / 100)) * c.quantity), 2) as discounted_subtotal
            FROM cart_items c
            INNER JOIN products p ON c.product_id = p.product_id
            WHERE p.is_active = TRUE
        `;

        const params = [];

        // Cart is tracked by user_id OR session_id
        if (userId) {
            sql += ' AND c.user_id = ?';
            params.push(userId);
        } else if (sessionId) {
            sql += ' AND c.session_id = ? AND c.user_id IS NULL';
            params.push(sessionId);
        } else {
            return res.json({
                success: true,
                data: { items: [], summary: { total_items: 0, subtotal: 0, discount_amount: 0, total_amount: 0 } }
            });
        }

        sql += ' ORDER BY c.added_at DESC';
        const cartItems = await database.query(sql, params);

        // Calculate totals
        const summary = {
            total_items: cartItems.reduce((sum, item) => sum + item.quantity, 0),
            subtotal: cartItems.reduce((sum, item) => sum + Number(item.subtotal), 0),
            discount_amount: cartItems.reduce((sum, item) => {
                const discount = Number(item.subtotal) - Number(item.discounted_subtotal);
                return sum + discount;
            }, 0),
            total_amount: cartItems.reduce((sum, item) => sum + Number(item.discounted_subtotal), 0)
        };

        // Round to 2 decimals
        summary.subtotal = Math.round(summary.subtotal * 100) / 100;
        summary.discount_amount = Math.round(summary.discount_amount * 100) / 100;
        summary.total_amount = Math.round(summary.total_amount * 100) / 100;

        res.json({ success: true, data: { items: cartItems, summary } });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch cart' });
    }
};

const addToCart = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        const userId = getCurrentUserId(req);
        const sessionId = getSessionId(req);

        if (!product_id) {
            return res.status(400).json({ success: false, message: 'Product ID required' });
        }

        const qty = parseInt(quantity) || 1;
        if (qty < 1) {
            return res.status(400).json({ success: false, message: 'Invalid quantity' });
        }

        const product = await database.get(
            'SELECT product_id, product_name, price, stock_quantity, is_active FROM products WHERE product_id = ?',
            [product_id]
        );

        if (!product || !product.is_active) {
            return res.status(404).json({ success: false, message: 'Product not available' });
        }

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
            const newQuantity = existingItem.quantity + qty;

            if (newQuantity > product.stock_quantity) {
                return res.status(400).json({ success: false, message: `Only ${product.stock_quantity} available` });
            }

            await database.run(
                'UPDATE cart_items SET quantity = ?, added_at = CURRENT_TIMESTAMP WHERE cart_id = ?',
                [newQuantity, existingItem.cart_id]
            );

            return res.json({
                success: true,
                message: 'Cart updated',
                data: { cart_id: existingItem.cart_id, product_id, quantity: newQuantity, action: 'updated' }
            });
        }

        if (qty > product.stock_quantity) {
            return res.status(400).json({ success: false, message: `Only ${product.stock_quantity} available` });
        }

        const result = await database.run(
            'INSERT INTO cart_items (user_id, session_id, product_id, quantity) VALUES (?, ?, ?, ?)',
            [userId || null, sessionId || null, product_id, qty]
        );

        res.status(201).json({
            success: true,
            message: 'Added to cart',
            data: { cart_id: result.lastID, product_id, quantity: qty, action: 'added' }
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ success: false, message: 'Failed to add to cart' });
    }
};

const updateCartItem = async (req, res) => {
    try {
        const { cart_id } = req.params;
        const { quantity } = req.body;
        const userId = getCurrentUserId(req);
        const sessionId = getSessionId(req);

        if (!quantity || quantity < 1) {
            return res.status(400).json({ success: false, message: 'Invalid quantity' });
        }

        const qty = parseInt(quantity);
        let cartItem;

        if (userId) {
            cartItem = await database.get(
                'SELECT cart_id, product_id FROM cart_items WHERE cart_id = ? AND user_id = ?',
                [cart_id, userId]
            );
        } else if (sessionId) {
            cartItem = await database.get(
                'SELECT cart_id, product_id FROM cart_items WHERE cart_id = ? AND session_id = ? AND user_id IS NULL',
                [cart_id, sessionId]
            );
        }

        if (!cartItem) {
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        }

        const product = await database.get(
            'SELECT stock_quantity, price, discount_percentage FROM products WHERE product_id = ?',
            [cartItem.product_id]
        );

        if (qty > product.stock_quantity) {
            return res.status(400).json({ success: false, message: `Only ${product.stock_quantity} available` });
        }

        await database.run('UPDATE cart_items SET quantity = ? WHERE cart_id = ?', [qty, cart_id]);

        const price = product.price;
        const discountedPrice = price - (price * product.discount_percentage / 100);
        const subtotal = discountedPrice * qty;

        res.json({
            success: true,
            message: 'Cart updated',
            data: { cart_id, quantity: qty, subtotal: Math.round(subtotal * 100) / 100 }
        });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ success: false, message: 'Failed to update cart' });
    }
};

const removeCartItem = async (req, res) => {
    try {
        const { cart_id } = req.params;
        const userId = getCurrentUserId(req);
        const sessionId = getSessionId(req);

        let cartItem;
        if (userId) {
            cartItem = await database.get('SELECT cart_id FROM cart_items WHERE cart_id = ? AND user_id = ?', [cart_id, userId]);
        } else if (sessionId) {
            cartItem = await database.get('SELECT cart_id FROM cart_items WHERE cart_id = ? AND session_id = ? AND user_id IS NULL', [cart_id, sessionId]);
        }

        if (!cartItem) {
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        }

        await database.run('DELETE FROM cart_items WHERE cart_id = ?', [cart_id]);
        res.json({ success: true, message: 'Item removed' });
    } catch (error) {
        console.error('Remove cart item error:', error);
        res.status(500).json({ success: false, message: 'Failed to remove item' });
    }
};

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
            return res.status(400).json({ success: false, message: 'No active session' });
        }

        await database.run(sql, params);
        res.json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ success: false, message: 'Failed to clear cart' });
    }
};

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
            return res.json({ success: true, count: 0 });
        }

        const result = await database.get(sql, params);
        res.json({ success: true, count: parseInt(result.count) || 0 });
    } catch (error) {
        console.error('Get cart count error:', error);
        res.status(500).json({ success: false, message: 'Failed to get cart count' });
    }
};

const validateCart = async (req, res) => {
    try {
        const userId = getCurrentUserId(req);
        const sessionId = getSessionId(req);

        let sql = `
            SELECT c.cart_id, c.product_id, c.quantity, p.product_name, p.stock_quantity, p.is_active
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
            return res.json({ success: true, valid: true, issues: [] });
        }

        const cartItems = await database.query(sql, params);
        const issues = [];

        for (const item of cartItems) {
            if (!item.is_active) {
                issues.push({ cart_id: item.cart_id, product_id: item.product_id, product_name: item.product_name, issue: 'Product unavailable' });
            } else if (item.quantity > item.stock_quantity) {
                issues.push({ cart_id: item.cart_id, product_id: item.product_id, product_name: item.product_name, issue: `Only ${item.stock_quantity} in stock (have ${item.quantity})` });
            }
        }

        res.json({ success: true, valid: issues.length === 0, issues });
    } catch (error) {
        console.error('Validate cart error:', error);
        res.status(500).json({ success: false, message: 'Failed to validate cart' });
    }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart, getCartCount, validateCart };
