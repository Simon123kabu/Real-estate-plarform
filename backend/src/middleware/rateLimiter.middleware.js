/**
 * rateLimiter.middleware.js
 * -------------------------
 * Two rate limiters using express-rate-limit:
 *
 *  authLimiter    — strict limit for login / register (brute-force protection)
 *  generalLimiter — relaxed limit for all other API routes
 *
 * Both limiters use the client IP as the key.
 * In production behind a proxy (e.g. Nginx, Heroku), set
 * app.set('trust proxy', 1) so the real IP is read from X-Forwarded-For.
 */

const rateLimit = require('express-rate-limit');

/**
 * Auth limiter — applied to /api/auth/login and /api/auth/register.
 * 10 attempts per 15 minutes per IP.
 * After the limit is hit the client receives a 429 with a clear message.
 */
const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              10,              // max requests per window per IP
  standardHeaders:  true,           // send RateLimit-* headers (RFC 6585)
  legacyHeaders:    false,          // disable X-RateLimit-* headers
  message: {
    success: false,
    message: 'Too many attempts from this IP. Please try again after 15 minutes.',
  },
});

/**
 * General API limiter — applied to the entire /api/* surface.
 * 100 requests per 15 minutes per IP — generous for normal usage,
 * tight enough to block automated scraping and abuse.
 */
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

module.exports = { authLimiter, generalLimiter };
