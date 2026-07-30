const express = require('express');
const { isAuthenticated } = require('../middleware/auth.middleware');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

// Public endpoint: Allow buyers to submit property inquiries
router.post('/inquiry', notificationController.submitPropertyInquiry);

// Protected endpoints: Manage notification inbox
router.use(isAuthenticated);

router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:notificationId/read', notificationController.markAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;