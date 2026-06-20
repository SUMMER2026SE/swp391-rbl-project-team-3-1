const { poolPromise } = require('../src/config/db');

(async function main() {
  try {
    const pool = await poolPromise;
    if (!pool) {
      console.error('❌ Database connection failed!');
      process.exit(1);
    }

    console.log('⏳ Updating active plan prices in database...');
    
    // Update Gym 3 Tháng (ID 6) -> 5000
    await pool.request()
      .query("UPDATE MembershipPlans SET price = 5000 WHERE membership_plan_id = 6");
      
    // Update Gym 6 Tháng (ID 7) -> 10000
    await pool.request()
      .query("UPDATE MembershipPlans SET price = 10000 WHERE membership_plan_id = 7");
      
    // Update Gym 12 Tháng (ID 8) -> 15000
    await pool.request()
      .query("UPDATE MembershipPlans SET price = 15000 WHERE membership_plan_id = 8");

    console.log('✅ Plan prices updated successfully!');
    
    // Verify changes
    const result = await pool.request()
      .query("SELECT membership_plan_id, plan_name, price, status FROM MembershipPlans WHERE membership_plan_id BETWEEN 6 AND 8");
    console.log('--- Updated Plans ---');
    console.log(result.recordset);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating database:', err);
    process.exit(1);
  }
})();
