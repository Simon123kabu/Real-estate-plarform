const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             50,              // max requests per window per IP
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many attempts from this IP. Please try again after 15 minutes.',
  },
});

const generalLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             50,              // max requests per window per IP
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

// Stricter limiter for public inquiry endpoints to prevent spam/flooding
const inquiryLimiter = rateLimit({
  windowMs:        60 * 60 * 1000, // 1 hour
  max:             50,              // max 50 inquiries per IP per hour
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many inquiry submissions. Please try again later.',
  },
});


module.exports = { authLimiter, generalLimiter, inquiryLimiter };
