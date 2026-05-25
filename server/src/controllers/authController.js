const { models } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// =====================================================
// 1. API ĐĂNG KÝ (GIỮ NGUYÊN HOÀN TOÀN LOGIC CŨ CỦA BẠN)
// =====================================================
exports.register = async (req, res) => {
    try {
        const { fullName, email, password, phoneNumber, gender } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                message: 'Vui lòng điền đầy đủ fullName, email và password.'
            });
        }

        const existingUser = await models.Users.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email này đã được sử dụng!' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await models.Users.create({
            full_name: fullName,
            email: email,
            password_hash: passwordHash,
            phone_number: phoneNumber,
            gender: gender,
            role_id: 1, // Mặc định là Member
            status: 'Inactive'
        });

        return res.status(201).json({
            message: 'Đăng ký tài khoản thành công! Trạng thái: Chờ kích hoạt.'
        });

    } catch (error) {
        console.error('❌ Lỗi Đăng ký:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi đăng ký!', error: error.message });
    }
};

// =====================================================
// 2. API ĐĂNG NHẬP (THÊM MỚI VÀO HỆ THỐNG)
// =====================================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra xem người dùng đã điền đủ thông tin chưa
        if (!email || !password) {
            return res.status(400).json({
                message: 'Vui lòng nhập đầy đủ email và password.'
            });
        }

        // Tìm tài khoản trong database theo email
        const user = await models.Users.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác!' });
        }

        // So sánh mật khẩu người dùng nhập vào với mật khẩu đã băm trong database
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác!' });
        }

        // Kiểm tra trạng thái tài khoản (Chỉ cho phép trạng thái 'Active' đăng nhập)
        if (user.status === 'Inactive') {
            return res.status(403).json({ message: 'Tài khoản chưa được kích hoạt!' });
        }
        if (user.status === 'Locked') {
            return res.status(403).json({ message: 'Tài khoản này hiện đang bị khóa!' });
        }

        // Tạo mã token JWT phục vụ cho việc lưu trạng thái và phân quyền ở Front-end
        const token = jwt.sign(
            { userId: user.user_id, roleId: user.role_id },
            process.env.JWT_SECRET || 'BiMatSieuCap_SWP391',
            { expiresIn: '1d' } // Hết hạn trong 1 ngày
        );

        // Trả về dữ liệu thành công cho Client/Postman
        return res.status(200).json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                userId: user.user_id,
                fullName: user.full_name,
                email: user.email,
                roleId: user.role_id,
                status: user.status
            }
        });

    } catch (error) {
        console.error('❌ Lỗi Đăng nhập:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi đăng nhập!', error: error.message });
    }
};