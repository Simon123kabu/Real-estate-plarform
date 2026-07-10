const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');

const app = express();

// ---- Core Middleware ----
app.use(helmet());               // security headers
app.use(cors({ credentials: true, origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(morgan('dev'));          // request logging
app.use(express.json());         // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse form bodies

// ---- Session Middleware ----
// express-session creates a server-side session for each visitor.
// The browser gets a signed cookie (connect.sid) — it contains ONLY
// the session ID, never the actual data (userId, role).
// The real data lives in MongoDB (via connect-mongo).
app.use(
  session({
    secret: process.env.SESSION_SECRET, // signs the cookie to prevent tampering
    resave: false,            // don't re-save session if nothing changed
    saveUninitialized: false, // don't create a session until data is stored
    // Default memory store — sessions live in RAM (perfect for development)
    cookie: {
      httpOnly: true,   // JS in the browser CANNOT read this cookie (XSS protection)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      maxAge: 1000 * 60 * 60 * 24,   // 24 hours in milliseconds
    },
  })
);

// ---- Health Check Route ----
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// ---- Routes ----
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/properties', require('./routes/property.routes'));
app.use('/api/favorites', require('./routes/favorite.routes'));

// ---- 404 Handler ----
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// ---- Global Error Handler ----
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;