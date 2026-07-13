/**
 * handleValidationErrors.js
 * -------------------------
 * Single shared middleware that reads express-validator results and
 * responds 400 with a structured error list if any rules failed.
 *
 * Import this in every validator file instead of defining it locally.
 * This ensures the error response shape is consistent across the entire API.
 *
 * Usage in a route:
 *   router.post('/', someRules, handleValidationErrors, controller);
 */

const { validationResult } = require('express-validator');

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

module.exports = handleValidationErrors;
