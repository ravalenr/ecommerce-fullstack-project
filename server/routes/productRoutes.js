const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);
router.get('/featured/all', productController.getFeaturedProducts);
router.get('/categories/all', productController.getAllCategories);
router.get('/:id', productController.getProductById);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.patch('/:id/price', productController.updateProductPrice);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
