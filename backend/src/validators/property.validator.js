const { body, validationResult } = require('express-validator');
const LISTING_TYPES = require('../constants/listingTypes');
const PROPERTY_STATUS = require('../constants/propertyStatus');
const PROPERTY_TYPES = require('../constants/propertyTypes');

// ---- Shared field validators ----

const titleRule = body('title')
  .trim()
  .notEmpty()
  .withMessage('Title is required')
  .isLength({ max: 150 })
  .withMessage('Title must be 150 characters or fewer');

const descriptionRule = body('description')
  .trim()
  .notEmpty()
  .withMessage('Description is required');

const priceRule = body('price')
  .isFloat({ min: 0 })
  .withMessage('Price must be a positive number');

const listingTypeRule = body('listingType')
  .isIn(Object.values(LISTING_TYPES))
  .withMessage(`listingType must be one of: ${Object.values(LISTING_TYPES).join(', ')}`);

const propertyTypeRule = body('propertyType')
  .isIn(Object.values(PROPERTY_TYPES))
  .withMessage(`propertyType must be one of: ${Object.values(PROPERTY_TYPES).join(', ')}`);

const addressRule = body('address').trim().notEmpty().withMessage('Address is required');
const cityRule = body('city').trim().notEmpty().withMessage('City is required');
const regionRule = body('region').trim().notEmpty().withMessage('Region is required');

const bedroomsRule = body('bedrooms')
  .optional()
  .isInt({ min: 0 })
  .withMessage('Bedrooms must be a non-negative integer');

const bathroomsRule = body('bathrooms')
  .optional()
  .isFloat({ min: 0 })
  .withMessage('Bathrooms must be a non-negative number');

const areaRule = body('area')
  .optional()
  .isFloat({ min: 0 })
  .withMessage('Area must be a positive number (in sq ft)');

// ---- Rule sets ----

/**
 * Rules for POST /api/properties (create)
 * All required fields are enforced.
 */
const createPropertyRules = [
  titleRule,
  descriptionRule,
  priceRule,
  listingTypeRule,
  propertyTypeRule,
  addressRule,
  cityRule,
  regionRule,
  bedroomsRule,
  bathroomsRule,
  areaRule,
];

/**
 * Rules for PUT /api/properties/:id (full or partial update)
 * Every field is optional — the controller applies only what is sent.
 */
const updatePropertyRules = [
  titleRule.optional(),
  descriptionRule.optional(),
  priceRule.optional(),
  listingTypeRule.optional(),
  propertyTypeRule.optional(),
  addressRule.optional(),
  cityRule.optional(),
  regionRule.optional(),
  bedroomsRule,
  bathroomsRule,
  areaRule,
];

/**
 * Rules for PATCH /api/properties/:id/status
 * Only validates the `status` field.
 */
const statusUpdateRules = [
  body('status')
    .isIn(Object.values(PROPERTY_STATUS))
    .withMessage(`status must be one of: ${Object.values(PROPERTY_STATUS).join(', ')}`),
];

/**
 * Shared error handler — same pattern used in auth.validator.js
 * Run this AFTER any rule set in the route definition.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = {
  createPropertyRules,
  updatePropertyRules,
  statusUpdateRules,
  handleValidationErrors,
};
