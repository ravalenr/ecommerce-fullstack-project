const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/update/:cart_id', cartController.updateCartItem);
router.delete('/remove/:cart_id', cartController.removeCartItem);
router.delete('/clear', cartController.clearCart);
router.get('/count', cartController.getCartCount);
router.get('/validate', cartController.validateCart);

module.exports = router;
