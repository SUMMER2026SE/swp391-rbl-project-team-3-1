const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { poolPromise, models, sequelize } = require('./config/db');

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

// Seeding function for templates
async function seedTemplates() {
  try {
    const workoutTemplates = [
      {
        "sport_type": "Gym",
        "title": "HIIT Đốt Mỡ Nâng Cao",
        "description": "Đốt mỡ cường độ cao cho người thừa cân nhẹ.",
        "exercises": [
          { "exercise_name": "Nhảy dây (Jumping Jacks)", "sets": 3, "reps": 30, "duration_minutes": 1, "calories_burned": 40, "rpe": 7 },
          { "exercise_name": "Squat (Bodyweight)", "sets": 4, "reps": 15, "duration_minutes": 2, "calories_burned": 50, "rpe": 8 },
          { "exercise_name": "Plank giữ cơ bụng", "sets": 3, "reps": 1, "duration_minutes": 1, "calories_burned": 20, "rpe": 6 },
          { "exercise_name": "Burpees", "sets": 4, "reps": 15, "duration_minutes": 2, "calories_burned": 80, "rpe": 9 },
          { "exercise_name": "Mountain Climbers (Leo núi)", "sets": 4, "reps": 30, "duration_minutes": 1, "calories_burned": 45, "rpe": 8 },
          { "exercise_name": "Jumping Lunges", "sets": 3, "reps": 20, "duration_minutes": 2, "calories_burned": 55, "rpe": 8 },
          { "exercise_name": "Chạy nước rút (Sprint)", "sets": 3, "reps": 1, "duration_minutes": 1, "calories_burned": 60, "rpe": 9 }
        ]
      },
      {
        "sport_type": "Gym",
        "title": "Full Body Khởi Đầu",
        "description": "Khởi động cơ xương khớp cho người mới bắt đầu.",
        "exercises": [
          { "exercise_name": "Squat (Bodyweight)", "sets": 3, "reps": 15, "duration_minutes": 2, "calories_burned": 45, "rpe": 6 },
          { "exercise_name": "Push-up (Hít đất)", "sets": 3, "reps": 10, "duration_minutes": 1, "calories_burned": 30, "rpe": 7 },
          { "exercise_name": "Dumbbell Shoulder Press", "sets": 3, "reps": 12, "duration_minutes": 2, "calories_burned": 40, "rpe": 7 },
          { "exercise_name": "Plank giữ cơ bụng", "sets": 3, "reps": 1, "duration_minutes": 1, "calories_burned": 20, "rpe": 5 }
        ]
      },
      {
        "sport_type": "Gym",
        "title": "Powerlifting Cơ Bản",
        "description": "Tập trung xây dựng sức mạnh cơ bắp thô.",
        "exercises": [
          { "exercise_name": "Barbell Squat", "sets": 3, "reps": 5, "duration_minutes": 3, "calories_burned": 60, "rpe": 8 },
          { "exercise_name": "Barbell Deadlift", "sets": 3, "reps": 5, "duration_minutes": 4, "calories_burned": 80, "rpe": 9 },
          { "exercise_name": "Barbell Bench Press", "sets": 3, "reps": 5, "duration_minutes": 3, "calories_burned": 50, "rpe": 8 },
          { "exercise_name": "Barbell Overhead Press (Đẩy vai)", "sets": 3, "reps": 5, "duration_minutes": 3, "calories_burned": 45, "rpe": 8 },
          { "exercise_name": "Barbell Row (Kéo lưng bụng)", "sets": 3, "reps": 5, "duration_minutes": 3, "calories_burned": 48, "rpe": 7 }
        ]
      },
      {
        "sport_type": "Gym",
        "title": "Tập Bụng Core Săn Chắc",
        "description": "Xây dựng cơ bụng khỏe mạnh và săn chắc vòng eo.",
        "exercises": [
          { "exercise_name": "Gập bụng cơ bản (Crunches)", "sets": 4, "reps": 20, "duration_minutes": 2, "calories_burned": 30, "rpe": 6 },
          { "exercise_name": "Russian Twist", "sets": 4, "reps": 24, "duration_minutes": 2, "calories_burned": 35, "rpe": 7 },
          { "exercise_name": "Nâng chân (Leg Raises)", "sets": 3, "reps": 15, "duration_minutes": 2, "calories_burned": 28, "rpe": 7 },
          { "exercise_name": "Bicycle Crunches (Đạp xe)", "sets": 3, "reps": 20, "duration_minutes": 2, "calories_burned": 32, "rpe": 7 },
          { "exercise_name": "Plank liên sườn (Side Plank)", "sets": 3, "reps": 1, "duration_minutes": 1, "calories_burned": 25, "rpe": 7 }
        ]
      },
      {
        "sport_type": "Yoga",
        "title": "Yoga dẻo dai khớp vai",
        "description": "Các tư thế vặn xoắn và giãn cơ mở rộng khớp vai giúp cơ bắp linh hoạt và phục hồi đau nhức cơ.",
        "exercises": [
          { "exercise_name": "Tư thế em bé (Child Pose)", "sets": 3, "reps": 1, "duration_minutes": 2, "calories_burned": 15, "rpe": 3 },
          { "exercise_name": "Tư thế chiến binh (Warrior Pose)", "sets": 3, "reps": 5, "duration_minutes": 2, "calories_burned": 25, "rpe": 5 },
          { "exercise_name": "Tư thế chó úp mặt (Downward Dog)", "sets": 3, "reps": 1, "duration_minutes": 2, "calories_burned": 20, "rpe": 4 },
          { "exercise_name": "Tư thế nhân sư (Sphinx Pose)", "sets": 3, "reps": 1, "duration_minutes": 2, "calories_burned": 18, "rpe": 3 },
          { "exercise_name": "Giãn cơ vai (Shoulder Stretch)", "sets": 3, "reps": 5, "duration_minutes": 2, "calories_burned": 20, "rpe": 4 }
        ]
      },
      {
        "sport_type": "Yoga",
        "title": "Yoga cân bằng tâm trí",
        "description": "Giúp bình tâm và thư giãn hệ thần kinh.",
        "exercises": [
          { "exercise_name": "Tư thế cây (Tree Pose)", "sets": 3, "reps": 1, "duration_minutes": 2, "calories_burned": 10, "rpe": 2 },
          { "exercise_name": "Tư thế tam giác (Triangle Pose)", "sets": 3, "reps": 5, "duration_minutes": 2, "calories_burned": 20, "rpe": 4 },
          { "exercise_name": "Tư thế chiến binh III (Warrior III)", "sets": 3, "reps": 3, "duration_minutes": 2, "calories_burned": 22, "rpe": 6 },
          { "exercise_name": "Tư thế ngồi thiền (Lotus Pose)", "sets": 1, "reps": 1, "duration_minutes": 5, "calories_burned": 8, "rpe": 1 },
          { "exercise_name": "Tư thế xác chết (Savasana)", "sets": 1, "reps": 1, "duration_minutes": 5, "calories_burned": 5, "rpe": 1 }
        ]
      },
      {
        "sport_type": "Yoga",
        "title": "Yoga Trị Liệu Cột Sống",
        "description": "Giảm đau lưng, tăng tính linh hoạt của cột sống và điều chỉnh tư thế.",
        "exercises": [
          { "exercise_name": "Tư thế Bò - Mèo (Cat-Cow)", "sets": 3, "reps": 10, "duration_minutes": 2, "calories_burned": 15, "rpe": 3 },
          { "exercise_name": "Tư thế Cây Cầu (Bridge Pose)", "sets": 3, "reps": 8, "duration_minutes": 2, "calories_burned": 18, "rpe": 4 },
          { "exercise_name": "Tư thế Vặn Mình (Spinal Twist)", "sets": 3, "reps": 6, "duration_minutes": 2, "calories_burned": 14, "rpe": 3 },
          { "exercise_name": "Tư thế Rắn Hổ Mang Giãn (Cobra Stretch)", "sets": 3, "reps": 5, "duration_minutes": 2, "calories_burned": 16, "rpe": 4 },
          { "exercise_name": "Tư thế Luồn Kim (Thread the Needle)", "sets": 3, "reps": 5, "duration_minutes": 2, "calories_burned": 12, "rpe": 3 }
        ]
      },
      {
        "sport_type": "Gym",
        "title": "Upper Body (Cơ Thân Trên)",
        "description": "Phát triển nhóm cơ ngực, lưng, vai và bắp tay săn chắc.",
        "exercises": [
          { "exercise_name": "Hít đất (Push-ups)", "sets": 4, "reps": 12, "duration_minutes": 2, "calories_burned": 35, "rpe": 7 },
          { "exercise_name": "Kéo xà đơn (Pull-ups)", "sets": 3, "reps": 8, "duration_minutes": 3, "calories_burned": 40, "rpe": 8 },
          { "exercise_name": "Dumbbell Bicep Curls", "sets": 3, "reps": 12, "duration_minutes": 2, "calories_burned": 25, "rpe": 6 }
        ]
      },
      {
        "sport_type": "Gym",
        "title": "Lower Body (Cơ Thân Dưới)",
        "description": "Tập trung các nhóm cơ đùi trước, đùi sau và cơ mông khỏe khoắn.",
        "exercises": [
          { "exercise_name": "Barbell Squats", "sets": 4, "reps": 10, "duration_minutes": 3, "calories_burned": 70, "rpe": 8 },
          { "exercise_name": "Romanian Deadlifts", "sets": 3, "reps": 12, "duration_minutes": 2, "calories_burned": 60, "rpe": 7 },
          { "exercise_name": "Walking Lunges", "sets": 3, "reps": 12, "duration_minutes": 2, "calories_burned": 50, "rpe": 7 }
        ]
      },
      {
        "sport_type": "Yoga",
        "title": "Yoga Vinyasa Năng Động",
        "description": "Chuỗi chuyển động nhịp nhàng kết hợp nhịp thở sâu giúp tăng tuần hoàn máu.",
        "exercises": [
          { "exercise_name": "Chào mặt trời A (Sun Salutation A)", "sets": 3, "reps": 1, "duration_minutes": 3, "calories_burned": 30, "rpe": 5 },
          { "exercise_name": "Tư thế rắn hổ mang (Cobra Pose)", "sets": 3, "reps": 5, "duration_minutes": 2, "calories_burned": 15, "rpe": 4 },
          { "exercise_name": "Tư thế chiến binh II (Warrior II)", "sets": 3, "reps": 5, "duration_minutes": 2, "calories_burned": 25, "rpe": 5 }
        ]
      }
    ];

    const [workoutConfig, createdW] = await models.AppConfigs.findOrCreate({
      where: { config_key: 'workout_templates' },
      defaults: {
        config_value: JSON.stringify(workoutTemplates),
        description: 'Workout Plan templates filtered by sport types'
      }
    });
    // Force write raw Unicode to bypass TEXT non-unicode parameter binding of Sequelize
    const escapedJson = JSON.stringify(workoutTemplates).replace(/'/g, "''");
    await sequelize.query(`
      UPDATE AppConfigs 
      SET config_value = N'${escapedJson}' 
      WHERE config_key = 'workout_templates'
    `);
    console.log('✅ Workout templates initialized in AppConfigs');
  } catch (err) {
    console.error('❌ Error seeding templates:', err);
  }
}

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
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await seedTemplates();
});

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

// Mount booking routes
const bookingRoutes = require('./routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);

// Mount workout routes
const workoutRoutes = require('./routes/workoutRoutes');
app.use('/api/workout-plans', workoutRoutes);


// Mount certification routes
const certificationRoutes = require('./routes/certificationRoutes');
app.use('/api/certifications', certificationRoutes);

// Mount progress tracking routes
const progressRoutes = require('./routes/progressRoutes');
app.use('/api/progress', progressRoutes);

// Mount AI routes
const aiRoutes = require('./routes/aiRoutes');
app.use('/api/ai', aiRoutes);

// Mount notification routes
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

