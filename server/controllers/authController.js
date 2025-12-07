const bcrypt = require('bcryptjs');
const database = require('../config/database');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { isValidEmail, isValidPassword, validateFields, sanitizeEmail } = require('../utils/validationHelper');

// Register new user
const register = async (req, res) => {
    try {
        const { email, password, full_name, phone, address } = req.body;

        // Validate required fields
        const validation = validateFields(req.body, ['email', 'password', 'full_name']);
        if (!validation.valid) {
            return sendError(res, `Missing fields: ${validation.missing.join(', ')}`, 400);
        }

        if (!isValidEmail(email)) {
            return sendError(res, 'Invalid email format', 400);
        }

        if (!isValidPassword(password)) {
            return sendError(res, 'Password must be at least 6 characters', 400);
        }

        const cleanEmail = sanitizeEmail(email);

        // Check if email exists
        const existingUser = await database.get('SELECT user_id FROM users WHERE email = ?', [cleanEmail]);
        if (existingUser) {
            return sendError(res, 'Email already registered', 409);
        }

        const password_hash = await bcrypt.hash(password, 10);
        const result = await database.run(
            'INSERT INTO users (email, password_hash, full_name, phone, address) VALUES (?, ?, ?, ?, ?)',
            [cleanEmail, password_hash, full_name, phone || null, address || null]
        );

        const newUser = await database.get(
            'SELECT user_id, email, full_name, phone, address, created_at FROM users WHERE user_id = ?',
            [result.lastID]
        );

        return sendSuccess(res, newUser, 'User registered successfully', 201);
    } catch (error) {
        console.error('Registration error:', error);
        return sendError(res, 'Registration failed', 500);
    }
};

// User login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const validation = validateFields(req.body, ['email', 'password']);
        if (!validation.valid) {
            return sendError(res, `Missing fields: ${validation.missing.join(', ')}`, 400);
        }

        const cleanEmail = sanitizeEmail(email);
        const user = await database.get(
            'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
            [cleanEmail]
        );

        if (!user || !await bcrypt.compare(password, user.password_hash)) {
            return sendError(res, 'Invalid credentials', 401);
        }

        await database.run(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
            [user.user_id]
        );

        req.session.userId = user.user_id;
        req.session.email = user.email;

        // Merge guest cart if exists
        if (req.session.guestSessionId) {
            await mergeGuestCart(req.session.guestSessionId, user.user_id);
            delete req.session.guestSessionId;
        }

        const userData = {
            user_id: user.user_id,
            email: user.email,
            full_name: user.full_name,
            phone: user.phone,
            address: user.address,
            profile_image: user.profile_image,
            created_at: user.created_at
        };

        return sendSuccess(res, userData, 'Login successful');
    } catch (error) {
        console.error('Login error:', error);
        return sendError(res, 'Login failed', 500);
    }
};

const logout = async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logged out' });
    });
};

const getCurrentUser = async (req, res) => {
    try {
        if (!req.session.userId) {
            return sendError(res, 'Not authenticated', 401);
        }

        const user = await database.get(
            'SELECT user_id, email, full_name, phone, address, profile_image, created_at, last_login FROM users WHERE user_id = ? AND is_active = TRUE',
            [req.session.userId]
        );

        if (!user) {
            req.session.destroy();
            return sendError(res, 'User not found', 401);
        }

        return sendSuccess(res, user);
    } catch (error) {
        console.error('Get user error:', error);
        return sendError(res, 'Failed to get user', 500);
    }
};

const updateProfile = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const { full_name, phone, address } = req.body;

        if (!full_name) {
            return res.status(400).json({ success: false, message: 'Full name required' });
        }

        await database.run(
            'UPDATE users SET full_name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [full_name, phone || null, address || null, req.session.userId]
        );

        const updatedUser = await database.get(
            'SELECT user_id, email, full_name, phone, address, updated_at FROM users WHERE user_id = ?',
            [req.session.userId]
        );

        res.json({ success: true, message: 'Profile updated', data: updatedUser });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Update failed' });
    }
};

const changePassword = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({ success: false, message: 'Passwords required' });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password too short' });
        }

        const user = await database.get(
            'SELECT password_hash FROM users WHERE user_id = ?',
            [req.session.userId]
        );

        if (!await bcrypt.compare(current_password, user.password_hash)) {
            return res.status(401).json({ success: false, message: 'Incorrect password' });
        }

        const new_password_hash = await bcrypt.hash(new_password, 10);
        await database.run(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [new_password_hash, req.session.userId]
        );

        res.json({ success: true, message: 'Password changed' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Password change failed' });
    }
};

// Merge guest cart items into user cart after login
const mergeGuestCart = async (sessionId, userId) => {
    try {
        const guestItems = await database.query(
            'SELECT * FROM cart_items WHERE session_id = ?',
            [sessionId]
        );

        if (guestItems.length === 0) return;

        for (const item of guestItems) {
            const existingItem = await database.get(
                'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
                [userId, item.product_id]
            );

            if (existingItem) {
                // Combine quantities
                await database.run(
                    'UPDATE cart_items SET quantity = quantity + ? WHERE cart_id = ?',
                    [item.quantity, existingItem.cart_id]
                );
                await database.run('DELETE FROM cart_items WHERE cart_id = ?', [item.cart_id]);
            } else {
                // Transfer to user
                await database.run(
                    'UPDATE cart_items SET user_id = ?, session_id = NULL WHERE cart_id = ?',
                    [userId, item.cart_id]
                );
            }
        }
    } catch (error) {
        console.error('Cart merge error:', error);
        // Don't fail login if cart merge fails
    }
};

const checkAuthStatus = async (req, res) => {
    res.json({
        success: true,
        authenticated: !!req.session.userId,
        userId: req.session.userId || null
    });
};

const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const relativePath = `/uploads/profiles/${req.file.filename}`;
        await database.run(
            'UPDATE users SET profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [relativePath, req.session.userId]
        );

        res.json({ success: true, message: 'Profile picture updated', data: { image_url: relativePath } });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
};

module.exports = {
    register,
    login,
    logout,
    getCurrentUser,
    updateProfile,
    changePassword,
    checkAuthStatus,
    uploadAvatar
};
