const express = require('express');
const router = express.Router();

const {
  getProperties,
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

const { isAgent } = require('../middleware/auth.middleware');
const { uploadMultiple } = require('../middleware/upload.middleware');

// ---- Public routes (no auth required) ----

// GET /api/properties          — list with filters & pagination
router.get('/', getProperties);

// GET /api/properties/:id      — single property detail
router.get('/:id', getPropertyById);

// ---- Agent-only routes ----

// POST /api/properties         — create a new listing
router.post('/', isAgent, createPropertyRules, handleValidationErrors, createProperty);

// PUT /api/properties/:id      — full or partial update of a listing
router.put('/:id', isAgent, updatePropertyRules, handleValidationErrors, updateProperty);

// DELETE /api/properties/:id   — permanently remove a listing
router.delete('/:id', isAgent, deleteProperty);

// PATCH /api/properties/:id/status — change listing status only
router.patch(
  '/:id/status',
  isAgent,
  statusUpdateRules,
  handleValidationErrors,
  updatePropertyStatus
);

// POST /api/properties/:id/images — upload images (up to 10 total)
router.post('/:id/images', isAgent, uploadMultiple, uploadPropertyImages);

module.exports = router;