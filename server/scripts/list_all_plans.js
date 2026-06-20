const { poolPromise } = require('../src/config/db');

(async function main() {
  try {
    const pool = await poolPromise;
    if (!pool) {
      console.error('❌ DB connection failed!');
      process.exit(1);
    }

    const plans = await pool.request().query('SELECT * FROM MembershipPlans ORDER BY membership_plan_id');
    console.log(JSON.stringify(plans.recordset, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
