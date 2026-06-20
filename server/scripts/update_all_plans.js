const { poolPromise } = require('../src/config/db');

(async function main() {
  try {
    const pool = await poolPromise;
    if (!pool) {
      console.error('❌ DB pool connection failed!');
      process.exit(1);
    }

    console.log('⏳ Updating active plans and prices in database...');

    // 1. Deactivate old placeholder plans (1-4)
    await pool.request().query("UPDATE MembershipPlans SET status = 'Inactive' WHERE membership_plan_id IN (1, 2, 3, 4)");

    // 2. Activate Mixed 12 months plan (ID 5) with price 60000
    await pool.request().query("UPDATE MembershipPlans SET status = 'Active', price = 60000 WHERE membership_plan_id = 5");

    // 3. Update Gym plans (IDs 6, 7, 8)
    await pool.request().query("UPDATE MembershipPlans SET price = 5000 WHERE membership_plan_id = 6");
    await pool.request().query("UPDATE MembershipPlans SET price = 10000 WHERE membership_plan_id = 7");
    await pool.request().query("UPDATE MembershipPlans SET price = 15000 WHERE membership_plan_id = 8");

    // 4. Update Yoga plans (IDs 9, 10, 11)
    await pool.request().query("UPDATE MembershipPlans SET price = 5000 WHERE membership_plan_id = 9");
    await pool.request().query("UPDATE MembershipPlans SET price = 10000 WHERE membership_plan_id = 10");
    await pool.request().query("UPDATE MembershipPlans SET price = 15000 WHERE membership_plan_id = 11");

    // 5. Update Boxing plans (IDs 12, 13, 14)
    await pool.request().query("UPDATE MembershipPlans SET price = 5000 WHERE membership_plan_id = 12");
    await pool.request().query("UPDATE MembershipPlans SET price = 10000 WHERE membership_plan_id = 13");
    await pool.request().query("UPDATE MembershipPlans SET price = 15000 WHERE membership_plan_id = 14");

    // 6. Ensure all active plans are set to Active
    await pool.request().query("UPDATE MembershipPlans SET status = 'Active' WHERE membership_plan_id BETWEEN 6 AND 14");

    console.log('✅ Plans updated! Verifying active plans in DB:');

    const result = await pool.request().query(
      "SELECT membership_plan_id, plan_name, sport_type, duration_months, price, status FROM MembershipPlans WHERE status = 'Active' ORDER BY membership_plan_id"
    );
    console.log(JSON.stringify(result.recordset, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error executing update script:', err);
    process.exit(1);
  }
})();
