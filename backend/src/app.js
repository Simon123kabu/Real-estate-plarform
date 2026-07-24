const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const compression  = require('compression');
const session      = require('express-session');
const MongoStore   = require('connect-mongo').default;
const mongoSanitize = require('express-mongo-sanitize');

const { authLimiter, generalLimiter } = require('./middleware/rateLimiter.middleware');
const { isAuthenticated, isAdmin } = require('./middleware/auth.middleware');

const app = express();

app.use(compression());

app.use(helmet());

app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(express.json({
  limit: '10kb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.query) mongoSanitize.sanitize(req.query);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave:            false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl:       process.env.MONGO_URI,
      collectionName: 'sessions',
      ttl:            60 * 60 * 24, 
      autoRemove:     'native',   
    }),
    cookie: {
      httpOnly: true,   
      secure:   process.env.NODE_ENV === 'production', 
      sameSite: 'lax',  
      maxAge:   1000 * 60 * 60 * 24, 
    },
  })
);

app.use('/api/', generalLimiter);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Routes 
app.use('/api/auth',          authLimiter, require('./routes/auth.routes'));
app.use('/api/properties',    require('./routes/property.routes'));
app.use('/api/favorites',     require('./routes/favorite.routes'));
app.use('/api/admin',         isAuthenticated, isAdmin, require('./routes/admin.routes'));
app.use('/api/subscription',  require('./routes/subscription.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';

  if (err.name === 'CastError') {
    statusCode = 400;
    message    = `Invalid value for field: ${err.path}.`;
  }

  // Mongoose: schema-level validation failure 
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
    return res.status(statusCode).json({ success: false, errors });
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message    = `An account with this ${field} already exists.`;
  }

  if (!err.isOperational) {
    console.error('UNEXPECTED ERROR:', err);
  }

  res.status(statusCode).json({ success: false, message });
});

module.exports = app;