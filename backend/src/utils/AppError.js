/**
 * AppError.js
 * -----------
 * Custom operational error class used throughout the API.
 *
 * "Operational" errors are expected, predictable failures
 * (e.g. 404, 403, 409) as opposed to programmer mistakes
 * or unexpected infrastructure failures.
 *
 * Usage:
 *   throw new AppError('Property not found.', 404);
 *   throw new AppError('Access denied.', 403);
 *
 * The global error handler in app.js catches these and
 * returns the correct HTTP status and message automatically.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode  = statusCode;
    this.isOperational = true; // flag to distinguish from unexpected crashes

    // Maintain proper stack trace (V8 only)
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
