const express = require('express');
const router = express.Router();

const {
  register,
  login,
  logout,
  getMe,
  uploadProfileImage,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');

const {
  registerRules,
  loginRules,
  updateProfileRules,
  forgotPasswordRules,
  resetPasswordRules,
  handleValidationErrors,
} = require('../validators/auth.validator');

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

// PATCH /api/auth/me
// Update profile name and/or phone number (must be logged in)
router.patch('/me', isAuthenticated, updateProfileRules, handleValidationErrors, updateProfile);

// POST /api/auth/me/profile-image
// Upload user's profile picture (must be logged in)
router.post('/me/profile-image', isAuthenticated, uploadSingle, uploadProfileImage);

// POST /api/auth/forgot-password
// Sends a password reset link to the user's email (public)
router.post('/forgot-password', forgotPasswordRules, handleValidationErrors, forgotPassword);

// POST /api/auth/reset-password
// Applies a new password using the token from the email link (public)
router.post('/reset-password', resetPasswordRules, handleValidationErrors, resetPassword);

module.exports = router;

