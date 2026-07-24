const Notification = require('../models/Notification');
const { TYPES, NOTIFICATION_MESSAGES } = require('../constants/notification');
const { getIO } = require('../utils/socket');

class NotificationService {
  // Create and save notification - SIMPLIFIED FOR ONLY 3 FIELDS
  async createNotification(data) {
    try {
      const notification = new Notification({
        userId: data.userId,
        type: data.type,
        title: data.title || NOTIFICATION_MESSAGES[data.type],
        NAME: data.NAME,
        PHONE: data.PHONE,
        INTERESTED_IN_THE_PROPERTY: data.INTERESTED_IN_THE_PROPERTY,
        propertyId: data.propertyId,
        senderId: data.senderId
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(userId, limit = 20, skip = 0) {
    try {
      const notifications = await Notification.find({ userId })
        .populate('propertyId', 'title images')
        .populate('senderId', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await Notification.countDocuments({ userId });
      const unread = await Notification.countDocuments({ userId, isRead: false });

      return { notifications, total, unread };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark as read
  async markAsRead(notificationId) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
      );
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all as read
  async markAllAsRead(userId) {
    try {
      await Notification.updateMany({ userId }, { isRead: true });
      return true;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      await Notification.findByIdAndDelete(notificationId);
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Emit real-time notification via Socket.io - SENDS ONLY 3 FIELDS
  async emitNotification(userId, notification) {
    try {
      const io = getIO();
      if (io) {
        io.to(`user_${userId}`).emit('newNotification', {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          NAME: notification.NAME,
          PHONE: notification.PHONE,
          INTERESTED_IN_THE_PROPERTY: notification.INTERESTED_IN_THE_PROPERTY,
          createdAt: notification.createdAt,
          isRead: notification.isRead
        });
      }
    } catch (error) {
      console.error('Error emitting notification:', error);
    }
  }
}

module.exports = new NotificationService();