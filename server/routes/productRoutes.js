/**
 * Product Routes
 * Purpose: Define all product-related API endpoints
 * Base URL: /api/products
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

/**
 * @route   GET /api/products
 * @desc    Get all products with optional filters
 * @query   category_id, featured, search
 * @access  Public
 */
router.get('/', productController.getAllProducts);

/**
 * @route   GET /api/products/featured/all
 * @desc    Get featured products
 * @access  Public
 */
router.get('/featured/all', productController.getFeaturedProducts);

/**
 * @route   GET /api/products/categories/all
 * @desc    Get all categories
 * @access  Public
 */
router.get('/categories/all', productController.getAllCategories);

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @param   id - Product ID
 * @access  Public
 */
router.get('/:id', productController.getProductById);

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @body    product_name, description, price, stock_quantity, category_id, image_url, is_featured
 * @access  Private (Admin only in production)
 */
router.post('/', productController.createProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @param   id - Product ID
 * @body    Any product fields to update
 * @access  Private (Admin only in production)
 */
router.put('/:id', productController.updateProduct);

/**
 * @route   PATCH /api/products/:id/price
 * @desc    Update product price only (market rate adjustment)
 * @param   id - Product ID
 * @body    price
 * @access  Private (Admin only in production)
 */
router.patch('/:id/price', productController.updateProductPrice);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product (soft delete)
 * @param   id - Product ID
 * @access  Private (Admin only in production)
 */
router.delete('/:id', productController.deleteProduct);

module.exports = router;
