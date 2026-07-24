const Favorite     = require('../models/Favorite');
const Property     = require('../models/Property');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ---------------------------------------------------------------------------
// POST /api/favorites/:propertyId  — Toggle save / unsave
// ---------------------------------------------------------------------------

const toggleFavorite = asyncHandler(async (req, res) => {
  const userId     = req.session.userId;
  const propertyId = req.params.propertyId;

  const propertyExists = await Property.exists({ _id: propertyId });
  if (!propertyExists) throw new AppError('Property not found.', 404);

  const existing = await Favorite.findOne({ user: userId, property: propertyId });

  if (existing) {
    await existing.deleteOne();
    return res.status(200).json({
      success: true,
      saved:   false,
      message: 'Property removed from favorites.',
    });
  }

  await Favorite.create({ user: userId, property: propertyId });
  res.status(201).json({
    success: true,
    saved:   true,
    message: 'Property added to favorites.',
  });
});

// ---------------------------------------------------------------------------
// GET /api/favorites  — My saved listings (paginated)
// ---------------------------------------------------------------------------

const getMyFavorites = asyncHandler(async (req, res) => {
  const userId = req.session.userId;

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
  const skip  = (page - 1) * limit;

  const [favorites, total] = await Promise.all([
    Favorite.find({ user: userId })
      .populate({
        path:   'property',
        select: 'title price city region listingType propertyType status bedrooms bathrooms area images agent',
        populate: {
          path:   'agent',
          select: 'name email phone',
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Favorite.countDocuments({ user: userId }),
  ]);

  const valid = favorites.filter((f) => f.property !== null);

  res.status(200).json({
    success:     true,
    count:       valid.length,
    total,
    totalPages:  Math.ceil(total / limit),
    currentPage: page,
    data:        valid,
  });
});

// ---------------------------------------------------------------------------
// GET /api/favorites/:propertyId/status  — Is this property saved by me?
// ---------------------------------------------------------------------------

const getFavoriteStatus = asyncHandler(async (req, res) => {
  const exists = await Favorite.exists({
    user:     req.session.userId,
    property: req.params.propertyId,
  });
  res.status(200).json({ success: true, saved: Boolean(exists) });
});

// ---------------------------------------------------------------------------
// DELETE /api/favorites/:propertyId  — Explicitly remove a favorite
// ---------------------------------------------------------------------------

const removeFavorite = asyncHandler(async (req, res) => {
  const favorite = await Favorite.findOneAndDelete({
    user:     req.session.userId,
    property: req.params.propertyId,
  });

  if (!favorite) {
    throw new AppError('This property is not in your favorites.', 404);
  }

  res.status(200).json({
    success: true,
    saved:   false,
    message: 'Property removed from favorites.',
  });
});

module.exports = {
  toggleFavorite,
  getMyFavorites,
  getFavoriteStatus,
  removeFavorite,
};
