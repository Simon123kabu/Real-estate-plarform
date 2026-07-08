const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// ---- Core Middleware ----
app.use(helmet());               // security headers
app.use(cors());                 // allow cross-origin requests from frontend
app.use(morgan('dev'));          // request logging
app.use(express.json());         // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse form bodies

// ---- Health Check Route ----
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// ---- Routes (added in later phases) ----
// app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/properties', require('./routes/property.routes'));
// app.use('/api/favorites', require('./routes/favorite.routes'));

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