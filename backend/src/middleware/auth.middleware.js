const ROLES = require('../constants/roles');
const AGENT_STATUS = require('../constants/agentStatus');

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'You must be logged in to access this resource.',
  });
};

const isAgent = (req, res, next) => {
  if (req.session && req.session.userId) {
    if (
      req.session.role === ROLES.AGENT &&
      req.session.agentStatus === AGENT_STATUS.APPROVED
    ) {
      return next();
    }
    if (req.session.role === ROLES.AGENT) {
      if (req.session.agentStatus === AGENT_STATUS.REJECTED) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Your agent account has been suspended or rejected by an administrator.',
        });
      }
      return res.status(403).json({
        success: false,
        message: 'Access denied. Your agent account is pending approval.',
      });
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

const isAdmin = (req, res, next) => {
  if (req.session && req.session.userId) {
    if (req.session.role === ROLES.ADMIN) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only administrators can perform this action.',
    });
  }

  return res.status(401).json({
    success: false,
    message: 'You must be logged in to access this resource.',
  });
};

module.exports = { isAuthenticated, isAgent, isAdmin };
