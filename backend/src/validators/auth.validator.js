const { body, validationResult } = require('express-validator');

// ---- Reusable rule lists ----

/** Rules applied when a new user registers */
const registerRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('role')
    .optional()
    .isIn(['buyer', 'agent'])
    .withMessage('Role must be either buyer or agent'),
];

/** Rules applied when a user logs in */
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

/**
 * Middleware that runs AFTER the rule arrays above.
 * It reads the collected errors; if any exist it responds 400
 * immediately so the controller never runs with bad data.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { registerRules, loginRules, handleValidationErrors };
