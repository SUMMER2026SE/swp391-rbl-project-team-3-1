const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { poolPromise, sql } = require('../src/config/db');

(async () => {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node scripts/deleteUser.js <email_or_user_id>');
    process.exit(1);
  }

  try {
    const pool = await poolPromise;
    if (!pool) {
      console.error('❌ Database connection failed.');
      process.exit(1);
    }

    let userResult;
    const isId = /^\d+$/.test(arg);

    if (isId) {
      console.log(`🔍 Searching for user with ID: ${arg}...`);
      userResult = await pool.request()
        .input('userId', sql.Int, parseInt(arg, 10))
        .query('SELECT * FROM Users WHERE user_id = @userId');
    } else {
      console.log(`🔍 Searching for user with email: ${arg}...`);
      userResult = await pool.request()
        .input('email', sql.NVarChar, arg)
        .query('SELECT * FROM Users WHERE email = @email');
    }

    if (userResult.recordset.length === 0) {
      console.error(`❌ User not found with identifier: ${arg}`);
      process.exit(1);
    }

    const user = userResult.recordset[0];
    const userId = user.user_id;
    console.log(` Found User: ID=${userId}, Email="${user.email}", Name="${user.full_name}", RoleID=${user.role_id}`);

    // 2. Check Members
    const memberResult = await pool.request()
      .input('userId', userId)
      .query('SELECT * FROM Members WHERE user_id = @userId');

    let memberId = null;
    if (memberResult.recordset.length > 0) {
      memberId = memberResult.recordset[0].member_id;
      console.log(` Found Member: ID=${memberId}`);
    }

    // Begin Transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      console.log('\n🗑️  Starting deletion process within a transaction...');

      // A. Delete from tables referencing member_id
      if (memberId) {
        const memberTables = [
          'AIConsultations',
          'Appointments',
          'MealPlans',
          'MemberMemberships',
          'MemberServices',
          'Payments',
          'ProgressTrackings',
          'WorkoutPlans'
        ];

        for (const table of memberTables) {
          const req = new sql.Request(transaction);
          const result = await req
            .input('memberId', memberId)
            .query(`DELETE FROM ${table} WHERE member_id = @memberId`);
          console.log(`  - Deleted ${result.rowsAffected[0]} records from ${table}`);
        }

        // Delete from Members table
        const reqMember = new sql.Request(transaction);
        const resultMember = await reqMember
          .input('memberId', memberId)
          .query('DELETE FROM Members WHERE member_id = @memberId');
        console.log(`  - Deleted ${resultMember.rowsAffected[0]} record from Members`);
      }

      // B. Delete from tables referencing user_id directly
      const userTables = [
        { name: 'ChatMessages', col: 'sender_id' },
        { name: 'ChatMessages', col: 'receiver_id' },
        { name: 'Notifications', col: 'user_id' },
        { name: 'Reports', col: 'reported_by' },
        { name: 'Reports', col: 'reported_user_id' },
        { name: 'Trainers', col: 'user_id' }
      ];

      for (const item of userTables) {
        const req = new sql.Request(transaction);
        const result = await req
          .input('userId', userId)
          .query(`DELETE FROM ${item.name} WHERE ${item.col} = @userId`);
        console.log(`  - Deleted ${result.rowsAffected[0]} records from ${item.name} (${item.col})`);
      }

      // C. Delete from Users table
      const reqUser = new sql.Request(transaction);
      const resultUser = await reqUser
        .input('userId', userId)
        .query('DELETE FROM Users WHERE user_id = @userId');
      console.log(`  - Deleted ${resultUser.rowsAffected[0]} record from Users`);

      // Commit transaction
      await transaction.commit();
      console.log(`\n✅ Successfully deleted user ID=${userId} and all associated records!`);
      process.exit(0);

    } catch (txErr) {
      console.error('❌ Error in transaction, rolling back...', txErr);
      await transaction.rollback();
      process.exit(2);
    }

  } catch (err) {
    console.error('❌ Error executing deletion:', err);
    process.exit(2);
  }
})();
