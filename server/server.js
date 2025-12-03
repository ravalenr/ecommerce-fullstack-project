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
    credentials: true // Allow cookies to be sent
}));

// Session configuration for authentication and cart management
app.use(session({
    secret: process.env.SESSION_SECRET || 'multi-store-eletro-secret-key-2025',
    resave: false,
    saveUninitialized: true, // Create session for guests too
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true, // Prevent XSS attacks
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax' // CSRF protection
    },
    name: 'sessionId' // Custom cookie name
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
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');

// Mount routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        authenticated: !!req.session.userId,
        sessionId: req.session.id
    });
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Multi Store Eletro API',
        version: '1.0.0',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                logout: 'POST /api/auth/logout',
                getCurrentUser: 'GET /api/auth/me',
                updateProfile: 'PUT /api/auth/profile',
                changePassword: 'PUT /api/auth/change-password',
                checkStatus: 'GET /api/auth/status'
            },
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
                getCart: 'GET /api/cart',
                addToCart: 'POST /api/cart/add',
                updateItem: 'PUT /api/cart/update/:cart_id',
                removeItem: 'DELETE /api/cart/remove/:cart_id',
                clearCart: 'DELETE /api/cart/clear',
                getCount: 'GET /api/cart/count',
                validate: 'GET /api/cart/validate'
            },
            orders: {
                info: 'Order endpoints coming soon (Day 4)'
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

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/register.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/profile.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/cart.html'));
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
    console.log('Features Enabled:');
    console.log('   Authentication System');
    console.log('   Shopping Cart (Guest & User)');
    console.log('   Product Management');
    console.log('   Session Management');
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