const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

// SSE Stream route parses token from query parameters, so it doesn't use the standard header authMiddleware
router.get('/stream', notificationController.streamNotifications);

// All other notification routes require standard Authorization header verification
router.use(authMiddleware);

router.get('/', notificationController.getNotifications);
router.put('/read-all', notificationController.markAllRead);
router.put('/:id/read', notificationController.markRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
