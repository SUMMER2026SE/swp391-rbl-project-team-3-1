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

module.exports = { sendResetPasswordEmail };
