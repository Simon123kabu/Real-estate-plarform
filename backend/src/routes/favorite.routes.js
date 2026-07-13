const express = require('express');
const router  = express.Router();

const {
  toggleFavorite,
  getMyFavorites,
  getFavoriteStatus,
  removeFavorite,
} = require('../controllers/favorite.controller');

const { isAuthenticated } = require('../middleware/auth.middleware');
const validateObjectId     = require('../middleware/validateObjectId.middleware');

// All favorites routes require a logged-in session
// (both buyers and agents are allowed — no role restriction)

// GET  /api/favorites  — get my saved listings (paginated)
router.get('/', isAuthenticated, getMyFavorites);

// GET  /api/favorites/:propertyId/status  — is this property saved by me?
// Must be declared BEFORE /:propertyId to avoid Express treating 'status' as an id
router.get(
  '/:propertyId/status',
  isAuthenticated,
  validateObjectId('propertyId'),
  getFavoriteStatus
);

// POST /api/favorites/:propertyId  — toggle save/unsave
router.post(
  '/:propertyId',
  isAuthenticated,
  validateObjectId('propertyId'),
  toggleFavorite
);

// DELETE /api/favorites/:propertyId  — explicitly remove a favorite
router.delete(
  '/:propertyId',
  isAuthenticated,
  validateObjectId('propertyId'),
  removeFavorite
);

module.exports = router;
