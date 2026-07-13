const ROLES = require('../constants/roles');

/**
 * isAuthenticated
 * ---------------
 * A middleware that protects routes which require a logged-in user.
 *
 * How it works:
 *  1. express-session has already read the session cookie from the
 *     incoming request and attached `req.session` to the request object.
 *  2. We check if req.session.userId exists — it is set by the login
 *     controller when a user authenticates successfully.
 *  3. If userId is present → the user is considered "logged in" → next()
 *  4. If userId is missing → the session is empty / expired → 401
 *
 * No JWT decoding, no token verification — just a simple session check.
 */
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'You must be logged in to access this resource.',
  });
};

/**
 * isAgent
 * -------
 * Extends isAuthenticated: also requires the logged-in user to have
 * the 'agent' role (stored in the session at login time).
 *
 * Use on routes that only agents should reach (e.g. create property).
 */
const isAgent = (req, res, next) => {
  if (req.session && req.session.userId) {
    if (req.session.role === ROLES.AGENT) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only agents can perform this action.',
    });
  }

  return res.status(401).json({
    success: false,
    message: 'You must be logged in to access this resource.',
  });
};

module.exports = { isAuthenticated, isAgent };
