/**
 * Authentication Controller
 * Handles user authentication, registration, and profile management
 * Uses bcrypt for password hashing and session-based authentication
 */

const bcrypt = require('bcryptjs');
const database = require('../config/database');
const { sendSuccess, sendError, sendValidationError, sendUnauthorized } = require('../utils/responseHelper');
const { isValidEmail, isValidPassword, validateRequiredFields, sanitizeEmail } = require('../utils/validationHelper');

/**
 * Register new user
 * @route POST /api/auth/register
 * @body {email, password, full_name, phone, address}
 */
const register = async (req, res) => {
    try {
        const { email, password, full_name, phone, address } = req.body;

        // Check if all required fields are present
        const validation = validateRequiredFields(req.body, ['email', 'password', 'full_name']);
        if (!validation.valid) {
            return sendValidationError(res, `Missing required fields: ${validation.missing.join(', ')}`);
        }

        // Validate email format using our helper
        if (!isValidEmail(email)) {
            return sendValidationError(res, 'Invalid email format');
        }

        // Validate password using our helper
        if (!isValidPassword(password)) {
            return sendValidationError(res, 'Password must be at least 6 characters long');
        }

        // Clean up the email (lowercase and trim)
        const cleanEmail = sanitizeEmail(email);

        // Check if email is already registered
        const existingUser = await database.get(
            'SELECT user_id FROM users WHERE email = ?',
            [cleanEmail]
        );

        if (existingUser) {
            return sendError(res, 'Email already registered', 409);
        }

        // Hash password securely
        const password_hash = await bcrypt.hash(password, 10);

        // Create new user in database
        const sql = `
            INSERT INTO users (email, password_hash, full_name, phone, address)
            VALUES (?, ?, ?, ?, ?)
        `;

        const result = await database.run(sql, [
            cleanEmail,
            password_hash,
            full_name,
            phone || null,
            address || null
        ]);

        // Get the newly created user data (without password hash)
        const newUser = await database.get(
            'SELECT user_id, email, full_name, phone, address, created_at FROM users WHERE user_id = ?',
            [result.lastID]
        );

        // Send success response using our helper
        return sendSuccess(res, newUser, 'User registered successfully', 201);

    } catch (error) {
        console.error('Error in register:', error);
        return sendError(res, 'Error registering user', 500, error);
    }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @body {email, password}
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        const validation = validateRequiredFields(req.body, ['email', 'password']);
        if (!validation.valid) {
            return sendValidationError(res, `Missing required fields: ${validation.missing.join(', ')}`);
        }

        // Clean up email
        const cleanEmail = sanitizeEmail(email);

        // Find user in database
        const user = await database.get(
            'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
            [cleanEmail]
        );

        // Check if user exists
        if (!user) {
            return sendUnauthorized(res, 'Invalid email or password');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return sendUnauthorized(res, 'Invalid email or password');
        }

        // Update last login time
        await database.run(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
            [user.user_id]
        );

        // Create user session
        req.session.userId = user.user_id;
        req.session.email = user.email;

        // Merge guest cart if user had items before logging in
        if (req.session.guestSessionId) {
            await mergeGuestCart(req.session.guestSessionId, user.user_id);
            delete req.session.guestSessionId;
        }

        // Prepare user data (never send password hash to client!)
        const userData = {
            user_id: user.user_id,
            email: user.email,
            full_name: user.full_name,
            phone: user.phone,
            address: user.address,
            created_at: user.created_at
        };

        return sendSuccess(res, userData, 'Login successful');

    } catch (error) {
        console.error('Error in login:', error);
        return sendError(res, 'Error logging in', 500, error);
    }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 */
const logout = async (req, res) => {
    try {
        // Destroy session
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error logging out'
                });
            }
            
            // Clear session cookie
            res.clearCookie('connect.sid');
            
            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        });
        
    } catch (error) {
        console.error('Error in logout:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging out',
            error: error.message
        });
    }
};

