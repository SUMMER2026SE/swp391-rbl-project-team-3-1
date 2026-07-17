const nodemailer = require('nodemailer');

// Tạo transporter dùng chung cho toàn hệ thống
const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER || process.env.SMTP_USER,
            pass: process.env.EMAIL_PASS || process.env.SMTP_PASS
        }
    });
};

// =====================================================
// HELPER: Gửi email chung
// =====================================================
const sendEmail = async (to, subject, html) => {
    const transporter = createTransporter();
    const mailOptions = {
        from: `"FX Fitness Center" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`,
        to,
        subject,
        html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Email send failed to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

// =====================================================
// 1. EMAIL XÁC THỰC TÀI KHOẢN (Verification)
// =====================================================
const sendVerificationEmail = async (email, fullName, verificationLink) => {
    const subject = '🔐 Xác thực tài khoản FX Fitness Center của bạn';
    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px;">FX FITNESS</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; letter-spacing: 1px;">BỨT PHÁ GIỚI HẠN</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 40px 30px; color: #e0e0e0;">
            <h2 style="color: #f97316; margin: 0 0 20px; font-size: 22px;">Chào mừng, ${fullName}! 🎉</h2>
            <p style="line-height: 1.8; font-size: 15px; margin: 0 0 15px;">
                Cảm ơn bạn đã đăng ký tài khoản tại <strong style="color: #f97316;">FX Fitness Center</strong>. 
                Chỉ còn một bước cuối cùng để kích hoạt tài khoản của bạn!
            </p>
            <p style="line-height: 1.8; font-size: 15px; margin: 0 0 30px;">
                Vui lòng nhấn vào nút bên dưới để xác thực email của bạn:
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); color: #ffffff; padding: 16px 48px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(249,115,22,0.4);">
                    ✅ XÁC THỰC EMAIL
                </a>
            </div>
            
            <p style="font-size: 13px; color: #888; line-height: 1.6; margin: 20px 0 0;">
                Hoặc sao chép đường dẫn sau vào trình duyệt:<br>
                <a href="${verificationLink}" style="color: #f97316; word-break: break-all; font-size: 12px;">${verificationLink}</a>
            </p>
            
            <div style="background: rgba(249,115,22,0.1); border-left: 4px solid #f97316; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-size: 13px; color: #ccc;">
                    ⏰ Lưu ý: Link xác thực này có hiệu lực trong vòng <strong style="color: #f97316;">24 giờ</strong>.
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #0a0a0a; padding: 25px 30px; text-align: center; border-top: 1px solid #222;">
            <p style="margin: 0; font-size: 12px; color: #666;">© 2026 FX Fitness Center. All rights reserved.</p>
            <p style="margin: 8px 0 0; font-size: 11px; color: #555;">Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.</p>
        </div>
    </div>`;

    return sendEmail(email, subject, html);
};

// =====================================================
// 1b. EMAIL GỬI MÃ OTP XÁC MINH ĐĂNG KÝ GUEST (OTP Verification)
// =====================================================
const sendOtpEmail = async (email, fullName, otp) => {
    const subject = '🔐 Mã OTP xác minh tài khoản FX Fitness Center';
    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px;">FX FITNESS</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; letter-spacing: 1px;">MÃ XÁC THỰC TÀI KHOẢN</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 40px 30px; color: #e0e0e0;">
            <h2 style="color: #f97316; margin: 0 0 20px; font-size: 22px;">Xin chào, ${fullName}! 🎉</h2>
            <p style="line-height: 1.8; font-size: 15px; margin: 0 0 15px;">
                Cảm ơn bạn đã đăng ký tài khoản tại <strong style="color: #f97316;">FX Fitness Center</strong>. 
                Vui lòng sử dụng mã OTP dưới đây để hoàn tất việc xác minh tài khoản của bạn:
            </p>
            
            <!-- OTP Box -->
            <div style="text-align: center; margin: 35px 0;">
                <div style="display: inline-block; background: rgba(249,115,22,0.1); border: 2.5px dashed #f97316; border-radius: 12px; padding: 15px 40px;">
                    <span style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #ffffff; font-family: 'Courier New', Courier, monospace;">${otp}</span>
                </div>
            </div>
            
            <p style="line-height: 1.8; font-size: 15px; margin: 0 0 30px; text-align: center; color: #aaa;">
                Mã xác thực này có hiệu lực trong vòng <strong style="color: #f97316;">10 phút</strong>.
            </p>
            
            <div style="background: rgba(239,68,68,0.1); border-left: 4px solid #ef4444; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-size: 13px; color: #f87171;">
                    ⚠️ Tuyệt đối không chia sẻ mã OTP này với bất kỳ ai để bảo mật thông tin cá nhân.
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #0a0a0a; padding: 25px 30px; text-align: center; border-top: 1px solid #222;">
            <p style="margin: 0; font-size: 12px; color: #666;">© 2026 FX Fitness Center. All rights reserved.</p>
            <p style="margin: 8px 0 0; font-size: 11px; color: #555;">Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.</p>
        </div>
    </div>`;

    return sendEmail(email, subject, html);
};

// =====================================================
// 2. EMAIL CHÀO MỪNG + XÁC NHẬN GÓI TẬP (Welcome)
// =====================================================
const sendWelcomeEmail = async (email, fullName, planName, planDetails) => {
    const subject = '🏋️ Chào mừng bạn đến FX Fitness Center! Thông tin gói tập của bạn';
    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px;">FX FITNESS</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">✅ ĐĂNG KÝ THÀNH CÔNG</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 40px 30px; color: #e0e0e0;">
            <h2 style="color: #10b981; margin: 0 0 20px; font-size: 22px;">Xin chào ${fullName}! 💪</h2>
            <p style="line-height: 1.8; font-size: 15px; margin: 0 0 20px;">
                Tài khoản của bạn đã được <strong style="color: #10b981;">kích hoạt thành công</strong>! 
                Dưới đây là thông tin gói tập bạn đã đăng ký:
            </p>
            
            <!-- Plan Info Card -->
            <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #10b981; margin: 0 0 15px; font-size: 18px;">📋 ${planName}</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #999; font-size: 14px;">Thời hạn:</td>
                        <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right; font-weight: 600;">${planDetails.duration} tháng</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #999; font-size: 14px; border-top: 1px solid #333;">Giá gói:</td>
                        <td style="padding: 8px 0; color: #10b981; font-size: 14px; text-align: right; font-weight: 700; border-top: 1px solid #333;">${planDetails.price}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #999; font-size: 14px; border-top: 1px solid #333;">Ngày bắt đầu:</td>
                        <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right; font-weight: 600; border-top: 1px solid #333;">${planDetails.startDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #999; font-size: 14px; border-top: 1px solid #333;">Ngày kết thúc:</td>
                        <td style="padding: 8px 0; color: #fff; font-size: 14px; text-align: right; font-weight: 600; border-top: 1px solid #333;">${planDetails.endDate}</td>
                    </tr>
                    ${planDetails.trainerName ? `
                    <tr>
                        <td style="padding: 8px 0; color: #999; font-size: 14px; border-top: 1px solid #333;">Huấn luyện viên:</td>
                        <td style="padding: 8px 0; color: #f97316; font-size: 14px; text-align: right; font-weight: 600; border-top: 1px solid #333;">🏆 ${planDetails.trainerName}</td>
                    </tr>` : ''}
                    ${planDetails.services ? `
                    <tr>
                        <td colspan="2" style="padding: 12px 0 0; color: #999; font-size: 14px; border-top: 1px solid #333;">Dịch vụ đã đăng ký:</td>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding: 4px 0 8px; color: #10b981; font-size: 14px; font-weight: 600;">${planDetails.services}</td>
                    </tr>` : ''}
                </table>
            </div>
            
            <p style="line-height: 1.8; font-size: 15px; margin: 20px 0;">
                Hãy đăng nhập vào hệ thống để bắt đầu hành trình luyện tập nhé! 🚀
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #0a0a0a; padding: 25px 30px; text-align: center; border-top: 1px solid #222;">
            <p style="margin: 0; font-size: 12px; color: #666;">© 2026 FX Fitness Center. All rights reserved.</p>
        </div>
    </div>`;

    return sendEmail(email, subject, html);
};

// =====================================================
// 3. EMAIL THÔNG BÁO TÀI KHOẢN PT (Trainer Account)
// =====================================================
const sendTrainerAccountEmail = async (email, fullName, tempPassword) => {
    const subject = '🏋️ FX Fitness Center – Thông tin tài khoản Huấn Luyện Viên của bạn';
    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px;">FX FITNESS</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">🎓 TÀI KHOẢN HUẤN LUYỆN VIÊN</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 40px 30px; color: #e0e0e0;">
            <h2 style="color: #8b5cf6; margin: 0 0 20px; font-size: 22px;">Chào mừng HLV ${fullName}! 🎉</h2>
            <p style="line-height: 1.8; font-size: 15px; margin: 0 0 20px;">
                Quản trị viên đã tạo cho bạn một tài khoản <strong style="color: #8b5cf6;">Huấn Luyện Viên (PT)</strong> 
                trên hệ thống FX Fitness Center. Dưới đây là thông tin đăng nhập:
            </p>
            
            <!-- Account Info Card -->
            <div style="background: rgba(99,102,241,0.1); border: 1px solid rgba(139,92,246,0.3); border-radius: 12px; padding: 25px; margin: 25px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #999; font-size: 14px;">📧 Email đăng nhập:</td>
                        <td style="padding: 10px 0; color: #fff; font-size: 14px; text-align: right; font-weight: 600;">${email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #999; font-size: 14px; border-top: 1px solid #333;">🔑 Mật khẩu tạm:</td>
                        <td style="padding: 10px 0; color: #f97316; font-size: 16px; text-align: right; font-weight: 700; font-family: monospace; border-top: 1px solid #333;">${tempPassword}</td>
                    </tr>
                </table>
            </div>
            
            <div style="background: rgba(239,68,68,0.1); border-left: 4px solid #ef4444; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-size: 13px; color: #f87171;">
                    ⚠️ <strong>Quan trọng:</strong> Vui lòng đăng nhập và <strong>ĐỔI MẬT KHẨU NGAY</strong> trong lần đăng nhập đầu tiên để đảm bảo an toàn tài khoản!
                </p>
            </div>
            
            <p style="line-height: 1.8; font-size: 15px; margin: 20px 0;">
                Chúc bạn có những buổi huấn luyện hiệu quả cùng các học viên! 💪
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #0a0a0a; padding: 25px 30px; text-align: center; border-top: 1px solid #222;">
            <p style="margin: 0; font-size: 12px; color: #666;">© 2026 FX Fitness Center. All rights reserved.</p>
            <p style="margin: 8px 0 0; font-size: 11px; color: #555;">Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
    </div>`;

    return sendEmail(email, subject, html);
};

const sendAccountGrantedEmail = async (email, fullName, roleName, tempPassword) => {
    const subject = '🔑 FX Fitness Center – Cấp tài khoản truy cập hệ thống';
    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px;">FX FITNESS</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; text-transform: uppercase;">🔑 CẤP TÀI KHOẢN HỆ THỐNG</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 40px 30px; color: #e0e0e0;">
            <h2 style="color: #f97316; margin: 0 0 20px; font-size: 22px;">Chào bạn, ${fullName}! 🎉</h2>
            <p style="line-height: 1.8; font-size: 15px; margin: 0 0 20px;">
                Quản trị viên đã cấp cho bạn một tài khoản truy cập hệ thống với vai trò <strong style="color: #f97316;">${roleName}</strong> tại FX Fitness Center.
                Dưới đây là thông tin đăng nhập tạm thời của bạn:
            </p>
            
            <!-- Account Info Card -->
            <div style="background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.3); border-radius: 12px; padding: 25px; margin: 25px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #999; font-size: 14px;">Vai trò:</td>
                        <td style="padding: 10px 0; color: #fff; font-size: 14px; text-align: right; font-weight: 600;">${roleName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #999; font-size: 14px; border-top: 1px solid #333;">📧 Email đăng nhập:</td>
                        <td style="padding: 10px 0; color: #fff; font-size: 14px; text-align: right; font-weight: 600;">${email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #999; font-size: 14px; border-top: 1px solid #333;">🔑 Mật khẩu tạm:</td>
                        <td style="padding: 10px 0; color: #f97316; font-size: 16px; text-align: right; font-weight: 700; font-family: monospace; border-top: 1px solid #333;">${tempPassword}</td>
                    </tr>
                </table>
            </div>
            
            <div style="background: rgba(239,68,68,0.1); border-left: 4px solid #ef4444; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-size: 13px; color: #f87171;">
                    ⚠️ <strong>Quan trọng:</strong> Đây là mật khẩu tạm thời. Bạn cần đăng nhập và thực hiện <strong>ĐỔI MẬT KHẨU LẦN ĐẦU</strong> để kích hoạt tài khoản hoạt động bình thường!
                </p>
            </div>
            
            <p style="line-height: 1.8; font-size: 15px; margin: 20px 0;">
                Hân hạnh được đồng hành cùng bạn tại FX Fitness Center! 💪
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background: #0a0a0a; padding: 25px 30px; text-align: center; border-top: 1px solid #222;">
            <p style="margin: 0; font-size: 12px; color: #666;">© 2026 FX Fitness Center. All rights reserved.</p>
            <p style="margin: 8px 0 0; font-size: 11px; color: #555;">Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
    </div>`;

    return sendEmail(email, subject, html);
};

// =====================================================
// 5. EMAIL GỬI MÃ QR CHECK-IN CHO MEMBER
// =====================================================
const sendCheckinQrEmail = async (email, fullName, memberId, qrDataUrl, checkinUrl) => {
    const subject = '🏋️ FX Fitness Center – Mã QR Check-in của bạn';
    const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f0f15; background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333344;">
        <!-- Header -->
        <div style="background-color: #e65100; background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); padding: 35px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">FX FITNESS</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px; letter-spacing: 1px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">MÃ QR CHECK-IN VÀO PHÒNG TẬP</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 35px 24px; color: #e2e8f0; text-align: center; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
            <h2 style="color: #f97316; margin: 0 0 12px; font-size: 22px; font-weight: 700;">Xin chào, ${fullName}! 💪</h2>
            <p style="line-height: 1.6; font-size: 15px; margin: 0 0 24px; color: #cbd5e1;">
                Đây là mã QR check-in của bạn tại <strong style="color: #f97316;">FX Fitness Center</strong>.<br>
                Hãy đưa mã QR này cho lễ tân quét khi vào phòng tập.
            </p>
            
            <!-- QR Code Image -->
            <div style="background-color: #ffffff; display: inline-block; padding: 16px; border-radius: 12px; margin: 5px 0 20px 0; box-shadow: 0 8px 30px rgba(0,0,0,0.4);">
                <img src="${qrDataUrl}" alt="QR Check-in Code" width="220" height="220" style="display: block; border: 0;" />
            </div>
            
            <br>
            
            <!-- Member ID Info -->
            <div style="background-color: #271a15; border: 1.5px solid #ef4444; border-radius: 10px; padding: 12px 24px; margin: 0 0 24px 0; display: inline-block; min-width: 180px; text-align: center;">
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; font-weight: bold;">MÃ HỘI VIÊN</div>
                <div style="font-size: 24px; font-weight: 800; color: #f97316; letter-spacing: 1px;">#${memberId}</div>
            </div>
            
            <div style="background-color: #13271d; border-left: 4px solid #10b981; padding: 14px 20px; margin: 0 0 20px 0; border-radius: 0 8px 8px 0; text-align: left;">
                <p style="margin: 0; font-size: 13px; color: #6ee7b7; line-height: 1.5;">
                    ✅ <strong>Hướng dẫn sử dụng:</strong> Mở email này trên điện thoại của bạn, đưa mã QR ở trên cho lễ tân tại quầy để quét xác nhận vào phòng tập.
                </p>
            </div>
            
            <div style="background-color: #2b1717; border-left: 4px solid #ef4444; padding: 12px 20px; margin: 0; border-radius: 0 8px 8px 0; text-align: left;">
                <p style="margin: 0; font-size: 12px; color: #fca5a5; line-height: 1.5;">
                    ⚠️ Mã QR này chỉ dành cho tài khoản của bạn. Vui lòng không chia sẻ cho người khác để tránh sai lệch lịch sử luyện tập.
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #0c0c12; padding: 25px 24px; text-align: center; border-top: 1px solid #222233; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
            <p style="margin: 0; font-size: 12px; color: #64748b;">© 2026 FX Fitness Center. All rights reserved.</p>
            <p style="margin: 6px 0 0; font-size: 11px; color: #475569;">Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
    </div>`;
 
    return sendEmail(email, subject, html);
};

module.exports = {
    sendEmail,
    sendVerificationEmail,
    sendOtpEmail,
    sendWelcomeEmail,
    sendTrainerAccountEmail,
    sendAccountGrantedEmail,
    sendCheckinQrEmail
};
