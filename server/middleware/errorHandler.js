class APIError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (err, req, res, next) => {
    console.error('Error:', { message: err.message, stack: err.stack });

    const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
    const errorResponse = { success: false, message: err.message || 'Internal Server Error', statusCode };

    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }

    if (err.name === 'ValidationError') {
        errorResponse.message = 'Validation Error';
        errorResponse.errors = Object.values(err.errors).map(e => e.message);
    }

    if (err.code === 'SQLITE_CONSTRAINT') {
        errorResponse.message = 'Database constraint violation';
    }

    res.status(statusCode).json(errorResponse);
};

module.exports = { APIError, notFound, errorHandler };
