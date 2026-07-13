const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { poolPromise } = require('../src/config/db');

(async function main() {
  try {
    console.log('🔄 Attempting to add cancel_reason and cancel_requested_at columns to Appointments table...');
    
    const pool = await poolPromise;
    if (!pool) {
      console.error('❌ Database pool not connected!');
      process.exit(1);
    }

    // Check cancel_reason
    const checkReason = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Appointments' AND TABLE_SCHEMA = 'dbo' AND COLUMN_NAME = 'cancel_reason'
    `);

    if (checkReason.recordset && checkReason.recordset.length > 0) {
      console.log('✅ Column cancel_reason already exists.');
    } else {
      await pool.request().query(`
        ALTER TABLE dbo.Appointments 
        ADD cancel_reason VARCHAR(1000) NULL
      `);
      console.log('✅ Column cancel_reason added successfully!');
    }

    // Check cancel_requested_at
    const checkRequestedAt = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Appointments' AND TABLE_SCHEMA = 'dbo' AND COLUMN_NAME = 'cancel_requested_at'
    `);

    if (checkRequestedAt.recordset && checkRequestedAt.recordset.length > 0) {
      console.log('✅ Column cancel_requested_at already exists.');
    } else {
      await pool.request().query(`
        ALTER TABLE dbo.Appointments 
        ADD cancel_requested_at DATETIME NULL
      `);
      console.log('✅ Column cancel_requested_at added successfully!');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
