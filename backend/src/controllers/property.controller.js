/**
 * property.controller.js
 * ----------------------
 * Handlers for all property CRUD operations.
 *
 * Public:
 *   getProperties    GET  /api/properties
 *   getPropertyById  GET  /api/properties/:id
 *
 * Agent-only (isAgent middleware applied in routes):
 *   createProperty        POST   /api/properties
 *   updateProperty        PUT    /api/properties/:id
 *   deleteProperty        DELETE /api/properties/:id
 *   updatePropertyStatus  PATCH  /api/properties/:id/status
 *   uploadPropertyImages  POST   /api/properties/:id/images
 */

const Property = require('../models/Property');
const User = require('../models/User'); // registers User schema so populate('agent') works
const { uploadToCloudinary } = require('../utils/cloudinary');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a Mongoose query filter object from request query params.
 *
 * Supported params:
 *   keyword      — searches title AND description (case-insensitive regex)
 *   city         — partial match, case-insensitive
 *   region       — partial match, case-insensitive
 *   propertyType — exact enum match
 *   listingType  — exact enum match
 *   status       — exact enum match
 *   minPrice     — price >= value
 *   maxPrice     — price <= value
 *   minBedrooms  — bedrooms >= value
 *   maxBedrooms  — bedrooms <= value
 */
const buildFilter = (query) => {
  const filter = {};

  // --- Keyword search across title and description ---
  if (query.keyword && query.keyword.trim()) {
    const regex = { $regex: query.keyword.trim(), $options: 'i' };
    filter.$or = [{ title: regex }, { description: regex }];
  }

  if (query.city)         filter.city         = { $regex: query.city, $options: 'i' };
  if (query.region)       filter.region       = { $regex: query.region, $options: 'i' };
  if (query.propertyType) filter.propertyType = query.propertyType;
  if (query.listingType)  filter.listingType  = query.listingType;
  if (query.status)       filter.status       = query.status;

  // --- Bedroom range ---
  if (query.minBedrooms || query.maxBedrooms) {
    filter.bedrooms = {};
    if (query.minBedrooms) filter.bedrooms.$gte = Number(query.minBedrooms);
    if (query.maxBedrooms) filter.bedrooms.$lte = Number(query.maxBedrooms);
  }

  // --- Price range ---
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  return filter;
};

/**
 * Map a sort query string to a Mongoose sort object.
 */
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
// GET /api/properties
// ---------------------------------------------------------------------------

const getProperties = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip  = (page - 1) * limit;

    const filter = buildFilter(req.query);
    const sort   = buildSort(req.query.sort);

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate('agent', 'name email phone')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Property.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count:       properties.length,
      total,
      totalPages:  Math.ceil(total / limit),
      currentPage: page,
      data: properties,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/properties/:id
// ---------------------------------------------------------------------------

const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      'agent',
      'name email phone profileImage'
    );

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    res.status(200).json({ success: true, data: property });
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid property ID.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/properties   (agent only)
// ---------------------------------------------------------------------------

const createProperty = async (req, res) => {
  try {
    // Attach the logged-in agent as the owner
    const property = await Property.create({
      ...req.body,
      agent: req.session.userId,
    });

    res.status(201).json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// PUT /api/properties/:id   (agent who created it only)
// ---------------------------------------------------------------------------

const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    // Ownership check — only the agent who created this listing can edit it
    if (property.agent.toString() !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only edit your own listings.',
      });
    }

    // Prevent the client from overriding the agent field or the images array
    const { agent, images, ...allowedUpdates } = req.body;

    const updated = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).populate('agent', 'name email phone');

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid property ID.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/properties/:id   (agent who created it only)
// ---------------------------------------------------------------------------

const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    if (property.agent.toString() !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own listings.',
      });
    }

    await property.deleteOne();

    res.status(200).json({ success: true, message: 'Property deleted successfully.' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid property ID.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/properties/:id/status   (agent who created it only)
// ---------------------------------------------------------------------------

const updatePropertyStatus = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    if (property.agent.toString() !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update the status of your own listings.',
      });
    }

    property.status = req.body.status;
    await property.save();

    res.status(200).json({ success: true, data: property });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid property ID.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/properties/:id/images   (agent who created it only)
// ---------------------------------------------------------------------------

const uploadPropertyImages = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    if (property.agent.toString() !== req.session.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only upload images for your own listings.',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images provided.' });
    }

    // Enforce 10-image cap across existing + new uploads
    const remaining = 10 - property.images.length;
    if (remaining <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Maximum of 10 images per property has been reached.',
      });
    }

    const filesToUpload = req.files.slice(0, remaining);

    // Upload all files in parallel
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
      data: property,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid property ID.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  updatePropertyStatus,
  uploadPropertyImages,
};