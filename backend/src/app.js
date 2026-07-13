const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const compression  = require('compression');
const session      = require('express-session');
const MongoStore   = require('connect-mongo').default;
const mongoSanitize = require('express-mongo-sanitize');

const { authLimiter, generalLimiter } = require('./middleware/rateLimiter.middleware');

const app = express();

// ---- Trust proxy (required for accurate IPs behind Nginx / Heroku) ----
// Uncomment in production if running behind a reverse proxy:
// app.set('trust proxy', 1);

// ---- Gzip/Deflate Compression ----
app.use(compression());

// ---- Security Headers ----
app.use(helmet());

// ---- CORS ----
app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
}));

// ---- Request Logging ----
// Use 'combined' (Apache format) in production for log aggregators,
// 'dev' (coloured, concise) locally.
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ---- Body Parsing with Size Limits ----
// Limits prevent a single oversized request from exhausting server memory (DoS).
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ---- NoSQL Injection Sanitization ----
// Strips $ and . from req.body, req.query, req.params before any route runs.
// Prevents MongoDB operator injection (e.g. { "email": { "$gt": "" } }).
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.query) mongoSanitize.sanitize(req.query);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

// ---- Session Middleware ----
// express-session stores session data server-side in MongoDB (via connect-mongo).
// The browser only ever receives a signed session ID cookie — never the real data.
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave:            false,
    saveUninitialized: false,
    // Persist sessions in MongoDB so they survive server restarts
    // and work across multiple server instances in production.
    store: MongoStore.create({
      mongoUrl:       process.env.MONGO_URI,
      collectionName: 'sessions',
      ttl:            60 * 60 * 24, // 1 day in seconds (matches cookie maxAge)
      autoRemove:     'native',     // let MongoDB TTL index expire old sessions
    }),
    cookie: {
      httpOnly: true,   // JS in the browser CANNOT read this cookie (XSS protection)
      secure:   process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax',  // blocks cross-site POST/DELETE/PATCH requests (CSRF protection)
      maxAge:   1000 * 60 * 60 * 24, // 24 hours in milliseconds
    },
  })
);

// ---- Rate Limiting ----
// General limiter covers the full API surface (100 req / 15 min per IP).
// Auth limiter is stricter and applied directly on auth routes below (10 req / 15 min).
app.use('/api/', generalLimiter);

// ---- Health Check Route ----
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// ---- Routes ----
app.use('/api/auth',       authLimiter, require('./routes/auth.routes'));
app.use('/api/properties', require('./routes/property.routes'));
app.use('/api/favorites',  require('./routes/favorite.routes'));

// ---- 404 Handler ----
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ---- Global Error Handler ----
// Catches every error forwarded via next(error) from any controller.
// Handles AppError, Mongoose errors, and MongoDB errors centrally.
app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';

  // ── Mongoose: invalid ObjectId format (e.g. /api/properties/bad-id) ──
  if (err.name === 'CastError') {
    statusCode = 400;
    message    = `Invalid value for field: ${err.path}.`;
  }

  // ── Mongoose: schema-level validation failure ──
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
    return res.status(statusCode).json({ success: false, errors });
  }

  // ── MongoDB: duplicate key (e.g. duplicate email on register) ──
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message    = `An account with this ${field} already exists.`;
  }

  // Log unexpected (non-operational) errors only — keeps logs clean
  if (!err.isOperational) {
    console.error('UNEXPECTED ERROR:', err);
  }

  res.status(statusCode).json({ success: false, message });
});

module.exports = app;