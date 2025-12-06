/**
 * Validation Helper
 * Common validation functions we use throughout the app
 * This keeps our code DRY (Don't Repeat Yourself)
 */

/**
 * Check if an email looks valid
 * Returns true if it matches the pattern: something@something.something
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

/**
 * Check if a password meets our requirements
 * Currently we just check that it's at least 6 characters
 */
function isValidPassword(password) {
    if (!password || typeof password !== 'string') {
        return false;
    }

    return password.length >= 6;
}

/**
 * Check if a number is positive
 * Useful for prices, quantities, etc.
 */
function isPositiveNumber(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
}

/**
 * Check if required fields are present
 * Pass an object and an array of required field names
 *
 * Example:
 *   validateRequiredFields(req.body, ['email', 'password', 'name'])
 *   Returns: { valid: true } or { valid: false, missing: ['password'] }
 */
function validateRequiredFields(data, requiredFields) {
    const missing = [];

    for (const field of requiredFields) {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            missing.push(field);
        }
    }

    return {
        valid: missing.length === 0,
        missing: missing
    };
}

/**
 * Sanitize email - convert to lowercase and trim whitespace
 */
function sanitizeEmail(email) {
    if (!email || typeof email !== 'string') {
        return '';
    }
    return email.toLowerCase().trim();
}

/**
 * Check if a value is a valid positive integer
 * Useful for IDs, quantities, etc.
 */
function isValidPositiveInteger(value) {
    const num = parseInt(value);
    return !isNaN(num) && num > 0 && Number.isInteger(num);
}

module.exports = {
    isValidEmail,
    isValidPassword,
    isPositiveNumber,
    validateRequiredFields,
    sanitizeEmail,
    isValidPositiveInteger
};
