const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { poolPromise } = require('../src/config/db');

(async () => {
  try {
    const pool = await poolPromise;
    if (!pool) {
      console.error('❌ DB pool connection error!');
      process.exit(1);
    }
    const userId = 24;

    // 1. Get Member
    const memberRes = await pool.request()
      .input('userId', userId)
      .query('SELECT * FROM Members WHERE user_id = @userId');
    console.log('--- Member info ---');
    console.log(memberRes.recordset);

    if (memberRes.recordset.length > 0) {
      const memberId = memberRes.recordset[0].member_id;

      // 2. Get Workout Plans
      const workoutsRes = await pool.request()
        .input('memberId', memberId)
        .query('SELECT * FROM WorkoutPlans WHERE member_id = @memberId');
      console.log('--- WorkoutPlans ---');
      console.log(workoutsRes.recordset);

      // 3. Get Exercises
      const exercisesRes = await pool.request()
        .input('memberId', memberId)
        .query('SELECT we.* FROM WorkoutExercises we JOIN WorkoutPlans wp ON we.workout_plan_id = wp.workout_plan_id WHERE wp.member_id = @memberId');
      console.log('--- WorkoutExercises ---');
      console.log(exercisesRes.recordset);

    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
