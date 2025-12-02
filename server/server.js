/**
 * Main Server Application
 * Purpose: Express server configuration and initialization
 * E-Commerce Backend for Multi Store Eletro
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const database = require('./config/database');

// Initialize Express application
const app = express();

// ============================================
// DATABASE INITIALIZATION
// ============================================
let serverReady = false;

database.init().then(() => {
    console.log('Database initialized successfully');
    serverReady = true;
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration - Allow frontend to access API
app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true
}));

// Session configuration for cart management
app.use(session({
    secret: 'multi-store-eletro-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: false // Set to true in production with HTTPS
    }
}));

// Static files middleware - Serve frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================
// API ROUTES
// ============================================

const productRoutes = require('./routes/productRoutes');

// Mount routes
app.use('/api/products', productRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Multi Store Eletro API',
        version: '1.0.0',
        endpoints: {
            products: {
                getAll: 'GET /api/products',
                getById: 'GET /api/products/:id',
                create: 'POST /api/products',
                update: 'PUT /api/products/:id',
                updatePrice: 'PATCH /api/products/:id/price',
                delete: 'DELETE /api/products/:id',
                getFeatured: 'GET /api/products/featured/all',
                getCategories: 'GET /api/products/categories/all'
            },
            cart: {
                info: 'Cart endpoints will be available on Day 3'
            },
            orders: {
                info: 'Order endpoints will be available on Day 4'
            }
        }
    });
});

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/about.html'));
});

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/products.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/contact.html'));
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

// 404 handler - Must be after all routes
app.use(notFound);

// Global error handler - Must be last
app.use(errorHandler);

// ============================================
// SERVER INITIALIZATION
// ============================================

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('Multi Store Eletro E-Commerce Server');
    console.log('='.repeat(50));
    console.log(`Server Status: RUNNING`);
    console.log(`Port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Server URL: http://localhost:${PORT}`);
    console.log(`API Documentation: http://localhost:${PORT}/api`);
    console.log(`Health Check: http://localhost:${PORT}/api/health`);
    console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

module.exports = app;
