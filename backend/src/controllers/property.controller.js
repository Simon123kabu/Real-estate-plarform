const Property     = require('../models/Property');
const User         = require('../models/User'); 
const AppError     = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const subscriptionService = require('../services/subscription.service');

const buildFilter = (query) => {
  const filter = {};

  if (query.keyword && query.keyword.trim()) {
    const regex = { $regex: query.keyword.trim(), $options: 'i' };
    filter.$or = [{ title: regex }, { description: regex }];
  }

  if (query.city)         filter.city         = { $regex: query.city, $options: 'i' };
  if (query.region)       filter.region       = { $regex: query.region, $options: 'i' };
  if (query.propertyType) filter.propertyType = query.propertyType;
  if (query.listingType)  filter.listingType  = query.listingType;
  if (query.status)       filter.status       = query.status;

  if (query.minBedrooms || query.maxBedrooms) {
    filter.bedrooms = {};
    if (query.minBedrooms) filter.bedrooms.$gte = Number(query.minBedrooms);
    if (query.maxBedrooms) filter.bedrooms.$lte = Number(query.maxBedrooms);
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  return filter;
};

const buildSort = (sortParam) => {
  switch (sortParam) {
    case 'price_asc':  return { price: 1 };
    case 'price_desc': return { price: -1 };
    case 'oldest':     return { createdAt: 1 };
    case 'newest':
    default:           return { createdAt: -1 };
  }
};

// ---------------------------------------------------------------------------
// GET /api/properties  — public list with filters & pagination
// ---------------------------------------------------------------------------

const getProperties = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
  const skip  = (page - 1) * limit;

  const filter = buildFilter(req.query);
  
  // Public listing filter: only active and non-expired listings
  filter.visibility = 'active';
  filter.expiresAt = { $gt: new Date() };

  const sort   = buildSort(req.query.sort);

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .select('title price city region listingType propertyType status bedrooms bathrooms area images agent createdAt')
      .populate('agent', 'name email phone')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Property.countDocuments(filter),
  ]);

  res.status(200).json({
    success:     true,
    count:       properties.length,
    total,
    totalPages:  Math.ceil(total / limit),
    currentPage: page,
    data:        properties,
  });
});

// ---------------------------------------------------------------------------
// GET /api/properties/my-listings  — agent's own listings (agent only)
// ---------------------------------------------------------------------------

const getMyListings = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
  const skip  = (page - 1) * limit;

  // Lock agent filter to session — cannot be spoofed via query params
  const filter = { ...buildFilter(req.query), agent: req.session.userId };
  const sort   = buildSort(req.query.sort);

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .select('title price city region listingType propertyType status bedrooms bathrooms area images agent createdAt expiresAt visibility expiredAt')
      .populate('agent', 'name email phone')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Property.countDocuments(filter),
  ]);

  const quota = await subscriptionService.getQuotaStatus(req.session.userId);

  res.status(200).json({
    success:     true,
    count:       properties.length,
    total,
    totalPages:  Math.ceil(total / limit),
    currentPage: page,
    quota: {
      plan: quota.plan,
      effectivePlan: quota.effectivePlan,
      maxActiveListings: quota.maxActiveListings,
      activeListings: quota.activeListings,
      canCreateListing: quota.canCreateListing
    },
    data:        properties,
  });
});

// ---------------------------------------------------------------------------
// GET /api/properties/:id  — single property detail
// ---------------------------------------------------------------------------

const getPropertyById = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id)
    .populate('agent', 'name email phone profileImage')
    .lean();
  if (!property) throw new AppError('Property not found.', 404);

  const isOwner = req.session && req.session.userId && property.agent && property.agent._id.toString() === req.session.userId;
  const isExpired = property.expiresAt && property.expiresAt <= new Date();
  const isActive = property.visibility === 'active';

  if (!isOwner && (!isActive || isExpired)) {
    throw new AppError('Property not found.', 404);
  }

  res.status(200).json({ success: true, data: property });
});

