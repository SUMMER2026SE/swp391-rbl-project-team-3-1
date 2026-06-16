const { models } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

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

        // Nếu tài khoản yêu cầu đổi mật khẩu lần đầu (ví dụ: admin được tạo sẵn)
        if (user.must_change_password || user.status === 'MustChangePassword') {
            return res.status(200).json({
                message: 'Tài khoản cần đổi mật khẩu lần đầu.',
                mustChangePassword: true,
                user: {
                    userId: user.user_id,
                    email: user.email,
                    roleId: user.role_id,
                    status: user.status
                }
            });
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

// =====================================================
// 3. HÀM GỬI EMAIL ĐẶT LẠI MẬT KHẨU QUA NODEMAILER
// =====================================================
const sendResetEmail = async (email, resetLink) => {
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER || '',
            pass: process.env.EMAIL_PASS || ''
        }
    });

    const mailOptions = {
        from: `"FxFitness Center" <${process.env.EMAIL_USER || 'no-reply@fxfitness.com'}>`,
        to: email,
        subject: 'Yêu cầu đặt lại mật khẩu - FxFitness Center',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #28a745; margin: 0;">FxFitness Center</h2>
                    <p style="font-size: 14px; color: #666; margin: 5px 0 0 0;">Hệ thống tập luyện chuyên nghiệp</p>
                </div>
                <div style="line-height: 1.6; color: #333333;">
                    <p>Xin chào,</p>
                    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản FxFitness của bạn. Vui lòng bấm vào liên kết dưới đây để thực hiện đổi mật khẩu mới (Liên kết này có hiệu lực trong vòng 15 phút):</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block;">ĐẶT LẠI MẬT KHẨU</a>
                    </div>
                    <p>Hoặc bạn có thể sao chép liên kết này và dán vào trình duyệt:</p>
                    <p style="word-break: break-all; color: #007bff; font-size: 13px;">${resetLink}</p>
                    <p style="color: #666; font-size: 13px; margin-top: 20px;">Nếu bạn không yêu cầu thay đổi này, hãy bỏ qua email này. Tài khoản của bạn vẫn an toàn.</p>
                </div>
                <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
                <div style="text-align: center; font-size: 12px; color: #999999;">
                    <p>© 2026 FxFitness Center. All rights reserved.</p>
                </div>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

// =====================================================
// 4. API QUÊN MẬT KHẨU (GỬI LINK RESET QUA EMAIL HOẶC CONSOLE LOG)
// =====================================================
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Vui lòng cung cấp email của tài khoản!' });
        }

        const user = await models.Users.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản với email này!' });
        }

        // Tạo reset token bảo mật dạng dynamic stateless token: JWT_SECRET + password_hash hiện tại
        const secret = (process.env.JWT_SECRET || 'BiMatSieuCap_SWP391') + user.password_hash;
        const resetToken = jwt.sign(
            { userId: user.user_id, email: user.email },
            secret,
            { expiresIn: '15m' } // Reset link hết hạn sau 15 phút
        );

        // Tạo đường dẫn reset link trỏ tới trang chủ (frontend) để hiển thị form đặt lại
        const host = req.get('host');
        const protocol = req.protocol;
        const resetLink = `${protocol}://${host}/index.html?action=reset-password&token=${resetToken}&userId=${user.user_id}`;

        let emailSent = false;
        let emailError = null;

        // Nếu có tài khoản SMTP trong .env thì gửi đi thực tế
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                await sendResetEmail(email, resetLink);
                emailSent = true;
            } catch (err) {
                console.error('❌ Lỗi gửi email qua Nodemailer:', err.message);
                emailError = err.message;
            }
        }

        // Luôn ghi log chi tiết link đặt lại để hỗ trợ debug/test cục bộ ngay lập tức
        console.log('\n=====================================================');
        console.log('🔑 [PASSWORD RESET LINK DETECTED - DEV ONLY]');
        console.log(`Email: ${email}`);
        console.log(`Reset Link: ${resetLink}`);
        console.log('=====================================================\n');

        return res.status(200).json({
            message: emailSent 
                ? 'Đã gửi đường dẫn đặt lại mật khẩu đến email của bạn!' 
                : 'Yêu cầu đặt lại mật khẩu đã được ghi nhận thành công! (Môi trường Dev: hãy sao chép Reset Link trong kết quả bên dưới để kiểm tra).',
            resetLink: resetLink,
            emailSent,
            emailError
        });
    } catch (error) {
        console.error('❌ Lỗi Quên Mật Khẩu:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi xử lý quên mật khẩu!', error: error.message });
    }
};

