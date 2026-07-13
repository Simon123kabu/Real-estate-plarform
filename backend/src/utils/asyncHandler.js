/**
 * asyncHandler.js
 * ---------------
 * Wraps an async controller function so it never needs a try/catch.
 *
 * Any error thrown inside the wrapped function — whether an AppError,
 * a Mongoose error, or an unexpected crash — is automatically forwarded
 * to Express's global error handler via next(error).
 *
 * Usage:
 *   const myHandler = asyncHandler(async (req, res) => {
 *     // throw freely — no try/catch needed
 *     throw new AppError('Not found.', 404);
 *   });
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
