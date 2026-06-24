const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendResetPasswordEmail(to, resetLink) {
  // If SMTP config available, send real email. Otherwise, log and return null for dev.
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT || 587;
  const from = process.env.FROM_EMAIL || `no-reply@${process.env.HOST || 'localhost'}`;

  if (host && user && pass) {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure: port == 465, // true for 465, false for other ports
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Reset mật khẩu FxFitness',
      html: `<p>Bạn yêu cầu đặt lại mật khẩu. Vui lòng truy cập liên kết bên dưới để đặt lại mật khẩu (hết hạn sau một khoảng thời gian):</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    });

    console.log('Reset email sent:', info.messageId);
    return info;
  }

  console.log(`No SMTP configured. Reset link for ${to}: ${resetLink}`);
  return null;
}

async function sendPTCredentialsEmail(to, fullName, temporaryPassword) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT || 587;
  const from = process.env.FROM_EMAIL || `"FxFitness Center" <${user || 'no-reply@fxfitness.com'}>`;

  if (host && user && pass) {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure: port == 465, // true for 465, false for other ports
      auth: { user, pass },
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #28a745; margin: 0;">FxFitness Center</h2>
          <p style="font-size: 14px; color: #666; margin: 5px 0 0 0;">Hệ thống tập luyện chuyên nghiệp</p>
        </div>
        <div style="line-height: 1.6; color: #333333;">
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p>Tài khoản Huấn luyện viên cá nhân (PT) của bạn đã được quản trị viên khởi tạo thành công trên hệ thống FxFitness Center.</p>
          <p>Dưới đây là thông tin đăng nhập của bạn:</p>
          <div style="background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Email đăng nhập:</strong> ${to}</p>
            <p style="margin: 0;"><strong>Mật khẩu tạm thời:</strong> <code style="font-size: 16px; color: #d63384; font-weight: bold;">${temporaryPassword}</code></p>
          </div>
          <p style="color: #ffc107; font-weight: bold;">Lưu ý quan trọng:</p>
          <p>Khi đăng nhập lần đầu tiên bằng tài khoản này, hệ thống sẽ yêu cầu bạn cập nhật mật khẩu mới ngay lập tức để bảo mật thông tin tài khoản.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block;">ĐĂNG NHẬP NGAY</a>
          </div>
        </div>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
        <div style="text-align: center; font-size: 12px; color: #999999;">
          <p>© 2026 FxFitness Center. All rights reserved.</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Thông tin tài khoản PT FxFitness Center',
      html: htmlContent,
    });

    console.log('PT Credentials email sent:', info.messageId);
    return info;
  }

  console.log(`No SMTP configured. PT email credentials for ${to} (Temp PW: ${temporaryPassword})`);
  return null;
}

module.exports = { sendResetPasswordEmail, sendPTCredentialsEmail };
