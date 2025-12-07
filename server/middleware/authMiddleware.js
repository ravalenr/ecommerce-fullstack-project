/**
 * Authentication Middleware
 * 
 * Protect routes that require user authentication
 * 
 * Add requireAuth to any route that needs a logged-in user
 */

/**
 * Require Authentication Middleware
 * Checks if user is logged in via session
 * If not authenticated, returns 401 error
 * If authenticated, allows request to proceed
 * 
 */
const requireAuth = (req, res, next) => {
    // Check if user session exists and has userId
    if (req.session && req.session.userId) {
        // User is authenticated, proceed to next middleware/controller
        next();
    } else {
        // User is not authenticated
        res.status(401).json({
            success: false,
            message: 'Authentication required. Please log in.'
        });
    }
};

/**
 * Optional Authentication Middleware
 * Checks if user is logged in but doesn't block if not
 * Sets req.currentUser for use in controllers
 * Useful for routes that work for both logged-in and guest users
 * 
 */
const optionalAuth = (req, res, next) => {
    // Set current user if session exists
    req.currentUser = req.session && req.session.userId ? req.session.userId : null;
    next();
};

/**
 * Get Current User Helper
 * Extracts user ID from session
 * Returns null if not authenticated
 * 
 * @param {Request} req - Express request object
 * @returns {number|null} User ID or null
 */
const getCurrentUserId = (req) => {
    return req.session && req.session.userId ? req.session.userId : null;
};

/**
 * Get Session ID Helper
 * Gets session ID for guest users (not logged in)
 * Useful for guest cart functionality
 * 
 * @param {Request} req - Express request object
 * @returns {string|null} Session ID or null
 */
const getSessionId = (req) => {
    return req.session && req.session.id ? req.session.id : null;
};

/**
 * Check if User is Authenticated
 * Simple boolean check for authentication status
 * 
 * @param {Request} req - Express request object
 * @returns {boolean} True if authenticated, false otherwise
 */
const isAuthenticated = (req) => {
    return !!(req.session && req.session.userId);
};

/**
 * Require Admin Middleware (Future Enhancement)
 * For routes that should only be accessible by admin users
 * Currently not implemented - would need admin flag in users table
 * 
 * @example
 * router.post('/admin/users', requireAuth, requireAdmin, controller.method);
 */
const requireAdmin = (req, res, next) => {
    // TO-DO: Implement admin check when admin system is added
    // Check if user has admin role
    // if (req.session.userRole === 'admin') {
    //     next();
    // } else {
    //     res.status(403).json({
    //         success: false,
    //         message: 'Admin access required'
    //     });
    // }
    
    // For now, pass through
    next();
};

/**
 * Rate Limiting Middleware (Future Enhancement)
 * To prevent brute force attacks on login/register
 * Would track failed attempts per IP address
 * 
 * @example
 * router.post('/login', rateLimitLogin, authController.login);
 */
const rateLimitLogin = (req, res, next) => {
    // TO-DO: Implement rate limiting
    // Track failed login attempts by IP
    // Block after X failed attempts
    // Reset after Y minutes
    next();
};

module.exports = {
    requireAuth,
    optionalAuth,
    getCurrentUserId,
    getSessionId,
    isAuthenticated,
    requireAdmin,
    rateLimitLogin
};