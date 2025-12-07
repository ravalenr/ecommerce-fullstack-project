// Custom Error Class and Middleware for Error Handling
class APIError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Middleware to handle 404 Not Found errors
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// General Error Handling Middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', { message: err.message, stack: err.stack });
    // Determine status code
    const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
    const errorResponse = { success: false, message: err.message || 'Internal Server Error', statusCode };
    // Include stack trace in development mode
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

// Exporting the custom error class and middleware functions
module.exports = { APIError, notFound, errorHandler };
