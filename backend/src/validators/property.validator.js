const { body } = require('express-validator');
const LISTING_TYPES   = require('../constants/listingTypes');
const PROPERTY_STATUS = require('../constants/propertyStatus');
const PROPERTY_TYPES  = require('../constants/propertyTypes');
const handleValidationErrors = require('./handleValidationErrors');


const titleRule = body('title')
  .trim()
  .notEmpty()
  .withMessage('Title is required')
  .isLength({ max: 150 })
  .withMessage('Title must be 150 characters or fewer');

const descriptionRule = body('description')
  .trim()
  .notEmpty()
  .withMessage('Description is required')
  .isLength({ max: 2000 })
  .withMessage('Description must be 2000 characters or fewer');

const priceRule = body('price')
  .isFloat({ min: 0 })
  .withMessage('Price must be a positive number');

const listingTypeRule = body('listingType')
  .isIn(Object.values(LISTING_TYPES))
  .withMessage(`listingType must be one of: ${Object.values(LISTING_TYPES).join(', ')}`);

const propertyTypeRule = body('propertyType')
  .isIn(Object.values(PROPERTY_TYPES))
  .withMessage(`propertyType must be one of: ${Object.values(PROPERTY_TYPES).join(', ')}`);

const addressRule = body('address')
  .trim()
  .notEmpty()
  .withMessage('Address is required')
  .isLength({ max: 200 })
  .withMessage('Address must be 200 characters or fewer');

const cityRule = body('city')
  .trim()
  .notEmpty()
  .withMessage('City is required')
  .isLength({ max: 100 })
  .withMessage('City must be 100 characters or fewer');

const regionRule = body('region')
  .trim()
  .notEmpty()
  .withMessage('Region is required')
  .isLength({ max: 100 })
  .withMessage('Region must be 100 characters or fewer');

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

const statusUpdateRules = [
  body('status')
    .isIn(Object.values(PROPERTY_STATUS))
    .withMessage(`status must be one of: ${Object.values(PROPERTY_STATUS).join(', ')}`),
];

module.exports = {
  createPropertyRules,
  updatePropertyRules,
  statusUpdateRules,
  handleValidationErrors,
};
