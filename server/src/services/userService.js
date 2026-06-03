const { poolPromise, sql } = require('../config/db');

async function findByEmail(email) {
  const pool = await poolPromise;
  if (!pool) return null;
  const result = await pool.request()
    .input('email', sql.VarChar(100), email)
    .query('SELECT TOP 1 user_id, email, full_name, password_hash, role_id FROM Users WHERE email = @email');
  return result.recordset[0] || null;
}

async function create({ email, password_hash, name, role_id = 1, phone_number = null }) {
  const pool = await poolPromise;
  if (!pool) throw new Error('DB not available');

  const result = await pool.request()
    .input('full_name', sql.NVarChar(100), name || null)
    .input('email', sql.VarChar(100), email)
    .input('password_hash', sql.VarChar(255), password_hash)
    .input('role_id', sql.Int, role_id)
    .input('phone_number', sql.VarChar(20), phone_number)
    .query(`INSERT INTO Users (full_name, email, password_hash, phone_number, role_id, created_at)
            OUTPUT INSERTED.user_id, INSERTED.full_name, INSERTED.email, INSERTED.role_id
            VALUES (@full_name, @email, @password_hash, @phone_number, @role_id, GETDATE())`);

  return result.recordset[0];
}

async function findById(id) {
  const pool = await poolPromise;
  if (!pool) return null;
  const result = await pool.request().input('id', sql.Int, id).query('SELECT user_id, email, full_name, password_hash, phone_number, role_id, status, created_at, avatar_url FROM Users WHERE user_id = @id');
  return result.recordset[0] || null;
}

async function updateAvatar(userId, avatarUrl) {
  const pool = await poolPromise;
  if (!pool) throw new Error('DB not available');
  await pool.request().input('userId', sql.Int, userId).input('avatar_url', sql.VarChar(255), avatarUrl).query('UPDATE Users SET avatar_url = @avatar_url WHERE user_id = @userId');
  return true;
}

async function updatePassword(userId, password_hash) {
  const pool = await poolPromise;
  if (!pool) throw new Error('DB not available');
  await pool.request().input('userId', sql.Int, userId).input('password_hash', sql.VarChar(255), password_hash).query('UPDATE Users SET password_hash = @password_hash WHERE user_id = @userId');
  return true;
}

module.exports = { findByEmail, create, findById, updateAvatar, updatePassword };

