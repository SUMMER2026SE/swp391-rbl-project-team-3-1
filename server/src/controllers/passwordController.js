const bcrypt = require('bcryptjs');
const jwtUtil = require('../utils/jwt');
const userService = require('../services/userService');
const emailUtil = require('../utils/email');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await userService.findByEmail(email);
    if (!user) {
      // respond success to avoid enumeration
      return res.json({ message: 'Nếu email tồn tại, liên kết đặt lại đã được gửi.' });
    }

    const token = jwtUtil.sign({ id: user.user_id, type: 'reset' }, '1h');
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientUrl}/?action=reset-password&token=${token}&userId=${user.user_id}`;

    const info = await emailUtil.sendResetPasswordEmail(user.email, resetLink);

    const resp = { message: 'Nếu email tồn tại, liên kết đặt lại đã được gửi.' };
    if (!info) resp.resetLink = resetLink; // for dev convenience

    res.json(resp);
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, userId, newPassword } = req.body;
    if (!token || !userId || !newPassword) return res.status(400).json({ message: 'Invalid payload' });

    let payload;
    try {
      payload = jwtUtil.verify(token);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    if (payload.type !== 'reset' || payload.id !== parseInt(userId, 10)) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    await userService.updatePassword(userId, hash);

    res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function changePassword(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Old and new password required' });

    const user = await userService.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(oldPassword, user.password_hash);
    if (!match) return res.status(400).json({ message: 'Old password incorrect' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    await userService.updatePassword(userId, hash);

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { forgotPassword, resetPassword, changePassword };
