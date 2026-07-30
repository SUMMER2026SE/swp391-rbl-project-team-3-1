const { Sequelize } = require('sequelize');
require('dotenv').config();

// Khởi tạo Sequelize (nếu project dùng ORM ở một số chỗ)
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD || process.env.DB_PASS,
    {
        host: process.env.DB_SERVER || process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT) || 1433,
        dialect: 'mssql',
        logging: false,
        dialectOptions: {
            options: {
                encrypt: false,
                trustServerCertificate: true,
                connectionTimeout: 5000,
                requestTimeout: 10000
            }
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 10000,
            idle: 10000
        }
    }
);

let models = {};

try {
    const initModels = require('../models/init-models');
    models = initModels(sequelize);
    console.log('✅ Đã nạp danh sách Models thành công!');

    // Tự động tạo bảng CheckIns nếu chưa tồn tại
    sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CheckIns' and xtype='U')
      BEGIN
        CREATE TABLE CheckIns (
          checkin_id INT IDENTITY(1,1) PRIMARY KEY,
          member_id INT NULL FOREIGN KEY REFERENCES Members(member_id),
          trainer_id INT NULL FOREIGN KEY REFERENCES Trainers(trainer_id),
          checkin_time DATETIME NOT NULL DEFAULT GETDATE(),
          checkout_time DATETIME NULL
        )
      END
    `).then(() => {
        console.log('✅ Đã kiểm tra/tạo bảng CheckIns thành công!');
        
        // Tự động kiểm tra/nâng cấp bảng CheckIns
        return sequelize.query(`
          -- Chuyển member_id thành NULL
          IF EXISTS (
            SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'CheckIns' AND COLUMN_NAME = 'member_id' AND IS_NULLABLE = 'NO'
          )
          BEGIN
            ALTER TABLE CheckIns ALTER COLUMN member_id INT NULL;
          END

          -- Thêm cột trainer_id
          IF NOT EXISTS (
            SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'CheckIns' AND COLUMN_NAME = 'trainer_id'
          )
          BEGIN
            ALTER TABLE CheckIns ADD trainer_id INT NULL FOREIGN KEY REFERENCES Trainers(trainer_id);
          END

          -- Thêm cột checkout_time
          IF NOT EXISTS (
            SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'CheckIns' AND COLUMN_NAME = 'checkout_time'
          )
          BEGIN
            ALTER TABLE CheckIns ADD checkout_time DATETIME NULL;
          END
        `);
    }).then(() => {
        console.log('✅ Đã kiểm tra/cập nhật cấu trúc bảng CheckIns thành công!');

        // Tự động thêm cột QR vào bảng Users
        return sequelize.query(`
          -- Thêm cột qr_token
          IF NOT EXISTS (
            SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'qr_token'
          )
          BEGIN
            ALTER TABLE Users ADD qr_token VARCHAR(64) NULL;
          END

          -- Thêm cột qr_created_at
          IF NOT EXISTS (
            SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'qr_created_at'
          )
          BEGIN
            ALTER TABLE Users ADD qr_created_at DATETIME NULL;
          END

          -- Thêm cột qr_is_active
          IF NOT EXISTS (
            SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'qr_is_active'
          )
          BEGIN
            ALTER TABLE Users ADD qr_is_active BIT NOT NULL DEFAULT 1;
          END
        `);
    }).then(() => {
        console.log('✅ Đã kiểm tra/thêm cột QR vào bảng Users thành công!');

        // Sinh qr_token ngẫu nhiên cho bất kỳ user nào còn thiếu
        return sequelize.query(`SELECT user_id FROM Users WHERE qr_token IS NULL`).then(([users]) => {
          if (users && users.length > 0) {
            console.log(`🔄 Phát hiện ${users.length} tài khoản chưa có mã QR. Đang tiến hành cấp mã...`);
            const crypto = require('crypto');
            const promises = users.map(u => {
              const token = crypto.randomBytes(32).toString('hex');
              return sequelize.query(`
                UPDATE Users 
                SET qr_token = :token, qr_created_at = GETDATE(), qr_is_active = 1
                WHERE user_id = :userId
              `, {
                replacements: { token, userId: u.user_id }
              });
            });
            return Promise.all(promises).then(() => {
              console.log('✅ Đã cấp mã QR thành công cho toàn bộ tài khoản cũ!');
            });
          }
        });
    }).then(() => {
        // Áp dụng các ràng buộc NOT NULL và UNIQUE cho qr_token
        return sequelize.query(`
          IF EXISTS (
            SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'qr_token' AND IS_NULLABLE = 'YES'
          )
          BEGIN
            ALTER TABLE Users ALTER COLUMN qr_token VARCHAR(64) NOT NULL;
          END

          IF NOT EXISTS (
            SELECT * FROM sys.objects 
            WHERE parent_object_id = OBJECT_ID('Users') AND type = 'UQ' AND name = 'UQ_Users_qr_token'
          )
          BEGIN
            ALTER TABLE Users ADD CONSTRAINT UQ_Users_qr_token UNIQUE (qr_token);
          END
        `);
    }).then(() => {
        console.log('✅ Đã cấu hình ràng buộc NOT NULL và UNIQUE cho qr_token thành công!');

        // Tự động thêm cột is_completed vào bảng WorkoutPlans nếu chưa có
        return sequelize.query(`
          IF NOT EXISTS (
            SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'WorkoutPlans' AND COLUMN_NAME = 'is_completed'
          )
          BEGIN
            ALTER TABLE WorkoutPlans ADD is_completed BIT NOT NULL DEFAULT 0;
          END
        `);
    }).then(() => {
        console.log('✅ Đã kiểm tra/thêm cột is_completed vào WorkoutPlans thành công!');
        // 1. Tự động sửa lỗi chính tả HIIIT thành HIIT và thực hiện nâng cấp kiểu dữ liệu cột sang NVARCHAR/NVARCHAR(MAX) an toàn
        return sequelize.query(`
          -- Sửa kiểu dữ liệu các cột từ TEXT sang VARCHAR(MAX) rồi sang NVARCHAR(MAX) để tránh lỗi Msg 273 của SQL Server
          -- AppConfigs.config_value
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AppConfigs' AND COLUMN_NAME = 'config_value' AND DATA_TYPE = 'text')
          BEGIN
            ALTER TABLE AppConfigs ALTER COLUMN config_value VARCHAR(MAX) NOT NULL;
            ALTER TABLE AppConfigs ALTER COLUMN config_value NVARCHAR(MAX) NOT NULL;
          END
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AppConfigs' AND COLUMN_NAME = 'config_value' AND DATA_TYPE = 'varchar')
          BEGIN
            ALTER TABLE AppConfigs ALTER COLUMN config_value NVARCHAR(MAX) NOT NULL;
          END

          -- WorkoutPlans.description
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'WorkoutPlans' AND COLUMN_NAME = 'description' AND DATA_TYPE = 'text')
          BEGIN
            ALTER TABLE WorkoutPlans ALTER COLUMN description VARCHAR(MAX) NULL;
            ALTER TABLE WorkoutPlans ALTER COLUMN description NVARCHAR(MAX) NULL;
          END
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'WorkoutPlans' AND COLUMN_NAME = 'description' AND DATA_TYPE = 'varchar')
          BEGIN
            ALTER TABLE WorkoutPlans ALTER COLUMN description NVARCHAR(MAX) NULL;
          END

          -- AIConsultations.recommended_schedule
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AIConsultations' AND COLUMN_NAME = 'recommended_schedule' AND DATA_TYPE = 'text')
          BEGIN
            ALTER TABLE AIConsultations ALTER COLUMN recommended_schedule VARCHAR(MAX) NULL;
            ALTER TABLE AIConsultations ALTER COLUMN recommended_schedule NVARCHAR(MAX) NULL;
          END
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AIConsultations' AND COLUMN_NAME = 'recommended_schedule' AND DATA_TYPE = 'varchar')
          BEGIN
            ALTER TABLE AIConsultations ALTER COLUMN recommended_schedule NVARCHAR(MAX) NULL;
          END

          -- AIConsultations.recommendation_detail
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AIConsultations' AND COLUMN_NAME = 'recommendation_detail' AND DATA_TYPE = 'text')
          BEGIN
            ALTER TABLE AIConsultations ALTER COLUMN recommendation_detail VARCHAR(MAX) NULL;
            ALTER TABLE AIConsultations ALTER COLUMN recommendation_detail NVARCHAR(MAX) NULL;
          END
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'AIConsultations' AND COLUMN_NAME = 'recommendation_detail' AND DATA_TYPE = 'varchar')
          BEGIN
            ALTER TABLE AIConsultations ALTER COLUMN recommendation_detail NVARCHAR(MAX) NULL;
          END

          -- Notifications.content
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Notifications' AND COLUMN_NAME = 'content' AND DATA_TYPE = 'text')
          BEGIN
            ALTER TABLE Notifications ALTER COLUMN content VARCHAR(MAX) NULL;
            ALTER TABLE Notifications ALTER COLUMN content NVARCHAR(MAX) NULL;
          END
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Notifications' AND COLUMN_NAME = 'content' AND DATA_TYPE = 'varchar')
          BEGIN
            ALTER TABLE Notifications ALTER COLUMN content NVARCHAR(MAX) NULL;
          END

          -- Announcements.content
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Announcements' AND COLUMN_NAME = 'content' AND DATA_TYPE = 'text')
          BEGIN
            ALTER TABLE Announcements ALTER COLUMN content VARCHAR(MAX) NULL;
            ALTER TABLE Announcements ALTER COLUMN content NVARCHAR(MAX) NULL;
          END
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Announcements' AND COLUMN_NAME = 'content' AND DATA_TYPE = 'varchar')
          BEGIN
            ALTER TABLE Announcements ALTER COLUMN content NVARCHAR(MAX) NULL;
          END

          -- Nâng cấp các cột VARCHAR sang NVARCHAR thông thường để hỗ trợ tiếng Việt có dấu
          -- WorkoutPlans.title
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'WorkoutPlans' AND COLUMN_NAME = 'title' AND DATA_TYPE = 'varchar')
          BEGIN
            ALTER TABLE WorkoutPlans ALTER COLUMN title NVARCHAR(200) NULL;
          END

          -- WorkoutExercises.exercise_name
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'WorkoutExercises' AND COLUMN_NAME = 'exercise_name' AND DATA_TYPE = 'varchar')
          BEGIN
            ALTER TABLE WorkoutExercises ALTER COLUMN exercise_name NVARCHAR(100) NULL;
          END

          -- Users.full_name
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'full_name' AND DATA_TYPE = 'varchar')
          BEGIN
            ALTER TABLE Users ALTER COLUMN full_name NVARCHAR(100) NOT NULL;
          END

          -- MembershipPlans.plan_name
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MembershipPlans' AND COLUMN_NAME = 'plan_name' AND DATA_TYPE = 'varchar')
          BEGIN
            ALTER TABLE MembershipPlans ALTER COLUMN plan_name NVARCHAR(100) NOT NULL;
          END
          -- MembershipPlans.description
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MembershipPlans' AND COLUMN_NAME = 'description' AND DATA_TYPE = 'varchar')
          BEGIN
            ALTER TABLE MembershipPlans ALTER COLUMN description NVARCHAR(500) NULL;
          END

          -- Services.service_name
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Services' AND COLUMN_NAME = 'service_name' AND DATA_TYPE = 'varchar')
          BEGIN
            ALTER TABLE Services ALTER COLUMN service_name NVARCHAR(100) NOT NULL;
          END
          -- Services.description
          IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Services' AND COLUMN_NAME = 'description' AND DATA_TYPE = 'varchar')
          BEGIN
            ALTER TABLE Services ALTER COLUMN description NVARCHAR(500) NULL;
          END

          -- Cập nhật sửa lỗi chính tả HIIIT
          UPDATE WorkoutPlans SET title = REPLACE(CAST(title AS NVARCHAR(MAX)), 'HIIIT', 'HIIT'), description = REPLACE(CAST(description AS NVARCHAR(MAX)), 'HIIIT', 'HIIT');

          -- 2. Khôi phục dữ liệu tiếng Việt chuẩn có dấu trên toàn hệ thống bị lỗi "?"
          -- Update Users
          UPDATE Users SET full_name = N'Quản Trị Viên' WHERE user_id = 2;
          UPDATE Users SET full_name = N'HLV Nguyễn Văn A' WHERE user_id = 3;
          UPDATE Users SET full_name = N'Hội Viên Trần Thị B' WHERE user_id = 4;
          UPDATE Users SET full_name = N'Bùi Nguyễn Minh Tuệ' WHERE user_id = 26;
          UPDATE Users SET full_name = N'hương my' WHERE user_id = 66;

          -- Update Members
          UPDATE Members SET fitness_goal = N'Tăng cơ' WHERE member_id IN (1, 20);
          UPDATE Members SET fitness_goal = N'Giảm cân' WHERE member_id = 48;

          -- Update Trainers
          UPDATE Trainers SET bio = N'Nhiệt tình, chu đáo', experience_description = N'Nhiều năm kinh nghiệm giảng dạy cá nhân' WHERE trainer_id IN (1, 2);
          UPDATE Trainers SET specialization = N'yoga' WHERE trainer_id = 6;

          -- Update MembershipPlans
          UPDATE MembershipPlans SET plan_name = N'Gym 3 Tháng', description = N'Truy cập đầy đủ thiết bị Gym. Tặng 2 buổi PT miễn phí (không chọn PT). Đo inbody định kỳ.' WHERE membership_plan_id IN (1, 6);
          UPDATE MembershipPlans SET plan_name = N'Gym 6 Tháng', description = N'Truy cập đầy đủ thiết bị Gym. Tặng 2 buổi PT miễn phí (không chọn PT). Đo inbody định kỳ.' WHERE membership_plan_id IN (2, 7);
          UPDATE MembershipPlans SET plan_name = N'Yoga 6 Tháng', description = N'Thoải mái tham gia các lớp Yoga hàng tuần. Tặng 2 buổi PT Yoga miễn phí (không chọn PT).' WHERE membership_plan_id IN (3, 10);
          UPDATE MembershipPlans SET plan_name = N'Premium Toàn Diện 12 Tháng', description = N'Sử dụng tất cả dịch vụ Gym, Yoga' WHERE membership_plan_id = 5;
          UPDATE MembershipPlans SET plan_name = N'Gym 12 Tháng', description = N'Truy cập đầy đủ thiết bị Gym. Tặng 2 buổi PT miễn phí (không chọn PT). Đo inbody định kỳ.' WHERE membership_plan_id = 8;
          UPDATE MembershipPlans SET plan_name = N'Yoga 3 Tháng', description = N'Thoải mái tham gia các lớp Yoga hàng tuần. Tặng 2 buổi PT Yoga miễn phí (không chọn PT).' WHERE membership_plan_id = 9;
          UPDATE MembershipPlans SET plan_name = N'Yoga 12 Tháng', description = N'Thoải mái tham gia các lớp Yoga hàng tuần. Tặng 2 buổi PT Yoga miễn phí (không chọn PT).' WHERE membership_plan_id = 11;
          UPDATE MembershipPlans SET plan_name = N'Zumba 3 Tháng', description = N'Lớp học Zumba sôi động giải phóng năng lượng cơ thể.' WHERE membership_plan_id = 15;
          UPDATE MembershipPlans SET plan_name = N'Zumba 6 Tháng', description = N'Lớp học Zumba trung cấp cùng các HLV hàng đầu.' WHERE membership_plan_id = 16;
          UPDATE MembershipPlans SET plan_name = N'Zumba 12 Tháng', description = N'Hành trình 1 năm Zumba rực rỡ và tràn đầy niềm vui.' WHERE membership_plan_id = 17;

          -- Update Services
          UPDATE Services SET service_name = N'Dịch vụ PT 1 kèm 1', description = N'Hỗ trợ tập luyện cùng HLV cá nhân' WHERE service_id IN (1, 6, 11, 16, 21, 26, 31);
          UPDATE Services SET service_name = N'Phòng Xông Hơi Sauna', description = N'Sử dụng phòng xông hơi ướt và khô' WHERE service_id IN (2, 7, 12, 17, 22, 27, 32);
          UPDATE Services SET service_name = N'Căng Cơ Chuyên Sâu', description = N'HLV hỗ trợ giãn cơ sau tập luyện' WHERE service_id IN (3, 8, 13, 18, 23, 28, 33);
          UPDATE Services SET service_name = N'Massage Thư Giãn', description = N'Massage trị liệu phục hồi cơ bắp' WHERE service_id IN (4, 9, 14, 19, 24, 29, 34);
          UPDATE Services SET service_name = N'Dịch vụ Khăn Tập', description = N'Cung cấp khăn sạch mỗi ngày khi đến tập' WHERE service_id IN (5, 10, 15, 20, 25, 30, 35);
          UPDATE Services SET service_name = N'Thuê PT (10 buổi)', description = N'Tập luyện 1 kèm 1 theo lộ trình cơ bản, làm quen kỹ thuật.' WHERE service_id = 36;
          UPDATE Services SET service_name = N'Thuê PT (20 buổi)', description = N'Lộ trình chuyên sâu, cải thiện vóc dáng rõ rệt.' WHERE service_id = 37;
          UPDATE Services SET service_name = N'Thuê PT dài hạn (3 tháng)', description = N'Đồng hành 3 tháng liên tục, xây dựng chế độ dinh dưỡng chuyên biệt.' WHERE service_id = 38;
          UPDATE Services SET service_name = N'Thuê PT dài hạn (6 tháng)', description = N'Thay đổi toàn diện, phá vỡ giới hạn bản thân cùng PT.' WHERE service_id = 39;
          UPDATE Services SET service_name = N'Thuê PT dài hạn (9 tháng)', description = N'Gói cam kết hình thể dài hạn, tối ưu hóa sức khỏe trọn vẹn.' WHERE service_id = 40;
          UPDATE Services SET service_name = N'Thuê Khăn (1 tháng)', description = N'Cung cấp khăn sạch mỗi buổi tập.' WHERE service_id = 41;
          UPDATE Services SET service_name = N'Gói Nước Uống (1 tháng)', description = N'Sử dụng nước uống thả ga không giới hạn.' WHERE service_id = 42;
          UPDATE Services SET service_name = N'Phòng Xông Hơi (1 tháng)', description = N'Tự do sử dụng phòng xông hơi ướt/khô.' WHERE service_id = 43;
          UPDATE Services SET service_name = N'Giãn cơ Massage (1 tháng)', description = N'Dịch vụ giãn cơ và massage sau các buổi tập.' WHERE service_id = 44;
          UPDATE Services SET service_name = N'Thuê PT (15 buổi)', description = N'Được quyền CHỌN huấn luyện viên riêng. Tập luyện 1 kèm 1 theo lộ trình thiết kế.' WHERE service_id = 45;
          UPDATE Services SET service_name = N'Thuê PT (30 buổi)', description = N'Được quyền CHỌN huấn luyện viên riêng. Tập luyện 1 kèm 1 theo lộ trình chuyên sâu.' WHERE service_id = 46;

          -- Update WorkoutPlans
          UPDATE WorkoutPlans SET title = N'HIIT Đốt Mỡ Nâng Cao', description = N'Đốt mỡ cường độ cao cho người thừa cân nhẹ.' WHERE title LIKE '%HIIT%' OR title LIKE '%HIIIT%' OR title LIKE '%Đ?t%';
          UPDATE WorkoutPlans SET title = N'Full Body Khởi Đầu', description = N'Khởi động cơ xương khớp cho người mới bắt đầu.' WHERE title LIKE '%Full%' OR title LIKE '%Kh?i%';
          UPDATE WorkoutPlans SET title = N'Powerlifting Cơ Bản', description = N'Tập trung xây dựng sức mạnh cơ bắp thô.' WHERE title LIKE '%Power%';
          UPDATE WorkoutPlans SET title = N'Tập Bụng Core Săn Chắc', description = N'Xây dựng cơ bụng khỏe mạnh và săn chắc vòng eo.' WHERE title LIKE '%B?ng%' OR title LIKE '%Core%';
          UPDATE WorkoutPlans SET title = N'Upper Body (Cơ Thân Trên)', description = N'Phát triển nhóm cơ ngực, lưng, vai và bắp tay săn chắc.' WHERE title LIKE '%Upper%';
          UPDATE WorkoutPlans SET title = N'Lower Body (Cơ Thân Dưới)', description = N'Tập trung các nhóm cơ đùi trước, đùi sau và cơ mông khỏe khoắn.' WHERE title LIKE '%Lower%';

          -- Update WorkoutExercises
          UPDATE WorkoutExercises SET exercise_name = N'Nhảy dây (Jumping Jacks)' WHERE exercise_name LIKE '%Jumping%' OR exercise_name LIKE '%Nh?y%';
          UPDATE WorkoutExercises SET exercise_name = N'Squat (Bodyweight)' WHERE exercise_name LIKE '%Squat%' AND (exercise_name LIKE '%Body%' OR exercise_name LIKE '%weight%');
          UPDATE WorkoutExercises SET exercise_name = N'Plank giữ cơ bụng' WHERE exercise_name LIKE '%Plank%';
          UPDATE WorkoutExercises SET exercise_name = N'Burpees' WHERE exercise_name LIKE '%Burpee%';
          UPDATE WorkoutExercises SET exercise_name = N'Mountain Climbers (Leo núi)' WHERE exercise_name LIKE '%Mountain%' OR exercise_name LIKE '%Leo núi%';
          UPDATE WorkoutExercises SET exercise_name = N'Jumping Lunges' WHERE exercise_name LIKE '%Jumping Lunges%';
          UPDATE WorkoutExercises SET exercise_name = N'Chạy nước rút (Sprint)' WHERE exercise_name LIKE '%Sprint%';
          UPDATE WorkoutExercises SET exercise_name = N'Push-up (Hít đất)' WHERE exercise_name LIKE '%Push%' OR exercise_name LIKE '%Hít%';
          UPDATE WorkoutExercises SET exercise_name = N'Barbell Squat' WHERE exercise_name LIKE '%Barbell Squat%';
          UPDATE WorkoutExercises SET exercise_name = N'Barbell Deadlift' WHERE exercise_name LIKE '%Barbell Deadlift%';
          UPDATE WorkoutExercises SET exercise_name = N'Barbell Bench Press' WHERE exercise_name LIKE '%Barbell Bench%';
          UPDATE WorkoutExercises SET exercise_name = N'Barbell Overhead Press (Đẩy vai)' WHERE exercise_name LIKE '%Overhead%' OR exercise_name LIKE '%Đẩy vai%';
          UPDATE WorkoutExercises SET exercise_name = N'Barbell Row (Kéo lưng bụng)' WHERE exercise_name LIKE '%Barbell Row%' OR exercise_name LIKE '%Kéo lưng%';
          UPDATE WorkoutExercises SET exercise_name = N'Gập bụng cơ bản (Crunches)' WHERE exercise_name LIKE '%Crunch%' OR exercise_name LIKE '%Gập%';
          UPDATE WorkoutExercises SET exercise_name = N'Russian Twist' WHERE exercise_name LIKE '%Russian%';
          UPDATE WorkoutExercises SET exercise_name = N'Nâng chân (Leg Raises)' WHERE exercise_name LIKE '%Leg%' OR exercise_name LIKE '%Nâng%';
          UPDATE WorkoutExercises SET exercise_name = N'Bicycle Crunches (Đạp xe)' WHERE exercise_name LIKE '%Bicycle%' OR exercise_name LIKE '%Đạp%';
          UPDATE WorkoutExercises SET exercise_name = N'Plank liên sườn (Side Plank)' WHERE exercise_name LIKE '%Side Plank%' OR exercise_name LIKE '%liên sườn%';
          UPDATE WorkoutExercises SET exercise_name = N'Tư thế em bé (Child Pose)' WHERE exercise_name LIKE '%Child%';
          UPDATE WorkoutExercises SET exercise_name = N'Tư thế chiến binh (Warrior Pose)' WHERE exercise_name LIKE '%Warrior Pose%';
          UPDATE WorkoutExercises SET exercise_name = N'Tư thế chó úp mặt (Downward Dog)' WHERE exercise_name LIKE '%Downward%' OR exercise_name LIKE '%chó úp%';
          UPDATE WorkoutExercises SET exercise_name = N'Tư thế nhân sư (Sphinx Pose)' WHERE exercise_name LIKE '%Sphinx%' OR exercise_name LIKE '%nhân sư%';
          UPDATE WorkoutExercises SET exercise_name = N'Giãn cơ vai (Shoulder Stretch)' WHERE exercise_name LIKE '%Shoulder%' OR exercise_name LIKE '%Giãn cơ vai%';
          UPDATE WorkoutExercises SET exercise_name = N'Tư thế cây (Tree Pose)' WHERE exercise_name LIKE '%Tree%';
          UPDATE WorkoutExercises SET exercise_name = N'Tư thế tam giác (Triangle Pose)' WHERE exercise_name LIKE '%Triangle%';
          UPDATE WorkoutExercises SET exercise_name = N'Tư thế chiến binh III (Warrior III)' WHERE exercise_name LIKE '%Warrior III%';
          UPDATE WorkoutExercises SET exercise_name = N'Tư thế ngồi thiền (Lotus Pose)' WHERE exercise_name LIKE '%Lotus%' OR exercise_name LIKE '%ngồi thiền%';
          UPDATE WorkoutExercises SET exercise_name = N'Tư thế xác chết (Savasana)' WHERE exercise_name LIKE '%Savasana%' OR exercise_name LIKE '%xác chết%';
          UPDATE WorkoutExercises SET exercise_name = N'Tư thế Bò - Mèo (Cat-Cow)' WHERE exercise_name LIKE '%Cat-Cow%' OR exercise_name LIKE '%Bò - Mèo%';
          UPDATE WorkoutExercises SET exercise_name = N'Tư thế Cây Cầu (Bridge Pose)' WHERE exercise_name LIKE '%Bridge%' OR exercise_name LIKE '%Cây Cầu%';
          UPDATE WorkoutExercises SET exercise_name = N'Tư thế Vặn Mình (Spinal Twist)' WHERE exercise_name LIKE '%Spinal%' OR exercise_name LIKE '%Vặn Mình%';
          UPDATE WorkoutExercises SET exercise_name = N'Tư thế Rắn Hổ Mang Giãn (Cobra Stretch)' WHERE exercise_name LIKE '%Cobra%' OR exercise_name LIKE '%Hổ Mang%';
          UPDATE WorkoutExercises SET exercise_name = N'Tư thế Luồn Kim (Thread the Needle)' WHERE exercise_name LIKE '%Needle%' OR exercise_name LIKE '%Luồn Kim%';
          UPDATE WorkoutExercises SET exercise_name = N'Nhảy dây khởi động (Warmup Jump Rope)' WHERE exercise_name LIKE '%Warmup%' OR exercise_name LIKE '%khởi động%';
        `);
    }).then(() => {
        console.log('✅ Đã sửa đổi kiểu dữ liệu cột sang NVARCHAR và khôi phục dữ liệu tiếng Việt có dấu thành công!');
        
        // 🔄 Chạy di trú cột và bảng cho Gói PT Theo Tháng
        console.log('🔄 Đang kiểm tra cấu trúc bảng MemberTrainerPackages & PtPackageCatalog...');
        return sequelize.query(`
          -- 1. Thêm cột status vào MemberTrainerPackages
          IF NOT EXISTS (
            SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'MemberTrainerPackages' AND COLUMN_NAME = 'status'
          )
          BEGIN
            ALTER TABLE MemberTrainerPackages ADD status VARCHAR(20) NULL DEFAULT 'active';
          END

          -- 2. Thêm cột purchase_date vào MemberTrainerPackages
          IF NOT EXISTS (
            SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'MemberTrainerPackages' AND COLUMN_NAME = 'purchase_date'
          )
          BEGIN
            ALTER TABLE MemberTrainerPackages ADD purchase_date DATETIME NULL DEFAULT GETDATE();
          END

          -- 3. Thêm cột activation_date vào MemberTrainerPackages
          IF NOT EXISTS (
            SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'MemberTrainerPackages' AND COLUMN_NAME = 'activation_date'
          )
          BEGIN
            ALTER TABLE MemberTrainerPackages ADD activation_date DATETIME NULL;
          END

          -- 4. Thêm cột expiry_date vào MemberTrainerPackages
          IF NOT EXISTS (
            SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'MemberTrainerPackages' AND COLUMN_NAME = 'expiry_date'
          )
          BEGIN
            ALTER TABLE MemberTrainerPackages ADD expiry_date DATETIME NULL;
          END

          -- 5. Backfill dữ liệu cũ trong MemberTrainerPackages
          -- Gói cũ đang active (is_active = 1) -> status = 'active', activation_date = created_at
          UPDATE MemberTrainerPackages 
          SET status = 'active', 
              purchase_date = ISNULL(created_at, GETDATE()),
              activation_date = ISNULL(created_at, GETDATE()), 
              expiry_date = DATEADD(month, 3, ISNULL(created_at, GETDATE()))
          WHERE status IS NULL AND is_active = 1;

          -- Gói cũ đã bị ẩn/hết hạn (is_active = 0) -> status = 'expired'
          UPDATE MemberTrainerPackages 
          SET status = 'expired', 
              purchase_date = ISNULL(created_at, GETDATE()),
              activation_date = ISNULL(created_at, GETDATE()), 
              expiry_date = ISNULL(created_at, GETDATE())
          WHERE status IS NULL AND is_active = 0;

          -- 6. Tạo bảng PtPackageCatalog
          IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PtPackageCatalog' and xtype='U')
          BEGIN
            CREATE TABLE PtPackageCatalog (
              id INT IDENTITY(1,1) PRIMARY KEY,
              name NVARCHAR(100) NOT NULL,
              sessions_per_month INT NOT NULL,
              frequency_per_week INT NOT NULL,
              price_1_month DECIMAL(10,2) NOT NULL,
              price_3_months DECIMAL(10,2) NOT NULL,
              price_6_months DECIMAL(10,2) NOT NULL,
              is_active BIT NOT NULL DEFAULT 1
            );
          END
        `).then(() => {
            console.log('✅ Đã di trú cấu trúc gói PT & Tạo bảng PtPackageCatalog thành công!');
            
            // Seed bảng PtPackageCatalog với 4 gói tập chuẩn
            return sequelize.query(`SELECT COUNT(*) as count FROM PtPackageCatalog`).then(([res]) => {
                if (res && res[0].count === 0) {
                    console.log('🌱 Đang seed dữ liệu bảng PtPackageCatalog...');
                    return sequelize.query(`
                      INSERT INTO PtPackageCatalog (name, sessions_per_month, frequency_per_week, price_1_month, price_3_months, price_6_months, is_active)
                      VALUES 
                      (N'PT Nhẹ', 8, 2, 2000000.00, 5500000.00, 10200000.00, 1),
                      (N'PT Tiêu chuẩn', 12, 3, 2800000.00, 7700000.00, 14300000.00, 1),
                      (N'PT Chuyên sâu', 15, 4, 3500000.00, 9600000.00, 17900000.00, 1),
                      (N'PT Cao cấp', 20, 5, 4500000.00, 12400000.00, 23000000.00, 1);
                    `);
                }
            });
        });
    }).catch(err => {
        console.error('❌ Lỗi khi tự động chạy khởi tạo/dọn dẹp/sửa dấu DB:', err.message);
    });
} catch (error) {
    console.error('❌ Lỗi khi khởi tạo Models:', error.message);
}

// Đồng thời export một connection pool dùng `mssql` để các service hiện có (đang dùng poolPromise)
const sql = require('mssql');

const mssqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  server: process.env.DB_SERVER || process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  pool: {
    max: 5,
    min: 0,
    idleTimeoutMillis: 10000
  }
};

const poolPromise = sql.connect(mssqlConfig)
  .then(pool => {
    console.log('✅ MSSQL pool connected');
    return pool;
  })
  .catch(err => {
    console.error('❌ MSSQL pool connection error:', err && err.message ? err.message : err);
    return null;
  });

module.exports = { sequelize, models, poolPromise, sql };
