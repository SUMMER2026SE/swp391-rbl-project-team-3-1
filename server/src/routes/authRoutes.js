const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 1. Tuyến đường Đăng ký cũ của bạn (Giữ nguyên)
router.post('/register', authController.register);

// 2. Tuyến đường Đăng nhập mới thêm vào hệ thống
router.post('/login', authController.login);

module.exports = router;