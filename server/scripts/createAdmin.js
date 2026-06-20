#!/usr/bin/env node
// Usage: node scripts/createAdmin.js <email> [password] [full_name]
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const userService = require('../src/services/userService');

async function main() {
  const [, , email, password = 'Admin123!', ...nameParts] = process.argv;
  const fullName = nameParts.length ? nameParts.join(' ') : 'Administrator';

  if (!email) {
    console.error('Usage: node scripts/createAdmin.js <email> [password] [full_name]');
    process.exit(1);
  }

  try {
    const existing = await userService.findByEmail(email);
    if (existing) {
      console.log('User already exists:', existing.email || existing.user_id);
      process.exit(0);
    }

    const hash = await bcrypt.hash(password, 10);
    const created = await userService.create({ email, password_hash: hash, name: fullName, role_id: 3, status: 'Active', must_change_password: true });
    console.log('Admin user created (must_change_password flag set):', created);
    console.log('You can now login with:', email);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err.message || err);
    process.exit(2);
  }
}

main();
