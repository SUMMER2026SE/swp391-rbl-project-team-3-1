const { models } = require('../config/db');
const notificationEmitter = require('../utils/notificationEmitter');
const jwt = require('jsonwebtoken');

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = await models.Notifications.findAll({
      where: { user_id: userId },
      order: [['notification_id', 'DESC']],
      limit: 20
    });
    return res.status(200).json({ notifications });
  } catch (error) {
    console.error('❌ Error getting notifications:', error);
    return res.status(500).json({ message: 'Lỗi server khi lấy thông báo!' });
  }
};

// PUT /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    await models.Notifications.update(
      { is_read: true },
      { where: { user_id: userId, is_read: false } }
    );
    return res.status(200).json({ message: 'Đã đánh dấu đọc tất cả thông báo!' });
  } catch (error) {
    console.error('❌ Error marking all read:', error);
    return res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái thông báo!' });
  }
};

// PUT /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const notification = await models.Notifications.findOne({
      where: { notification_id: id, user_id: userId }
    });
    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo!' });
    }
    await notification.update({ is_read: true });
    return res.status(200).json({ message: 'Đã đánh dấu đọc thông báo!' });
  } catch (error) {
    console.error('❌ Error marking notification read:', error);
    return res.status(500).json({ message: 'Lỗi server!' });
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const deletedCount = await models.Notifications.destroy({
      where: { notification_id: id, user_id: userId }
    });
    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo để xóa!' });
    }
    return res.status(200).json({ message: 'Đã xóa thông báo!' });
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    return res.status(500).json({ message: 'Lỗi server!' });
  }
};

// GET /api/notifications/stream
exports.streamNotifications = (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ message: 'Không tìm thấy token để thiết lập luồng stream!' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'BiMatSieuCap_SWP391');
  } catch (error) {
    console.error('❌ SSE Connection JWT Error:', error.message);
    return res.status(401).json({ message: 'Token không hợp lệ!' });
  }

  const userId = decoded.userId;

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Send comment keep-alive every 20 seconds to prevent connection drops
  const keepAliveInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 20000);

  // Send an initial event acknowledging connection
  res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);

  // Event listener function for direct user notifications
  const onNotificationCreated = (eventData) => {
    // Only send notification if it matches the authenticated user ID
    if (Number(eventData.user_id) === Number(userId)) {
      res.write(`data: ${JSON.stringify(eventData.notification)}\n\n`);
    }
  };

  // Event listener function for system-wide / global real-time events
  const onGlobalEvent = (data) => {
    if (!data.userId || Number(data.userId) === Number(userId)) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  };

  notificationEmitter.on('notification_created', onNotificationCreated);
  notificationEmitter.on('global_event', onGlobalEvent);

  // Clean up connection
  req.on('close', () => {
    clearInterval(keepAliveInterval);
    notificationEmitter.off('notification_created', onNotificationCreated);
    notificationEmitter.off('global_event', onGlobalEvent);
    console.log(`[SSE] Closed connection for user ID: ${userId}`);
  });
};
