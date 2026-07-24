const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['PROPERTY_INQUIRY', 'PROPERTY_VIEWED','LISTING_EXPIRED', 'SUBSCRIPTION_EXPIRED'],
    required: true
  },
  title: {
    type: String,
    required: true
  },

  // Buyer inquiry fields — only populated for PROPERTY_INQUIRY type
  NAME: {
    type: String
  },
  PHONE: {
    type: String
  },
  INTERESTED_IN_THE_PROPERTY: {
    type: String
  },
  
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: false }); // createdAt handled manually above with index

module.exports = mongoose.model('Notification', notificationSchema);