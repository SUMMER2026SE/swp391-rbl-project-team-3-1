const { sequelize, models } = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function runSeeder() {
    try {
        console.log('⏳ Bước 1: Đang khởi động kết nối database hệ thống...');

        // 1. Mã hóa mật khẩu "123456" bằng Bcrypt trực tiếp trong Node.js
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('123456', salt);

        // 2. Định nghĩa dữ liệu 3 tài khoản theo đúng cấu trúc cột trong SQL Server của bạn
        const adminData = {
            full_name: 'Quản Trị Viên',
            email: 'admin@gym.com',
            password_hash: passwordHash,
            phone_number: '0111222333',
            gender: 'Male',
            date_of_birth: '1990-01-01',
            role_id: 3, // Admin
            status: 'Active'
        };

        const trainerData = {
            full_name: 'HLV Nguyễn Văn A',
            email: 'trainer@gym.com',
            password_hash: passwordHash,
            phone_number: '0444555666',
            gender: 'Male',
            date_of_birth: '1995-05-15',
            role_id: 2, // PT
            status: 'Active'
        };

        const memberData = {
            full_name: 'Hội Viên Trần Thị B',
            email: 'member@gym.com',
            password_hash: passwordHash,
            phone_number: '0777888999',
            gender: 'Female',
            date_of_birth: '2000-10-20',
            role_id: 1, // Member
            status: 'Active'
        };

        console.log('⏳ Bước 2: Đang kiểm tra và nạp tài khoản mẫu vào SQL Server...');

        // --- XỬ LÝ TÀI KHOẢN ADMIN ---
        const checkAdmin = await models.Users.findOne({ where: { email: adminData.email } });
        if (!checkAdmin) {
            await models.Users.create(adminData);
            console.log(`  👉 Tạo thành công tài khoản ADMIN: ${adminData.email}`);
        } else {
            console.log(`  ℹ️ Tài khoản ADMIN (${adminData.email}) đã có sẵn.`);
        }

        // --- XỬ LÝ TÀI KHOẢN TRAINER ---
        const checkTrainer = await models.Users.findOne({ where: { email: trainerData.email } });
        if (!checkTrainer) {
            const newTrainerUser = await models.Users.create(trainerData);
            // Đồng bộ tự động sang bảng Trainers để không bị lỗi ràng buộc dữ liệu về sau
            if (models.Trainers) {
                await models.Trainers.create({
                    user_id: newTrainerUser.user_id,
                    specialization: 'Fitness & Bodybuilding',
                    experience_years: 5,
                    experience_description: 'Nhiều năm kinh nghiệm giảng dạy cá nhân',
                    bio: 'Nhiệt tình, chu đáo',
                    rating: 5.0
                });
            }
            console.log(`  👉 Tạo thành công tài khoản TRAINER: ${trainerData.email}`);
        } else {
            console.log(`  ℹ️ Tài khoản TRAINER (${trainerData.email}) đã có sẵn.`);
        }

        // --- XỬ LÝ TÀI KHOẢN MEMBER ---
        const checkMember = await models.Users.findOne({ where: { email: memberData.email } });
        if (!checkMember) {
            const newMemberUser = await models.Users.create(memberData);
            // Đồng bộ tự động sang bảng Members để tính toán chỉ số BMI mẫu
            if (models.Members) {
                await models.Members.create({
                    user_id: newMemberUser.user_id,
                    height: 1.70,
                    weight: 68.0,
                    fitness_goal: 'Tăng cơ giảm mỡ',
                    emergency_contact: '0999888777'
                });
            }
            console.log(`  👉 Tạo thành công tài khoản MEMBER: ${memberData.email}`);
        } else {
            console.log(`  ℹ️ Tài khoản MEMBER (${memberData.email}) đã có sẵn.`);
        }

        console.log('\n🎉 CHÚC MỪNG: Quá trình nạp dữ liệu mẫu hoàn tất, mật khẩu mặc định là: 123456');
        process.exit(0);

    } catch (error) {
        console.error('❌ Thất bại! Đã xảy ra lỗi xung đột cấu trúc:', error.message);
        process.exit(1);
    }
}

runSeeder();
