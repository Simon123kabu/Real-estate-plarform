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

// Mark notification as read
exports.markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await notificationService.markAsRead(notificationId);

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

// Delete notification
exports.deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  await notificationService.deleteNotification(notificationId);

  res.status(200).json({
    success: true,
    message: 'Notification deleted'
  });
});

// Submit property inquiry - SIMPLIFIED TO SEND ONLY 3 FIELDS
exports.submitPropertyInquiry = asyncHandler(async (req, res) => {
  const { propertyId, NAME, PHONE, INTERESTED_IN_THE_PROPERTY } = req.body;
  const senderId = req.session.userId;

  // Validate required fields
  if (!NAME || !PHONE || !INTERESTED_IN_THE_PROPERTY) {
    return res.status(400).json({
      success: false,
      message: 'NAME, PHONE, and INTERESTED_IN_THE_PROPERTY are required'
    });
  }

  const Property = require('../models/Property');
  const property = await Property.findById(propertyId);

  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }

  const notification = await notificationService.createNotification({
    userId: property.agent,   
    type: 'PROPERTY_INQUIRY',
    title: `New inquiry for ${property.title}`,
    NAME,
    PHONE,
    INTERESTED_IN_THE_PROPERTY,
    propertyId,
    senderId
  });

  await notificationService.emitNotification(property.agent, notification);

  res.status(201).json({
    success: true,
    message: 'Inquiry submitted successfully',
    data: {
      _id: notification._id,
      NAME: notification.NAME,
      PHONE: notification.PHONE,
      INTERESTED_IN_THE_PROPERTY: notification.INTERESTED_IN_THE_PROPERTY,
      createdAt: notification.createdAt
    }
  });
});