/**
 * Authentication Routes
 * Purpose: Define all authentication-related API endpoints
 * Base URL: /api/auth
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @body    {email, password, full_name, phone, address}
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and create session
 * @body    {email, password}
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and destroy session
 * @access  Private (requires authentication)
 */
router.post('/logout', requireAuth, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user information
 * @access  Private (requires authentication)
 */
router.get('/me', requireAuth, authController.getCurrentUser);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile information
 * @body    {full_name, phone, address}
 * @access  Private (requires authentication)
 */
router.put('/profile', requireAuth, authController.updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @body    {current_password, new_password}
 * @access  Private (requires authentication)
 */
router.put('/change-password', requireAuth, authController.changePassword);

/**
 * @route   GET /api/auth/status
 * @desc    Check if user is authenticated
 * @access  Public
 */
router.get('/status', authController.checkAuthStatus);

module.exports = router;