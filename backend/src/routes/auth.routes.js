const express = require('express');
const router = express.Router();

const { register, login, logout, getMe, uploadProfileImage } = require('../controllers/auth.controller');
const { registerRules, loginRules, handleValidationErrors } = require('../validators/auth.validator');
const { isAuthenticated } = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

// POST /api/auth/register
// Validate input → check duplicate → hash password → save user
router.post('/register', registerRules, handleValidationErrors, register);

// POST /api/auth/login
// Validate input → find user → compare hash → set session
router.post('/login', loginRules, handleValidationErrors, login);

// POST /api/auth/logout
// Destroy session and clear cookie (must be logged in)
router.post('/logout', isAuthenticated, logout);

// GET /api/auth/me
// Return current user profile (must be logged in)
router.get('/me', isAuthenticated, getMe);

// POST /api/auth/me/profile-image
// Upload user's profile picture
router.post('/me/profile-image', isAuthenticated, uploadSingle, uploadProfileImage);

module.exports = router;
