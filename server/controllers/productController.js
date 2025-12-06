/**
 * Product Controller
 * Purpose: Handle all product-related business logic
 * Includes: CRUD operations, search, filtering, and price updates
 */

const database = require('../config/database');

/**
 * Get all products with optional filtering
 * @route GET /api/products
 * @query {number} category_id - Filter by category
 * @query {boolean} featured - Filter featured products
 * @query {string} search - Search by product name
 * @query {number} limit - Limit number of results
 */
const getAllProducts = async (req, res) => {
    try {
        const { category_id, featured, search, limit } = req.query;
        
        let sql = `
            SELECT 
                p.product_id,
                p.product_name,
                p.description,
                p.price,
                p.discount_percentage,
                p.stock_quantity,
                p.image_url,
                p.is_featured,
                p.is_active,
                p.created_at,
                c.category_name,
                c.category_id
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.is_active = 1
        `;
        
        const params = [];
        
        // Add category filter
        if (category_id) {
            sql += ' AND p.category_id = ?';
            params.push(category_id);
        }
        
        // Add featured filter
        if (featured === 'true') {
            sql += ' AND p.is_featured = 1';
        }
        
        // Add search filter
        if (search) {
            sql += ' AND (p.product_name LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        sql += ' ORDER BY p.created_at DESC';
        
        // Add limit
        if (limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(limit));
        }
        
        const products = await database.query(sql, params);

        console.log('Products fetched:', products.length);

        // convert string numbers to actual numbers
        // mysql returns decimals as strings sometimes which messes up frontend
        const fixedProducts = products.map(product => ({
            ...product,
            price: parseFloat(product.price),
            discount_percentage: parseFloat(product.discount_percentage),
            stock_quantity: parseInt(product.stock_quantity)
        }));

        res.status(200).json({
            success: true,
            count: fixedProducts.length,
            data: fixedProducts
        });
        
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving products',
            error: error.message
        });
    }
};

/**
 * Get single product by ID
 * @route GET /api/products/:id
 * @param {number} id - Product ID
 */
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `
            SELECT 
                p.*,
                c.category_name,
                c.category_id
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.product_id = ? AND p.is_active = 1
        `;
        
        const product = await database.get(sql, [id]);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // fix the number types before sending
        const fixedProduct = {
            ...product,
            price: parseFloat(product.price),
            discount_percentage: parseFloat(product.discount_percentage),
            stock_quantity: parseInt(product.stock_quantity)
        };

        // Get additional images for this product
        const imagesSql = 'SELECT * FROM product_images WHERE product_id = ?';
        const images = await database.query(imagesSql, [id]);

        fixedProduct.additional_images = images;

        res.status(200).json({
            success: true,
            data: fixedProduct
        });
        
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving product',
            error: error.message
        });
    }
};

/**
 * Create new product
 * @route POST /api/products
 * @body {object} product - Product information
 */
