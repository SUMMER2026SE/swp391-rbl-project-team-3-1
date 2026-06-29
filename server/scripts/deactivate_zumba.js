const { poolPromise } = require('../src/config/db');

(async function main() {
  try {
    const pool = await poolPromise;
    if (!pool) {
      console.error('❌ DB pool connection failed!');
      process.exit(1);
    }

    console.log('⏳ Deactivating Zumba plans in database...');

    // Set status to Inactive for all plans with Zumba in their name
    const result = await pool.request().query(
      "UPDATE MembershipPlans SET status = 'Inactive' WHERE plan_name LIKE '%Zumba%'"
    );

    console.log(`✅ Zumba plans deactivated! Rows affected: ${result.rowsAffected}`);

    // Verify active plans
    const activePlans = await pool.request().query(
      "SELECT membership_plan_id, plan_name, sport_type, duration_months, price, status FROM MembershipPlans WHERE status = 'Active' ORDER BY membership_plan_id"
    );
    console.log('Current Active Plans in Database:');
    console.log(activePlans.recordset);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error executing deactivation script:', err);
    process.exit(1);
  }
})();
