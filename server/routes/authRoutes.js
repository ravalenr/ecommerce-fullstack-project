/*
    * Auth Routes
    * Purpose: Define authentication-related routes
    * User registration, login, logout, profile management
*/
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.getCurrentUser);
router.put('/profile', requireAuth, authController.updateProfile);
router.put('/change-password', requireAuth, authController.changePassword);
router.get('/status', authController.checkAuthStatus);
router.post('/upload-avatar', requireAuth, upload.single('avatar'), authController.uploadAvatar);

// Export the router
module.exports = router;
