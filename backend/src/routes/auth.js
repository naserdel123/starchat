/**
 * auth.js
 * مسارات المصادقة
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');

// Public routes
router.post('/register', authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/forgot-password', authController.forgotPassword);

// Protected routes
router.use(protect);
router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.put('/profile', authController.updateProfile);
router.put('/password', authController.changePassword);
router.put('/fcm-token', authController.updateFcmToken);

module.exports = router;
