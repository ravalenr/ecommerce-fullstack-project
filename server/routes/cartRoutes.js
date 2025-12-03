/**
 * Cart Routes
 * Purpose: Define all shopping cart API endpoints
 * Base URL: /api/cart
 * Works for both authenticated users and guests
 */

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { optionalAuth } = require('../middleware/authMiddleware');

// Apply optional auth to all routes - works for both logged-in users and guests
router.use(optionalAuth);

/**
 * @route   GET /api/cart
 * @desc    Get current user's cart with all items and summary
 * @access  Public (works for both guests and authenticated users)
 * @returns {items[], summary: {total_items, subtotal, discount_amount, total_amount}}
 */
router.get('/', cartController.getCart);

/**
 * @route   POST /api/cart/add
 * @desc    Add product to cart (creates new or increases quantity)
 * @body    {product_id: number, quantity: number (optional, default 1)}
 * @access  Public (works for both guests and authenticated users)
 * @returns {cart_id, product_id, quantity, action: 'added'|'updated'}
 */
router.post('/add', cartController.addToCart);

/**
 * @route   PUT /api/cart/update/:cart_id
 * @desc    Update cart item quantity
 * @params  cart_id - ID of cart item to update
 * @body    {quantity: number}
 * @access  Public (user must own the cart item)
 * @returns {cart_id, quantity, subtotal}
 */
router.put('/update/:cart_id', cartController.updateCartItem);

/**
 * @route   DELETE /api/cart/remove/:cart_id
 * @desc    Remove item from cart
 * @params  cart_id - ID of cart item to remove
 * @access  Public (user must own the cart item)
 * @returns {success, message}
 */
router.delete('/remove/:cart_id', cartController.removeCartItem);

/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear entire cart (remove all items)
 * @access  Public (clears current user's/guest's cart)
 * @returns {success, message}
 */
router.delete('/clear', cartController.clearCart);

/**
 * @route   GET /api/cart/count
 * @desc    Get total number of items in cart (for badge display)
 * @access  Public (works for both guests and authenticated users)
 * @returns {count: number}
 */
router.get('/count', cartController.getCartCount);

/**
 * @route   GET /api/cart/validate
 * @desc    Validate cart items (check stock availability, active products)
 * @access  Public (validates current user's/guest's cart)
 * @returns {valid: boolean, issues: array}
 * @note    Useful before checkout to ensure all items are still available
 */
router.get('/validate', cartController.validateCart);

module.exports = router;