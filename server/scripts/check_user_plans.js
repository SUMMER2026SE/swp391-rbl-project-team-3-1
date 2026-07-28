const { poolPromise } = require('../src/config/db');

(async () => {
  try {
    const pool = await poolPromise;
    const userId = 23;

    const memberRes = await pool.request()
      .input('userId', userId)
      .query('SELECT * FROM Members WHERE user_id = @userId');
    console.log('--- Member info ---', memberRes.recordset);

    if (memberRes.recordset.length > 0) {
      const memberId = memberRes.recordset[0].member_id;

      const workoutsRes = await pool.request()
        .input('memberId', memberId)
        .query('SELECT * FROM WorkoutPlans WHERE member_id = @memberId');
      console.log('--- WorkoutPlans ---', workoutsRes.recordset);

      const exercisesRes = await pool.request()
        .input('memberId', memberId)
        .query('SELECT we.* FROM WorkoutExercises we JOIN WorkoutPlans wp ON we.workout_plan_id = wp.workout_plan_id WHERE wp.member_id = @memberId');
      console.log('--- WorkoutExercises ---', exercisesRes.recordset);

    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
