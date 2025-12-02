/**
 * Error Handler Middleware
 * Purpose: Centralized error handling for the application
 */

/**
 * Custom error class for API errors
 */
class APIError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Not Found Middleware
 * Handles 404 errors for undefined routes
 */
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

/**
 * Global Error Handler
 * Catches all errors and sends appropriate responses
 */
const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode
    });
    
    // Determine status code
    const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
    
    // Prepare error response
    const errorResponse = {
        success: false,
        message: err.message || 'Internal Server Error',
        statusCode: statusCode
    };
    
    // Add stack trace in development mode
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        errorResponse.message = 'Validation Error';
        errorResponse.errors = Object.values(err.errors).map(e => e.message);
    }
    
    if (err.code === 'SQLITE_CONSTRAINT') {
        errorResponse.message = 'Database constraint violation';
    }
    
    res.status(statusCode).json(errorResponse);
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    APIError,
    notFound,
    errorHandler,
    asyncHandler
};
