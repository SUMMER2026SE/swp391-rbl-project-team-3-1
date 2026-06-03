const { poolPromise } = require('../src/config/db');
(async () => {
  try {
    const pool = await poolPromise;
    if (!pool) {
      console.error('No DB connection');
      process.exit(1);
    }
    const email = 'admin1@gmail.com';
    const result = await pool.request().input('email', email).query("SELECT user_id, email, password_hash FROM Users WHERE email = @email");
    console.log('Found:', JSON.stringify(result.recordset, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(2);
  }
})();
