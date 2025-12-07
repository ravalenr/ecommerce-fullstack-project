// server/controllers/orderController.js
// Controller for managing orders

const database = require('../config/database');
const { getCurrentUserId, getSessionId } = require('../middleware/authMiddleware');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const createOrder = async (req, res) => {
    try {
        const { shipping_address, customer_email, full_name, phone } = req.body;
        const userId = getCurrentUserId(req);
        const sessionId = getSessionId(req);

        if (!shipping_address || !customer_email || !full_name) {
            return sendError(res, 'Missing shipping details', 400);
        }

        let cartSql = `
            SELECT c.*, p.price, p.product_name, p.discount_percentage, p.stock_quantity
            FROM cart_items c
            JOIN products p ON c.product_id = p.product_id
            WHERE `;

        const params = [];
        if (userId) {
            cartSql += 'c.user_id = ?';
            params.push(userId);
        } else {
            cartSql += 'c.session_id = ?';
            params.push(sessionId);
        }

        const cartItems = await database.query(cartSql, params);

        if (cartItems.length === 0) {
            return sendError(res, 'Cart is empty', 400);
        }

        // Calculate order total and validate stock
        let totalAmount = 0;
        const orderItemsData = [];

        for (const item of cartItems) {
            if (item.quantity > item.stock_quantity) {
                return sendError(res, `Insufficient stock for ${item.product_name}`, 400);
            }

            const unitPrice = parseFloat(item.price);
            const discount = parseFloat(item.discount_percentage || 0);
            const finalPrice = unitPrice - (unitPrice * discount / 100);
            const subtotal = finalPrice * item.quantity;

            totalAmount += subtotal;
            orderItemsData.push({
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: finalPrice,
                subtotal: subtotal
            });
        }

        const orderResult = await database.run(`
            INSERT INTO orders (user_id, total_amount, order_status, shipping_address, customer_email)
            VALUES (?, ?, 'Pending', ?, ?)
        `, [userId || null, totalAmount, shipping_address, customer_email]);

        const orderId = orderResult.lastID;

        // Save order items and update stock
        for (const item of orderItemsData) {
            await database.run(`
                INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [orderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.subtotal]);

            await database.run(`
                UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?
            `, [item.quantity, item.product_id]);
        }

        // Clear cart after successful order
        if (userId) {
            await database.run('DELETE FROM cart_items WHERE user_id = ?', [userId]);
        } else {
            await database.run('DELETE FROM cart_items WHERE session_id = ?', [sessionId]);
        }

        return sendSuccess(res, { orderId, totalAmount }, 'Order placed successfully', 201);
    } catch (error) {
        console.error('Order creation error:', error);
        return sendError(res, 'Failed to create order', 500);
    }
};

module.exports = { createOrder };