const createProduct = async (req, res) => {
    try {
        const {
            product_name,
            description,
            price,
            stock_quantity,
            category_id,
            image_url,
            is_featured
        } = req.body;
        
        // Validation
        if (!product_name || !price) {
            return res.status(400).json({
                success: false,
                message: 'Product name and price are required'
            });
        }
        
        if (price < 0) {
            return res.status(400).json({
                success: false,
                message: 'Price cannot be negative'
            });
        }
        
        const sql = `
            INSERT INTO products 
            (product_name, description, price, stock_quantity, category_id, image_url, is_featured)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            product_name,
            description || '',
            price,
            stock_quantity || 0,
            category_id || null,
            image_url || null,
            is_featured ? 1 : 0
        ];
        
        const result = await database.run(sql, params);
        
        // Fetch the newly created product
        const newProduct = await database.get('SELECT * FROM products WHERE product_id = ?', [result.lastID]);
        
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: newProduct
        });
        
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
};

/**
 * Update product information
 * @route PUT /api/products/:id
 * @param {number} id - Product ID
 * @body {object} product - Updated product information
 */
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            product_name,
            description,
            price,
            stock_quantity,
            category_id,
            image_url,
            is_featured,
            is_active
        } = req.body;
        
        // Check if product exists
        const existingProduct = await database.get('SELECT * FROM products WHERE product_id = ?', [id]);
        
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // Validation
        if (price !== undefined && price < 0) {
            return res.status(400).json({
                success: false,
                message: 'Price cannot be negative'
            });
        }
        
        const sql = `
            UPDATE products 
            SET 
                product_name = COALESCE(?, product_name),
                description = COALESCE(?, description),
                price = COALESCE(?, price),
                stock_quantity = COALESCE(?, stock_quantity),
                category_id = COALESCE(?, category_id),
                image_url = COALESCE(?, image_url),
                is_featured = COALESCE(?, is_featured),
                is_active = COALESCE(?, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE product_id = ?
        `;
        
        const params = [
            product_name,
            description,
            price,
            stock_quantity,
            category_id,
            image_url,
            is_featured !== undefined ? (is_featured ? 1 : 0) : undefined,
            is_active !== undefined ? (is_active ? 1 : 0) : undefined,
            id
        ];
        
        await database.run(sql, params);
        
        // Fetch updated product
        const updatedProduct = await database.get('SELECT * FROM products WHERE product_id = ?', [id]);
        
        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
        });
        
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
};

/**
 * Delete product (soft delete by setting is_active to 0)
 * @route DELETE /api/products/:id
 * @param {number} id - Product ID
 */
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if product exists
        const existingProduct = await database.get('SELECT * FROM products WHERE product_id = ?', [id]);
        
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // Soft delete - set is_active to 0
        const sql = 'UPDATE products SET is_active = 0 WHERE product_id = ?';
        await database.run(sql, [id]);
        
        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
};

/**
 * Get all categories
 * @route GET /api/products/categories/all
 */
const getAllCategories = async (req, res) => {
    try {
        const sql = 'SELECT * FROM categories ORDER BY category_name';
        const categories = await database.query(sql);
        
        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
        
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving categories',
            error: error.message
        });
    }
};

/**
 * Update product price (market rate adjustment)
 * @route PATCH /api/products/:id/price
 * @param {number} id - Product ID
 * @body {number} price - New price
 */
const updateProductPrice = async (req, res) => {
    try {
        const { id } = req.params;
        const { price } = req.body;
        
        if (!price || price < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid price is required'
            });
        }
        
        // Check if product exists
        const existingProduct = await database.get('SELECT * FROM products WHERE product_id = ?', [id]);
        
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        const sql = `
            UPDATE products 
            SET price = ?, updated_at = CURRENT_TIMESTAMP
            WHERE product_id = ?
        `;
        
        await database.run(sql, [price, id]);
        
        const updatedProduct = await database.get('SELECT * FROM products WHERE product_id = ?', [id]);
        
        res.status(200).json({
            success: true,
            message: 'Product price updated successfully',
            data: {
                old_price: existingProduct.price,
                new_price: updatedProduct.price,
                product: updatedProduct
            }
        });
        
    } catch (error) {
        console.error('Error updating price:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product price',
            error: error.message
        });
    }
};

/**
 * Get featured products
 * @route GET /api/products/featured/all
 */
const getFeaturedProducts = async (req, res) => {
    try {
        const sql = `
            SELECT 
                p.*,
                c.category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.is_featured = 1 AND p.is_active = 1
            ORDER BY p.created_at DESC
            LIMIT 8
        `;
        
        const products = await database.query(sql);

        // fix number types (same as getAllProducts)
        const fixedProducts = products.map(product => ({
            ...product,
            price: parseFloat(product.price),
            discount_percentage: parseFloat(product.discount_percentage),
            stock_quantity: parseInt(product.stock_quantity)
        }));

        res.status(200).json({
            success: true,
            count: fixedProducts.length,
            data: fixedProducts
        });
        
    } catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving featured products',
            error: error.message
        });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getAllCategories,
    updateProductPrice,
    getFeaturedProducts
};
