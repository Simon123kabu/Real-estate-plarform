/**
 * property.query.validator.js
 * ---------------------------
 * Validates query string parameters for:
 *   GET /api/properties
 *   GET /api/properties/my-listings
 *
 * All params are optional. When provided they must be the correct type
 * so that buildFilter() never receives NaN or invalid values.
 */

const { query } = require('express-validator');
const LISTING_TYPES   = require('../constants/listingTypes');
const PROPERTY_STATUS = require('../constants/propertyStatus');
const PROPERTY_TYPES  = require('../constants/propertyTypes');
const handleValidationErrors = require('./handleValidationErrors');

const propertyQueryRules = [
  // ---- Pagination ----
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('limit must be an integer between 1 and 50')
    .toInt(),

  // ---- Sorting ----
  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'price_asc', 'price_desc'])
    .withMessage('sort must be one of: newest, oldest, price_asc, price_desc'),

  // ---- Enum filters ----
  query('propertyType')
    .optional()
    .isIn(Object.values(PROPERTY_TYPES))
    .withMessage(`propertyType must be one of: ${Object.values(PROPERTY_TYPES).join(', ')}`),

  query('listingType')
    .optional()
    .isIn(Object.values(LISTING_TYPES))
    .withMessage(`listingType must be one of: ${Object.values(LISTING_TYPES).join(', ')}`),

  query('status')
    .optional()
    .isIn(Object.values(PROPERTY_STATUS))
    .withMessage(`status must be one of: ${Object.values(PROPERTY_STATUS).join(', ')}`),

  // ---- Numeric range filters ----
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('minPrice must be a non-negative number')
    .toFloat(),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('maxPrice must be a non-negative number')
    .toFloat(),

  query('minBedrooms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('minBedrooms must be a non-negative integer')
    .toInt(),

  query('maxBedrooms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('maxBedrooms must be a non-negative integer')
    .toInt(),

  // ---- Text search ----
  query('keyword')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('keyword must be 100 characters or fewer'),

  query('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('city must be 100 characters or fewer'),

  query('region')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('region must be 100 characters or fewer'),

  handleValidationErrors,
];

module.exports = { propertyQueryRules };
