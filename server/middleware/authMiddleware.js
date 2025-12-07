// Check if user is authenticated
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Authentication required' });
    }
};

// Helper to get current user ID from session
const getCurrentUserId = (req) => {
    return req.session && req.session.userId ? req.session.userId : null;
};

// Helper to get session ID for guest cart tracking
const getSessionId = (req) => {
    return req.session && req.session.id ? req.session.id : null;
};

module.exports = { requireAuth, getCurrentUserId, getSessionId };
