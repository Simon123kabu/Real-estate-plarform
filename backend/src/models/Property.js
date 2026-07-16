const mongoose = require('mongoose');
const LISTING_TYPES = require('../constants/listingTypes');
const PROPERTY_STATUS = require('../constants/propertyStatus');
const PROPERTY_TYPES = require('../constants/propertyTypes');
const LISTING_VISIBILITY = require('../constants/listingVisibility');

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    listingType: {
      type: String,
      enum: Object.values(LISTING_TYPES),
      required: true,
    },
    propertyType: {
      type: String,
      enum: Object.values(PROPERTY_TYPES),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PROPERTY_STATUS),
      default: PROPERTY_STATUS.AVAILABLE,
    },
    bedrooms: {
      type: Number,
      default: 0,
    },
    bathrooms: {
      type: Number,
      default: 0,
    },
    // Area is stored in square feet. Use consistent units throughout the app.
    area: {
      type: Number,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
      index: true,
    },
    region: {
      type: String,
      required: true,
      index: true,
    },
    // Cloudinary URLs stored after upload
    images: [
      {
        type: String,
      },
    ],
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
    },
    visibility: {
      type: String,
      enum: Object.values(LISTING_VISIBILITY),
      default: LISTING_VISIBILITY.ACTIVE,
    },
    expiredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound index to speed up common filter combinations
propertySchema.index({ city: 1, propertyType: 1, price: 1 });
propertySchema.index({ listingType: 1, status: 1 });
propertySchema.index({ visibility: 1, expiresAt: 1 });
propertySchema.index({ agent: 1, visibility: 1, expiresAt: 1 });

// Clean up orphaned favorites when a property is deleted
propertySchema.post('deleteOne', { document: true, query: false }, async function () {
  const Favorite = mongoose.model('Favorite');
  await Favorite.deleteMany({ property: this._id });
});

module.exports = mongoose.model('Property', propertySchema);