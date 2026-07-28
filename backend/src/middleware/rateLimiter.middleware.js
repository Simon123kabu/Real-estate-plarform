const rateLimit = require('express-rate-limit');

// ─── RATE LIMITING TEMPORARILY DISABLED FOR DEVELOPMENT TESTING ───
// To re-enable: comment out the two no-op lines below and uncomment the rateLimit blocks.

/* ORIGINAL authLimiter — uncomment to restore:
const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              10,              // max requests per window per IP
  standardHeaders:  true,
  legacyHeaders:    false,
  message: {
    success: false,
    message: 'Too many attempts from this IP. Please try again after 15 minutes.',
  },
});
*/

/* ORIGINAL generalLimiter — uncomment to restore:
const generalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              100,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});
*/

// No-op pass-through limiters (testing only)
const authLimiter    = (req, res, next) => next();
const generalLimiter = (req, res, next) => next();

module.exports = { authLimiter, generalLimiter };

