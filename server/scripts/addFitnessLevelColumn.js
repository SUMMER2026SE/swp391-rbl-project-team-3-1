const path = require('path');
const dotenv = require('c:/Users/HTC/swp391-rbl-project-team-3-1/server/node_modules/dotenv');
dotenv.config({ path: 'c:/Users/HTC/swp391-rbl-project-team-3-1/server/.env' });

const { poolPromise } = require('c:/Users/HTC/swp391-rbl-project-team-3-1/server/src/config/db');

(async function main() {
  try {
    console.log('🔄 Attempting to add fitness_level column to Members table...');
    
    const pool = await poolPromise;
    if (!pool) {
      console.error('❌ Database pool not connected!');
      process.exit(1);
    }

    // Check if column already exists
    const checkResult = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Members' AND TABLE_SCHEMA = 'dbo' AND COLUMN_NAME = 'fitness_level'
    `);

    if (checkResult.recordset && checkResult.recordset.length > 0) {
      console.log('✅ Column fitness_level already exists.');
      process.exit(0);
    }

    // Add column if it doesn't exist
    await pool.request().query(`
      ALTER TABLE dbo.Members 
      ADD fitness_level NVARCHAR(50) NULL
    `);

    console.log('✅ Column fitness_level added successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
