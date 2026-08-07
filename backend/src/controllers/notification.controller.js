const notificationService = require('../services/notification.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// Get user notifications
exports.getNotifications = asyncHandler(async (req, res) => {
  const { limit = 20, skip = 0 } = req.query;
  const userId = req.session.userId;

  const data = await notificationService.getUserNotifications(userId, parseInt(limit), parseInt(skip));

  res.status(200).json({
    success: true,
    data
  });
});

// Mark notification as read — ownership enforced
exports.markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.session.userId;

  const notification = await notificationService.markAsRead(notificationId, userId);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  res.status(200).json({
    success: true,
    data: notification
  });
});

// Mark all as read
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.session.userId;

  await notificationService.markAllAsRead(userId);

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// Delete notification — ownership enforced
exports.deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.session.userId;

  const deleted = await notificationService.deleteNotification(notificationId, userId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found or access denied'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Notification deleted'
  });
});

// Submit property inquiry
exports.submitPropertyInquiry = asyncHandler(async (req, res) => {
  const targetPropertyId = req.body.propertyId || req.params.id || req.params.propertyId;

  // Accept both camelCase and legacy SCREAMING_CASE field names
  const name  = req.body.name  || req.body.NAME;
  const phone = req.body.phone || req.body.PHONE;
  const message = req.body.message || req.body.interestedIn || req.body.INTERESTED_IN_THE_PROPERTY;

  const senderId = req.session ? req.session.userId : null;

  // Validate required fields
  if (!targetPropertyId) {
    return res.status(400).json({
      success: false,
      message: 'propertyId is required to submit an inquiry.'
    });
  }

  if (!name || !phone || !message) {
    return res.status(400).json({
      success: false,
      message: 'name, phone, and message are required.'
    });
  }

  const Property = require('../models/Property');
  const property = await Property.findById(targetPropertyId);

  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found.'
    });
  }

  const notification = await notificationService.createNotification({
    userId: property.agent,
    type: 'PROPERTY_INQUIRY',
    title: `New inquiry for ${property.title}`,
    NAME: name,
    PHONE: phone,
    INTERESTED_IN_THE_PROPERTY: message,
    propertyId: targetPropertyId,
    senderId
  });

  await notificationService.emitNotification(property.agent, notification);

  res.status(201).json({
    success: true,
    message: 'Inquiry submitted successfully',
    data: {
      _id: notification._id,
      name: notification.NAME,
      phone: notification.PHONE,
      message: notification.INTERESTED_IN_THE_PROPERTY,
      createdAt: notification.createdAt
    }
  });
});