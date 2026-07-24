const { param, validationResult } = require('express-validator');

/**
 * Returns a two-middleware array:
 *  [0] — the param() rule that checks the ObjectId format
 *  [1] — the standard handleValidationErrors responder
 *
 * @param {string} paramName - The URL param name to validate (e.g. 'id', 'propertyId')
 * @returns {Function[]}
 */
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format.`),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }
    next();
  },
];

module.exports = validateObjectId;
