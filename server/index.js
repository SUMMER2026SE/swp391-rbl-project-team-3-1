const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const workoutRoutes = require('./src/routes/workoutRoutes');
const mealRoutes = require('./src/routes/mealRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// Định tuyến API Auth
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/workout-plans', workoutRoutes);
app.use('/api/meal-plans', mealRoutes);

// Hỗ trợ Single Page Application (SPA) routing
app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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