const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// 1. Tuyến đường Đăng ký cũ của bạn (Giữ nguyên)
router.post('/register', authController.register);

// 2. Tuyến đường Đăng nhập mới thêm vào hệ thống
router.post('/login', authController.login);

// 3. Các tuyến đường đổi mật khẩu và quên/đặt lại mật khẩu mới
router.post('/change-password', authMiddleware, authController.changePassword);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;