const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { poolPromise } = require('../src/config/db');

(async function main() {
  try {
    const pool = await poolPromise;
    if (!pool) {
      console.error('❌ Database pool not connected!');
      process.exit(1);
    }

    const result = await pool.request().query(`
      SELECT user_id, email, full_name, role_id, status, must_change_password 
      FROM Users
    `);

    console.log(JSON.stringify(result.recordset, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
})();
