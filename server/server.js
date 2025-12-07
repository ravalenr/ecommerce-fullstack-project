const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const database = require('./config/database');

const app = express();
let serverReady = false;

// Init database connection
database.init().then(() => {
    console.log('Database initialized successfully');
    serverReady = true;
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for development - restrict in production
app.use(cors({
    origin: true,
    credentials: true
}));

// Session config - guests can add to cart before login
app.use(session({
    secret: process.env.SESSION_SECRET || 'multi-store-eletro-secret-key-2025',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false, // TODO: enable in production
        sameSite: 'lax'
    },
    name: 'sessionId'
}));

app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        authenticated: !!req.session.userId,
        sessionId: req.session.id
    });
});

const pages = ['/', '/about', '/products', '/contact', '/login', '/register', '/profile', '/cart'];
pages.forEach(route => {
    app.get(route, (req, res) => {
        const file = route === '/' ? 'index.html' : route.slice(1) + '.html';
        res.sendFile(path.join(__dirname, '../public', file));
    });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
    server.close(() => console.log('Server closed'));
});

module.exports = app;