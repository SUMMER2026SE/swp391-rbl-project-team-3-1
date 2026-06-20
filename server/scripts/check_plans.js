const { poolPromise } = require('../src/config/db');

(async function main() {
  try {
    const pool = await poolPromise;
    if (!pool) {
      console.error('❌ Database pool not connected!');
      process.exit(1);
    }

    const plans = await pool.request().query('SELECT * FROM MembershipPlans');
    console.log('--- MembershipPlans ---');
    console.log(plans.recordset);

    const trainers = await pool.request().query(`
      SELECT u.user_id, u.full_name, u.role_id, u.status 
      FROM Users u 
      WHERE u.role_id = 2
    `);
    console.log('--- Trainers ---');
    console.log(trainers.recordset);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
})();
