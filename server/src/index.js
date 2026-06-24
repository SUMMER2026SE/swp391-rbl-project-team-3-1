const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { poolPromise } = require('./config/db');

const app = express();

// Cho phép CORS kết nối từ Frontend Client
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Simple request logger for debugging
app.use((req, res, next) => {
  console.log('[REQ]', req.method, req.path);
  next();
});

// API Home chính
app.get('/', (req, res) => res.json({ message: 'Gym API running!' }));

// API Kiểm tra trạng thái kết nối cơ sở dữ liệu
app.get('/api/db-status', async (req, res) => {
  try {
    const pool = await poolPromise;
    if (!pool) {
      return res.status(500).json({
        status: 'disconnected',
        message: 'Không thể kết nối đến cơ sở dữ liệu SQL Server. Vui lòng bật DB Server hoặc kiểm tra lại file .env!',
        config: {
          server: process.env.DB_SERVER || 'localhost',
          database: process.env.DB_NAME,
          user: process.env.DB_USER
        }
      });
    }

    // Thực hiện truy vấn kiểm tra nhanh
    const result = await pool.request().query('SELECT 1 as conn_test');
    
    res.json({
      status: 'connected',
      message: '🔌 Kết nối cơ sở dữ liệu Microsoft SQL Server (FxFitnessCenterDB) hoạt động hoàn hảo!',
      config: {
        server: process.env.DB_SERVER || 'localhost',
        database: process.env.DB_NAME,
        user: process.env.DB_USER
      }
    });
  } catch (err) {
    console.error('Lỗi khi kiểm tra kết nối DB:', err);
    res.status(500).json({
      status: 'error',
      message: 'Lỗi truy vấn cơ sở dữ liệu: ' + err.message
    });
  }
});

// Mount auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

// Serve uploaded files (avatars, etc.) from top-level uploads folder
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Mount profile routes
const profileRoutes = require('./routes/profileRoutes');
app.use('/api/profile', profileRoutes);

// Mount checkout routes (public: trainers list, plans list)
const checkoutRoutes = require('./routes/checkoutRoutes');
app.use('/api/checkout', checkoutRoutes);

// Mount dashboard analytics and management routes
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/dashboard', dashboardRoutes);

// Mount workout routes
const workoutRoutes = require('./routes/workoutRoutes');
app.use('/api/workout-plans', workoutRoutes);

// Mount meal routes
const mealRoutes = require('./routes/mealRoutes');
app.use('/api/meal-plans', mealRoutes);

// Mount certification routes
const certificationRoutes = require('./routes/certificationRoutes');
app.use('/api/certifications', certificationRoutes);

// Mount progress tracking routes
const progressRoutes = require('./routes/progressRoutes');
app.use('/api/progress', progressRoutes);