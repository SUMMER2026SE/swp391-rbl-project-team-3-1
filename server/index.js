const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const profileRoutes = require('./src/routes/profileRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // đường dẫn tuyệt đối, tránh lỗi 404 ảnh avatar

// Định tuyến API
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 SERVER ĐÃ KHỞI ĐỘNG THÀNH CÔNG TẠI: http://localhost:${PORT}`);
    console.log('💡 Trạng thái: Sẵn sàng nhận Request từ Postman!');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Phát hiện lỗi bất đồng bộ ngầm của Hệ thống/Database:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('⚠️ Phát hiện lỗi chí mạng hệ thống:', error.message);
});