/**
 * Get current user information
 * @route GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return sendUnauthorized(res, 'Not authenticated');
        }

        // Get user data from database
        const user = await database.get(
            'SELECT user_id, email, full_name, phone, address, created_at, last_login FROM users WHERE user_id = ? AND is_active = TRUE',
            [req.session.userId]
        );

        // If user not found or inactive, clear the session
        if (!user) {
            req.session.destroy();
            return sendUnauthorized(res, 'User not found');
        }

        return sendSuccess(res, user);

    } catch (error) {
        console.error('Error in getCurrentUser:', error);
        return sendError(res, 'Error getting user information', 500, error);
    }
};

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @body {full_name, phone, address}
 */
const updateProfile = async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }
        
        const { full_name, phone, address } = req.body;
        
        // Validation
        if (!full_name) {
            return res.status(400).json({
                success: false,
                message: 'Full name is required'
            });
        }
        
        // Update user profile
        const sql = `
            UPDATE users 
            SET full_name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `;
        
        await database.run(sql, [
            full_name,
            phone || null,
            address || null,
            req.session.userId
        ]);
        
        // Get updated user data
        const updatedUser = await database.get(
            'SELECT user_id, email, full_name, phone, address, updated_at FROM users WHERE user_id = ?',
            [req.session.userId]
        );
        
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
        
    } catch (error) {
        console.error('Error in updateProfile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};

/**
 * Change user password
 * @route PUT /api/auth/change-password
 * @body {current_password, new_password}
 */
const changePassword = async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }
        
        const { current_password, new_password } = req.body;
        
        // Validation
        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }
        
        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }
        
        // Get user with password hash
        const user = await database.get(
            'SELECT password_hash FROM users WHERE user_id = ?',
            [req.session.userId]
        );
        
        // Verify current password
        const isPasswordValid = await bcrypt.compare(current_password, user.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        // Hash new password
        const new_password_hash = await bcrypt.hash(new_password, 10);
        
        // Update password
        await database.run(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [new_password_hash, req.session.userId]
        );
        
        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
        
    } catch (error) {
        console.error('Error in changePassword:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
};

/**
 * Helper function: Merge guest cart with user cart after login
 * @param {string} sessionId - Guest session ID
 * @param {number} userId - User ID after login
 */
const mergeGuestCart = async (sessionId, userId) => {
    try {
        // Get guest cart items
        const guestItems = await database.query(
            'SELECT * FROM cart_items WHERE session_id = ?',
            [sessionId]
        );
        
        if (guestItems.length === 0) {
            return; // No items to merge
        }
        
        // For each guest cart item
        for (const item of guestItems) {
            // Check if user already has this product in cart
            const existingItem = await database.get(
                'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
                [userId, item.product_id]
            );
            
            if (existingItem) {
                // Add quantities together
                await database.run(
                    'UPDATE cart_items SET quantity = quantity + ? WHERE cart_id = ?',
                    [item.quantity, existingItem.cart_id]
                );
                
                // Delete the guest cart item
                await database.run(
                    'DELETE FROM cart_items WHERE cart_id = ?',
                    [item.cart_id]
                );
            } else {
                // Transfer cart item to user
                await database.run(
                    'UPDATE cart_items SET user_id = ?, session_id = NULL WHERE cart_id = ?',
                    [userId, item.cart_id]
                );
            }
        }
        
        console.log(`Merged ${guestItems.length} guest cart items for user ${userId}`);
        
    } catch (error) {
        console.error('Error merging guest cart:', error);
        // Don't throw error - cart merge failure shouldn't prevent login
    }
};

/**
 * Check authentication status
 * @route GET /api/auth/status
 */
const checkAuthStatus = async (req, res) => {
    try {
        const isAuthenticated = !!req.session.userId;
        
        res.status(200).json({
            success: true,
            authenticated: isAuthenticated,
            userId: req.session.userId || null
        });
        
    } catch (error) {
        console.error('Error in checkAuthStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking authentication status',
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    getCurrentUser,
    updateProfile,
    changePassword,
    checkAuthStatus
};