const { poolPromise } = require('../src/config/db');

(async function main() {
  try {
    const pool = await poolPromise;
    if (!pool) {
      console.error('❌ Database pool not connected!');
      process.exit(1);
    }

    const result = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Users'
    `);

    console.log(JSON.stringify(result.recordset, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
})();
