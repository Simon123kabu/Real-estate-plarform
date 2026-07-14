const { body, query } = require('express-validator');
const ROLES = require('../constants/roles');
const PROPERTY_STATUS = require('../constants/propertyStatus');
const handleValidationErrors = require('./handleValidationErrors');

const userListQueryRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('limit must be between 1 and 50'),
  query('role')
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage(`role must be one of: ${Object.values(ROLES).join(', ')}`),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('search must be 100 characters or fewer'),
];

const propertyListQueryRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('limit must be between 1 and 50'),
  query('status')
    .optional()
    .isIn(Object.values(PROPERTY_STATUS))
    .withMessage(`status must be one of: ${Object.values(PROPERTY_STATUS).join(', ')}`),
  query('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('city must be 100 characters or fewer'),
  query('agentId')
    .optional()
    .isMongoId()
    .withMessage('agentId must be a valid MongoDB ID'),
];

const roleChangeRules = [
  body('role')
    .isIn([ROLES.BUYER, ROLES.AGENT])
    .withMessage('role must be either buyer or agent'),
];

const statusUpdateRules = [
  body('status')
    .isIn(Object.values(PROPERTY_STATUS))
    .withMessage(`status must be one of: ${Object.values(PROPERTY_STATUS).join(', ')}`),
];

module.exports = {
  userListQueryRules,
  propertyListQueryRules,
  roleChangeRules,
  statusUpdateRules,
  handleValidationErrors,
};