// ---------------------------------------------------------------------------
// POST /api/properties  — create a new listing (agent only)
// ---------------------------------------------------------------------------

const createProperty = asyncHandler(async (req, res) => {
  const expiresAt = req.subscriptionQuota?.subscriptionEndsAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const property = await Property.create({
    ...req.body,
    agent: req.session.userId,
    expiresAt,
    visibility: 'active'
  });
  res.status(201).json({ success: true, data: property });
});

// ---------------------------------------------------------------------------
// PUT /api/properties/:id  — update a listing (owner agent only)
// ---------------------------------------------------------------------------

const updateProperty = asyncHandler(async (req, res) => {
  const { agent, images, ...allowedUpdates } = req.body;

  const updated = await Property.findOneAndUpdate(
    { _id: req.params.id, agent: req.session.userId },
    { $set: allowedUpdates },
    { new: true, runValidators: true }
  ).populate('agent', 'name email phone');

  if (!updated) {
    throw new AppError('Property not found or access denied.', 404);
  }

  res.status(200).json({ success: true, data: updated });
});

// ---------------------------------------------------------------------------
// DELETE /api/properties/:id  — delete a listing (owner agent only)
// ---------------------------------------------------------------------------

const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw new AppError('Property not found.', 404);

  if (property.agent.toString() !== req.session.userId) {
    throw new AppError('Access denied. You can only delete your own listings.', 403);
  }

  await property.deleteOne();
  res.status(200).json({ success: true, message: 'Property deleted successfully.' });
});

// ---------------------------------------------------------------------------
// PATCH /api/properties/:id/status  — change status only (owner agent only)
// ---------------------------------------------------------------------------

const updatePropertyStatus = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw new AppError('Property not found.', 404);

  if (property.agent.toString() !== req.session.userId) {
    throw new AppError('Access denied. You can only update the status of your own listings.', 403);
  }

  property.status = req.body.status;
  await property.save();

  res.status(200).json({ success: true, data: property });
});

// ---------------------------------------------------------------------------
// POST /api/properties/:id/images  — upload images (owner agent only)
// ---------------------------------------------------------------------------

const uploadPropertyImages = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw new AppError('Property not found.', 404);

  if (property.agent.toString() !== req.session.userId) {
    throw new AppError('Access denied. You can only upload images for your own listings.', 403);
  }

  if (!req.files || req.files.length === 0) {
    throw new AppError('No images provided.', 400);
  }

  const remaining = 10 - property.images.length;
  if (remaining <= 0) {
    throw new AppError('Maximum of 10 images per property has been reached.', 400);
  }

  const filesToUpload = req.files.slice(0, remaining);

  const uploadedUrls = await Promise.all(
    filesToUpload.map((file) =>
      uploadToCloudinary(file.buffer, `properties/${property._id}`)
    )
  );

  property.images.push(...uploadedUrls);
  await property.save();

  res.status(200).json({
    success: true,
    message: `${uploadedUrls.length} image(s) uploaded successfully.`,
    data:    property,
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/properties/:id/images  — remove a single image (owner agent only)
// ---------------------------------------------------------------------------

const deletePropertyImage = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw new AppError('Property not found.', 404);

  if (property.agent.toString() !== req.session.userId) {
    throw new AppError('Access denied. You can only edit your own listings.', 403);
  }

  const { imageUrl } = req.body;
  if (!imageUrl) throw new AppError('imageUrl is required in the request body.', 400);

  if (!property.images.includes(imageUrl)) {
    throw new AppError('Image not found on this property listing.', 404);
  }

  await deleteFromCloudinary(imageUrl);

  property.images = property.images.filter((img) => img !== imageUrl);
  await property.save();

  res.status(200).json({
    success: true,
    message: 'Image removed successfully.',
    data: property,
  });
});

module.exports = {
  getProperties,
  getMyListings,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  updatePropertyStatus,
  uploadPropertyImages,
  deletePropertyImage,
};