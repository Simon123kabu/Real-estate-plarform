const express = require('express');
const { isAuthenticated } = require('../middleware/auth.middleware');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

router.use(isAuthenticated);

router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:notificationId/read', notificationController.markAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);
router.post('/inquiry', notificationController.submitPropertyInquiry);

module.exports = router;