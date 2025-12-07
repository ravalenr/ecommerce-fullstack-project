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

module.exports = {
    isValidEmail,
    isValidPassword,
    validateFields,
    sanitizeEmail
};
