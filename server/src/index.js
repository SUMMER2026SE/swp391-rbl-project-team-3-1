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
          { "exercise_name": "Barbell Bench Press", "sets": 3, "reps": 5, "duration_minutes": 3, "calories_burned": 50, "rpe": 8 }
        ]
      },
      {
        "sport_type": "Yoga",
        "title": "Yoga dẻo dai khớp vai",
        "description": "Các tư thế vặn xoắn và giãn cơ mở rộng khớp vai giúp cơ bắp linh hoạt và phục hồi đau nhức cơ.",
        "exercises": [
          { "exercise_name": "Tư thế em bé (Child Pose)", "sets": 3, "reps": 1, "duration_minutes": 2, "calories_burned": 15, "rpe": 3 },
          { "exercise_name": "Tư thế chiến binh (Warrior Pose)", "sets": 3, "reps": 5, "duration_minutes": 2, "calories_burned": 25, "rpe": 5 },
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
          { "exercise_name": "Tư thế xác chết (Savasana)", "sets": 1, "reps": 1, "duration_minutes": 5, "calories_burned": 5, "rpe": 1 }
        ]
      },
      {
        "sport_type": "Boxing",
        "title": "Boxing Cardio Đốt Calo",
        "description": "Rèn luyện thể lực và phản xạ nhanh.",
        "exercises": [
          { "exercise_name": "Đấm thẳng (Jabs & Crosses)", "sets": 4, "reps": 50, "duration_minutes": 2, "calories_burned": 60, "rpe": 6 },
          { "exercise_name": "Đấm móc (Hooks & Uppercuts)", "sets": 4, "reps": 40, "duration_minutes": 2, "calories_burned": 70, "rpe": 7 },
          { "exercise_name": "Di chuyển tránh đòn (Slipping & Weaving)", "sets": 3, "reps": 30, "duration_minutes": 2, "calories_burned": 50, "rpe": 6 }
        ]
      }
    ];

    const mealTemplates = [
      {
        "sport_type": "Gym",
        "title": "Chế độ giảm cân thâm hụt 500kcal",
        "description": "Giàu đạm, ít tinh bột nhanh. Sáng ức gà chiên không dầu, trưa cơm gạo lứt cá hồi, tối salad xanh."
      },
      {
        "sport_type": "Gym",
        "title": "Ăn kiêng Low-Carb cơ bản",
        "description": "Giảm thiểu tinh bột xấu, tăng chất béo tốt. Ưu tiên thịt bò, trứng luộc, quả bơ, rau xanh các bữa chính."
      },
      {
        "sport_type": "Gym",
        "title": "Tăng cơ nạc (Lean Bulking)",
        "description": "Dư thừa nhẹ 200kcal, ưu tiên đạm tinh khiết cho sự phát triển của thớ cơ. Sử dụng yến mạch, whey protein hỗ trợ."
      },
      {
        "sport_type": "Yoga",
        "title": "Thực đơn thuần chay thanh lọc",
        "description": "Chế độ ăn nhẹ nhàng, giàu chất xơ và vitamin để cơ thể dẻo dai. Sáng sinh tố bơ chuối, trưa salad đậu hũ, tối súp rau củ thanh đạm."
      },
      {
        "sport_type": "Yoga",
        "title": "Thực đơn dinh dưỡng duy trì vóc dáng",
        "description": "Cân bằng tinh bột phức and đạm thực vật. Tốt cho sức khỏe và tim mạch."
      },
      {
        "sport_type": "Boxing",
        "title": "Thực đơn võ sĩ tăng cơ đốt mỡ",
        "description": "Bữa ăn giàu protein và tinh bột hấp thụ chậm để duy trì năng lượng tập luyện cao. Sáng bò áp chảo, trưa cơm trắng + ức gà, tối cá hồi hấp."
      }
    ];

    const [workoutConfig, createdW] = await models.AppConfigs.findOrCreate({
      where: { config_key: 'workout_templates' },
      defaults: {
        config_value: JSON.stringify(workoutTemplates),
        description: 'Workout Plan templates filtered by sport types'
      }
    });
    if (!createdW) {
      await workoutConfig.update({ config_value: JSON.stringify(workoutTemplates) });
    }

    const [mealConfig, createdM] = await models.AppConfigs.findOrCreate({
      where: { config_key: 'meal_templates' },
      defaults: {
        config_value: JSON.stringify(mealTemplates),
        description: 'Meal Plan templates filtered by sport types'
      }
    });
    if (!createdM) {
      await mealConfig.update({ config_value: JSON.stringify(mealTemplates) });
    }
    console.log('✅ Workout and Meal templates initialized in AppConfigs');
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

// Mount AI routes
const aiRoutes = require('./routes/aiRoutes');
app.use('/api/ai', aiRoutes);
