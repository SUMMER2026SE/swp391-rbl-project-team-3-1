#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const userService = require('../src/services/userService');

(async function main() {
  const [, , email, newPassword] = process.argv;
  if (!email || !newPassword) {
    console.error('Usage: node scripts/setPassword.js <email> <newPassword>');
    process.exit(1);
  }

  try {
    const user = await userService.findByEmail(email);
    if (!user) {
      console.error('User not found:', email);
      process.exit(1);
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await userService.updatePassword(user.user_id, hash);
    console.log('Password updated for', email);
    process.exit(0);
  } catch (err) {
    console.error('Error updating password:', err.message || err);
    process.exit(2);
  }
})();
