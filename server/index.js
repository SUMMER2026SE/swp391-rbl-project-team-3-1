const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const profileRoutes = require('./src/routes/profileRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Redirect trang chủ về home.html (phải đặt TRƯỚC express.static)
app.get('/', (req, res) => {
    res.redirect('/home.html');
});

app.use(express.static('public'));

// Định tuyến API Auth
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

const PORT = process.env.PORT || 5000;

// Khởi chạy Express Server và giữ tiến trình luôn sống bằng mọi giá
app.listen(PORT, () => {
    console.log(`🚀 SERVER ĐÃ KHỞI ĐỘNG THÀNH CÔNG TẠI: http://localhost:${PORT}`);
    console.log('💡 Trạng thái: Sẵn sàng nhận Request từ Postman!');
});

// Đoạn mã bảo hiểm chống sập nguồn Node.js khi database xảy ra lỗi kết nối mạng ngầm
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Phát hiện lỗi bất đồng bộ ngầm của Hệ thống/Database:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('⚠️ Phát hiện lỗi chí mạng hệ thống:', error.message);
});