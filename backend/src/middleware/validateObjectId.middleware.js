/**
 * validateObjectId.middleware.js
 * ------------------------------
 * Validates that a URL parameter is a valid MongoDB ObjectId format
 * BEFORE the request reaches the database.
 *
 * Without this, an invalid ID (e.g. /api/properties/bad-id) would
 * reach Mongoose, trigger a CastError, and only then get caught by
 * the global error handler. This middleware short-circuits that
 * unnecessary DB round-trip.
 *
 * Usage:
 *   // Validates req.params.id
 *   router.get('/:id', validateObjectId('id'), getPropertyById);
 *
 *   // Validates req.params.propertyId
 *   router.post('/:propertyId', validateObjectId('propertyId'), toggleFavorite);
 */

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
