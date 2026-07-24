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

router.get('/', isAuthenticated, getMyFavorites);

router.get(
  '/:propertyId/status',
  isAuthenticated,
  validateObjectId('propertyId'),
  getFavoriteStatus
);

router.post(
  '/:propertyId',
  isAuthenticated,
  validateObjectId('propertyId'),
  toggleFavorite
);

router.delete(
  '/:propertyId',
  isAuthenticated,
  validateObjectId('propertyId'),
  removeFavorite
);

module.exports = router;
