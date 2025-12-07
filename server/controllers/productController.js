const database = require('../config/database');

// Get all products with optional filters
const getAllProducts = async (req, res) => {
    try {
        const { category_id, featured, search, limit } = req.query;

        let sql = `
            SELECT p.*, c.category_name, c.category_id
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.is_active = 1
        `;

        const params = [];

        // Apply filters if provided
        if (category_id) {
            sql += ' AND p.category_id = ?';
            params.push(category_id);
        }

        if (featured === 'true') {
            sql += ' AND p.is_featured = 1';
        }

        if (search) {
            sql += ' AND (p.product_name LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        sql += ' ORDER BY p.created_at DESC';

        if (limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        const products = await database.query(sql, params);

        // MySQL returns decimals as strings sometimes
        const fixedProducts = products.map(p => ({
            ...p,
            price: parseFloat(p.price),
            discount_percentage: parseFloat(p.discount_percentage),
            stock_quantity: parseInt(p.stock_quantity)
        }));

        res.json({ success: true, count: fixedProducts.length, data: fixedProducts });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve products' });
    }
};

// Get single product with images
const getProductById = async (req, res) => {
    try {
        const product = await database.get(`
            SELECT p.*, c.category_name, c.category_id
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.product_id = ? AND p.is_active = 1
        `, [req.params.id]);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const fixedProduct = {
            ...product,
            price: parseFloat(product.price),
            discount_percentage: parseFloat(product.discount_percentage),
            stock_quantity: parseInt(product.stock_quantity)
        };

        const images = await database.query('SELECT * FROM product_images WHERE product_id = ?', [req.params.id]);
        fixedProduct.additional_images = images;

        res.json({ success: true, data: fixedProduct });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve product' });
    }
};

const createProduct = async (req, res) => {
    try {
        const { product_name, description, price, stock_quantity, category_id, image_url, is_featured } = req.body;

        if (!product_name || !price) {
            return res.status(400).json({ success: false, message: 'Name and price required' });
        }

        if (price < 0) {
            return res.status(400).json({ success: false, message: 'Invalid price' });
        }

        const result = await database.run(
            'INSERT INTO products (product_name, description, price, stock_quantity, category_id, image_url, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [product_name, description || '', price, stock_quantity || 0, category_id || null, image_url || null, is_featured ? 1 : 0]
        );

        const newProduct = await database.get('SELECT * FROM products WHERE product_id = ?', [result.lastID]);
        res.status(201).json({ success: true, message: 'Product created', data: newProduct });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ success: false, message: 'Failed to create product' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const existingProduct = await database.get('SELECT * FROM products WHERE product_id = ?', [req.params.id]);

        if (!existingProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const { product_name, description, price, stock_quantity, category_id, image_url, is_featured, is_active } = req.body;

        if (price !== undefined && price < 0) {
            return res.status(400).json({ success: false, message: 'Invalid price' });
        }

        await database.run(`
            UPDATE products SET
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
        `, [
            product_name, description, price, stock_quantity, category_id, image_url,
            is_featured !== undefined ? (is_featured ? 1 : 0) : undefined,
            is_active !== undefined ? (is_active ? 1 : 0) : undefined,
            req.params.id
        ]);

        const updatedProduct = await database.get('SELECT * FROM products WHERE product_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Product updated', data: updatedProduct });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ success: false, message: 'Failed to update product' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const existingProduct = await database.get('SELECT * FROM products WHERE product_id = ?', [req.params.id]);

        if (!existingProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        await database.run('UPDATE products SET is_active = 0 WHERE product_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete product' });
    }
};

const getAllCategories = async (req, res) => {
    try {
        const categories = await database.query('SELECT * FROM categories ORDER BY category_name');
        res.json({ success: true, count: categories.length, data: categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve categories' });
    }
};

const updateProductPrice = async (req, res) => {
    try {
        const { price } = req.body;

        if (!price || price < 0) {
            return res.status(400).json({ success: false, message: 'Valid price required' });
        }

        const existingProduct = await database.get('SELECT * FROM products WHERE product_id = ?', [req.params.id]);

        if (!existingProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        await database.run('UPDATE products SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?', [price, req.params.id]);
        const updatedProduct = await database.get('SELECT * FROM products WHERE product_id = ?', [req.params.id]);

        res.json({
            success: true,
            message: 'Price updated',
            data: { old_price: existingProduct.price, new_price: updatedProduct.price, product: updatedProduct }
        });
    } catch (error) {
        console.error('Update price error:', error);
        res.status(500).json({ success: false, message: 'Failed to update price' });
    }
};

const getFeaturedProducts = async (req, res) => {
    try {
        const products = await database.query(`
            SELECT p.*, c.category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.is_featured = 1 AND p.is_active = 1
            ORDER BY p.created_at DESC LIMIT 8
        `);

        const fixedProducts = products.map(p => ({
            ...p,
            price: parseFloat(p.price),
            discount_percentage: parseFloat(p.discount_percentage),
            stock_quantity: parseInt(p.stock_quantity)
        }));

        res.json({ success: true, count: fixedProducts.length, data: fixedProducts });
    } catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve featured products' });
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
