/**
 * favorite.controller.js
 * ----------------------
 * Handlers for the Favorites feature.
 *
 * All routes require isAuthenticated — user id comes from req.session.userId.
 *
 *   toggleFavorite    POST   /api/favorites/:propertyId
 *   getMyFavorites    GET    /api/favorites
 *   getFavoriteStatus GET    /api/favorites/:propertyId/status
 *   removeFavorite    DELETE /api/favorites/:propertyId
 */

const Favorite = require('../models/Favorite');
const Property = require('../models/Property');

// ---------------------------------------------------------------------------
// POST /api/favorites/:propertyId   — Toggle save / unsave
// ---------------------------------------------------------------------------

const toggleFavorite = async (req, res) => {
  try {
    const userId     = req.session.userId;
    const propertyId = req.params.propertyId;

    // Confirm the property exists before creating a favorite for it
    const propertyExists = await Property.exists({ _id: propertyId });
    if (!propertyExists) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    // Check if already saved
    const existing = await Favorite.findOne({ user: userId, property: propertyId });

    if (existing) {
      // Already saved — remove it
      await existing.deleteOne();
      return res.status(200).json({
        success: true,
        saved:   false,
        message: 'Property removed from favorites.',
      });
    }

    // Not saved yet — create it
    await Favorite.create({ user: userId, property: propertyId });
    return res.status(201).json({
      success: true,
      saved:   true,
      message: 'Property added to favorites.',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid property ID.' });
    }
    // Mongo duplicate-key error (11000) — race condition where the unique index
    // fired before our findOne caught it. Treat as "already saved".
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        saved:   true,
        message: 'Property is already in your favorites.',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/favorites   — My saved listings (paginated)
// ---------------------------------------------------------------------------

const getMyFavorites = async (req, res) => {
  try {
    const userId = req.session.userId;

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip  = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      Favorite.find({ user: userId })
        .populate({
          path: 'property',
          select: 'title price city region listingType propertyType status bedrooms bathrooms area images agent',
          populate: {
            path:   'agent',
            select: 'name email phone',
          },
        })
        .sort({ createdAt: -1 }) // most recently saved first
        .skip(skip)
        .limit(limit),
      Favorite.countDocuments({ user: userId }),
    ]);

    // Filter out any favorites whose property was deleted after it was saved
    const valid = favorites.filter((f) => f.property !== null);

    res.status(200).json({
      success:     true,
      count:       valid.length,
      total,
      totalPages:  Math.ceil(total / limit),
      currentPage: page,
      data:        valid,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/favorites/:propertyId/status   — Is this property saved by me?
// ---------------------------------------------------------------------------

const getFavoriteStatus = async (req, res) => {
  try {
    const userId     = req.session.userId;
    const propertyId = req.params.propertyId;

    const exists = await Favorite.exists({ user: userId, property: propertyId });

    res.status(200).json({ success: true, saved: Boolean(exists) });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid property ID.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/favorites/:propertyId   — Explicitly remove a favorite
// ---------------------------------------------------------------------------

const removeFavorite = async (req, res) => {
  try {
    const userId     = req.session.userId;
    const propertyId = req.params.propertyId;

    const favorite = await Favorite.findOneAndDelete({
      user:     userId,
      property: propertyId,
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'This property is not in your favorites.',
      });
    }

    res.status(200).json({
      success: true,
      saved:   false,
      message: 'Property removed from favorites.',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid property ID.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  toggleFavorite,
  getMyFavorites,
  getFavoriteStatus,
  removeFavorite,
};
