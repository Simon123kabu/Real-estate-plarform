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
router.post('/register', registerRules, handleValidationErrors, register);

// POST /api/auth/login
router.post('/login', loginRules, handleValidationErrors, login);

// POST /api/auth/logout
router.post('/logout', isAuthenticated, logout);

// GET /api/auth/me
router.get('/me', isAuthenticated, getMe);

// PATCH /api/auth/me
router.patch('/me', isAuthenticated, updateProfileRules, handleValidationErrors, updateProfile);

// POST /api/auth/me/profile-image
router.post('/me/profile-image', isAuthenticated, uploadSingle, uploadProfileImage);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordRules, handleValidationErrors, forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPasswordRules, handleValidationErrors, resetPassword);

module.exports = router;

