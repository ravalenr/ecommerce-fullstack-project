/**
 * Response Helper
 * Makes it easier to send consistent responses from our API
 * Instead of writing the same response format everywhere, we use these helpers
 */

/**
 * Send a success response
 * Use this when everything worked correctly
 */
function sendSuccess(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        message: message,
        data: data
    });
}

/**
 * Send an error response
 * Use this when something went wrong
 */
function sendError(res, message, statusCode = 500, error = null) {
    const response = {
        success: false,
        message: message
    };

    // Only include error details in development mode
    if (error && process.env.NODE_ENV === 'development') {
        response.error = error.message;
    }

    return res.status(statusCode).json(response);
}

/**
 * Send a validation error response
 * Use this when the user sent bad data
 */
function sendValidationError(res, message) {
    return sendError(res, message, 400);
}

/**
 * Send an unauthorized error
 * Use this when the user needs to be logged in
 */
function sendUnauthorized(res, message = 'Not authenticated') {
    return sendError(res, message, 401);
}

/**
 * Send a not found error
 * Use this when a resource doesn't exist
 */
function sendNotFound(res, message = 'Resource not found') {
    return sendError(res, message, 404);
}

/**
 * Wrap async functions to catch errors automatically
 * This saves us from writing try-catch in every single function
 *
 * Example:
 * Instead of:
 *   const myFunction = async (req, res) => {
 *     try {
 *       // code here
 *     } catch (error) {
 *       res.status(500).json({ error: error.message });
 *     }
 *   }
 *
 * We can do:
 *   const myFunction = asyncHandler(async (req, res) => {
 *     // code here
 *   });
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            console.error('Error in async handler:', error);
            sendError(res, 'An unexpected error occurred', 500, error);
        });
    };
}

module.exports = {
    sendSuccess,
    sendError,
    sendValidationError,
    sendUnauthorized,
    sendNotFound,
    asyncHandler
};
