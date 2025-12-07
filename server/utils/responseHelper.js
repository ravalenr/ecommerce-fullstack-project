/**
 * Response Helper
 * Standardize API responses
 * Success and error responses
 */
function sendSuccess(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({ success: true, message, data });
}

// Standardized error response
function sendError(res, message, statusCode = 500) {
    return res.status(statusCode).json({ success: false, message });
}
// Exporting the response helper functions
module.exports = { sendSuccess, sendError };