// =====================================================
// 5. API ĐẶT LẠI MẬT KHẨU MỚI (RESET PASSWORD)
// =====================================================
exports.resetPassword = async (req, res) => {
    try {
        const { token, userId, newPassword } = req.body;

        if (!token || !userId || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin: token, userId và newPassword.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải từ 6 ký tự trở lên!' });
        }

        const user = await models.Users.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng này!' });
        }

        // Xác thực token bằng khóa động (được ký bằng pass hash cũ của chính user đó)
        const secret = (process.env.JWT_SECRET || 'BiMatSieuCap_SWP391') + user.password_hash;
        try {
            jwt.verify(token, secret);
        } catch (err) {
            return res.status(400).json({ message: 'Đường dẫn đặt lại mật khẩu đã hết hạn hoặc không hợp lệ!' });
        }

        // Tiến hành băm mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Cập nhật thông tin mật khẩu mới
        const previousStatus = user.status;
        user.password_hash = newPasswordHash;
        
        // Tự động kích hoạt tài khoản nếu tài khoản đó đang Inactive để tiện cho họ đăng nhập ngay
        if (user.status === 'Inactive') {
            user.status = 'Active';
        }
        await user.save();

        return res.status(200).json({
            message: previousStatus === 'Inactive'
                ? 'Đặt lại mật khẩu thành công và tài khoản đã được kích hoạt! Bạn có thể đăng nhập ngay.'
                : 'Mật khẩu đã được cập nhật thành công! Vui lòng đăng nhập bằng mật khẩu mới.'
        });
    } catch (error) {
        console.error('❌ Lỗi Reset Mật Khẩu:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi đặt lại mật khẩu!', error: error.message });
    }
};

// =====================================================
// 6. API ĐỔI MẬT KHẨU (ĐÒI HỎI ĐĂNG NHẬP / AUTHENTICATED)
// =====================================================
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.userId; // Lấy từ token giải mã được qua middleware

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ cả mật khẩu cũ và mật khẩu mới.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải từ 6 ký tự trở lên!' });
        }

        const user = await models.Users.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản người dùng!' });
        }

        // So sánh mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu cũ nhập vào không chính xác!' });
        }

        // Đảm bảo mật khẩu mới khác mật khẩu cũ
        const isSame = await bcrypt.compare(newPassword, user.password_hash);
        if (isSame) {
            return res.status(400).json({ message: 'Mật khẩu mới không được trùng khớp với mật khẩu cũ!' });
        }

        // Băm và lưu mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(newPassword, salt);
        await user.save();

        return res.status(200).json({ message: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.' });
    } catch (error) {
        console.error('❌ Lỗi Đổi Mật Khẩu:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi đổi mật khẩu!', error: error.message });
    }
};

// =====================================================
// 7. API ĐỔI MẬT KHẨU LẦN ĐẦU (KHÔNG CẦN TOKEN) - DÙNG CHO ADMIN MỚI
// Yêu cầu: { email, oldPassword, newPassword }
// =====================================================
exports.firstTimeChangePassword = async (req, res) => {
    try {
        const { email, oldPassword, newPassword } = req.body;

        if (!email || !oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng cung cấp email, mật khẩu hiện tại và mật khẩu mới.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải từ 6 ký tự trở lên!' });
        }

        const user = await models.Users.findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

        if (!(user.must_change_password || user.status === 'MustChangePassword')) {
            return res.status(400).json({ message: 'Tài khoản không cần đổi mật khẩu lần đầu.' });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' });

        const isSame = await bcrypt.compare(newPassword, user.password_hash);
        if (isSame) return res.status(400).json({ message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.' });

        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(newPassword, salt);
        user.status = 'Active';
        user.must_change_password = false;
        await user.save();

        return res.status(200).json({ message: 'Đổi mật khẩu lần đầu thành công. Vui lòng đăng nhập lại.' });
    } catch (error) {
        console.error('❌ Lỗi firstTimeChangePassword:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi đổi mật khẩu lần đầu!', error: error.message });
    }
};

// =====================================================
// 8. XÁC THỰC EMAIL (Email Verification)
// GET /api/auth/verify-email?token=...
// =====================================================
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: 'Thiếu mã xác thực!' });
        }

        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'BiMatSieuCap_SWP391');
        } catch (err) {
            return res.status(400).json({ message: 'Link xác thực đã hết hạn hoặc không hợp lệ!' });
        }

        const user = await models.Users.findByPk(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        }

        if (user.status === 'Active') {
            return res.status(200).json({ message: 'Tài khoản đã được xác thực trước đó!', alreadyVerified: true });
        }

        // Verify token matches
        if (user.email_verification_token !== token) {
            return res.status(400).json({ message: 'Mã xác thực không hợp lệ!' });
        }

        // Activate the account
        await user.update({
            status: 'Active',
            email_verification_token: null
        });

        // Send welcome email with plan details
        const { sendWelcomeEmail } = require('../utils/emailService');
        try {
            // Get member and membership info
            const member = await models.Members.findOne({
                where: { user_id: user.user_id },
                include: [{
                    model: models.MemberMemberships,
                    as: 'MemberMemberships',
                    include: [{ model: models.MembershipPlans, as: 'membership_plan' }]
                }]
            });

            if (member) {
                const activeMembership = member.MemberMemberships?.find(m => m.membership_status === 'Active');
                if (activeMembership && activeMembership.membership_plan) {
                    const plan = activeMembership.membership_plan;
                    const formatDate = (d) => {
                        const date = new Date(d);
                        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                    };
                    const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

                    await sendWelcomeEmail(user.email, user.full_name, plan.plan_name, {
                        duration: plan.duration_months,
                        price: formatPrice(plan.price),
                        startDate: formatDate(activeMembership.start_date),
                        endDate: formatDate(activeMembership.end_date)
                    });
                }
            }
        } catch (emailErr) {
            console.error('⚠️ Gửi email chào mừng thất bại:', emailErr.message);
        }

        return res.status(200).json({
            message: 'Xác thực email thành công! Tài khoản đã được kích hoạt. Bạn có thể đăng nhập ngay.',
            verified: true
        });
    } catch (error) {
        console.error('❌ Lỗi xác thực email:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi xác thực email!', error: error.message });
    }
};


