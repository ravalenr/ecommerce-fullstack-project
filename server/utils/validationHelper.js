/**
 * Validation Helper
 * Functions to validate and sanitize input data
 * Email validation, password strength, required fields
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
    return email && typeof email === 'string' && emailRegex.test(email);
}

function isValidPassword(password) {
    return password && password.length >= 6;
}

function validateFields(data, fields) {
    const missing = fields.filter(f => !data[f] || data[f].trim() === '');
    return { valid: !missing.length, missing };
}

function sanitizeEmail(email) {
    return email ? email.toLowerCase().trim() : '';
}

// Exporting validation helper functions
module.exports = {
    isValidEmail,
    isValidPassword,
    validateFields,
    sanitizeEmail
};
