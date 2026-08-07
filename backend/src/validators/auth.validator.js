const { body } = require('express-validator');
const handleValidationErrors = require('./handleValidationErrors');

// ---- Register rules ----

const registerRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name is required'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  body('role')
    .optional()
    .isIn(['buyer', 'agent'])
    .withMessage('Role must be either buyer or agent'),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isMobilePhone('any', { strictMode: false })
    .withMessage('Please provide a valid phone number'),
];

// ---- Login rules ----

const loginRules = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// ---- Update Profile rules ----

const updateProfileRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be blank')
    .isLength({ max: 100 })
    .withMessage('Name must be 100 characters or fewer'),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isMobilePhone('any', { strictMode: false })
    .withMessage('Please provide a valid phone number'),
];

// ---- Forgot Password rules ----

const forgotPasswordRules = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
];

// ---- Reset Password rules ----

const resetPasswordRules = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
];

module.exports = {
  registerRules,
  loginRules,
  updateProfileRules,
  forgotPasswordRules,
  resetPasswordRules,
  handleValidationErrors,
};