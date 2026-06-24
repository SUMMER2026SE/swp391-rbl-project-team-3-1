const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { models, sequelize } = require('../src/config/db');

(async () => {
  const transaction = await sequelize.transaction();
  try {
    const trainerUser = await models.Trainers.findOne();
    if (!trainerUser) {
      console.log('No trainer found');
      process.exit(1);
    }
    console.log('Trainer:', trainerUser.trainer_id);

    const memberId = 20; // Hoanglan1912bb
    const name = 'HIIT Đốt Mỡ Nâng Cao';

    const newPlan = await models.WorkoutPlans.create({
      trainer_id: trainerUser.trainer_id,
      member_id: memberId,
      title: name,
      description: 'Giáo án được giao từ huấn luyện viên qua dashboard.'
    }, { transaction });

    console.log('Created Plan:', newPlan.workout_plan_id);

    const exercises = [
      { exercise_name: 'Burpees', sets: 4, reps: 15, duration_minutes: 2, calories_burned: 80 }
    ];

    const exercisesToCreate = exercises.map(ex => ({
      workout_plan_id: newPlan.workout_plan_id,
      exercise_name: ex.exercise_name,
      sets: ex.sets,
      reps: ex.reps,
      duration_minutes: ex.duration_minutes,
      calories_burned: ex.calories_burned
    }));

    await models.WorkoutExercises.bulkCreate(exercisesToCreate, { transaction });
    console.log('Exercises created');

    await transaction.commit();
    console.log('Transaction committed successfully');
    process.exit(0);
  } catch (error) {
    console.error('ORIGINAL ERROR:', error);
    try {
      await transaction.rollback();
    } catch (rollErr) {
      console.error('Rollback error:', rollErr.message);
    }
    process.exit(1);
  }
})();
