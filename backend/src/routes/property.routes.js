const express = require('express');
const router  = express.Router();

const {
  getProperties,
  getMyListings,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  updatePropertyStatus,
  uploadPropertyImages,
} = require('../controllers/property.controller');

const {
  createPropertyRules,
  updatePropertyRules,
  statusUpdateRules,
  handleValidationErrors,
} = require('../validators/property.validator');

const { propertyQueryRules } = require('../validators/property.query.validator');
const validateObjectId        = require('../middleware/validateObjectId.middleware');
const { isAgent }             = require('../middleware/auth.middleware');
const { uploadMultiple }      = require('../middleware/upload.middleware');
const checkListingQuota       = require('../middleware/checkListingQuota.middleware');

router.get('/', propertyQueryRules, getProperties);

// GET /api/properties/my-listings  — agent's own listings (must be before /:id)
router.get('/my-listings', isAgent, propertyQueryRules, getMyListings);

// GET /api/properties/:id  — single property detail
router.get('/:id', validateObjectId('id'), getPropertyById);

// ---- Agent-only routes ----

// POST /api/properties  — create a new listing
router.post('/', isAgent, checkListingQuota, createPropertyRules, handleValidationErrors, createProperty);

// PUT /api/properties/:id  — full or partial update of a listing
router.put(
  '/:id',
  isAgent,
  validateObjectId('id'),
  updatePropertyRules,
  handleValidationErrors,
  updateProperty
);

// DELETE /api/properties/:id  — permanently remove a listing
router.delete('/:id', isAgent, validateObjectId('id'), deleteProperty);

// PATCH /api/properties/:id/status  — change listing status only
router.patch(
  '/:id/status',
  isAgent,
  validateObjectId('id'),
  statusUpdateRules,
  handleValidationErrors,
  updatePropertyStatus
);

// POST /api/properties/:id/images  — upload images (up to 10 total)
router.post(
  '/:id/images',
  isAgent,
  validateObjectId('id'),
  uploadMultiple,
  uploadPropertyImages
);

module.exports = router;