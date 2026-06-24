const { sequelize } = require('./src/config/db');

async function runMigration() {
  console.log('Running database schema migration...');
  try {
    await sequelize.query('ALTER TABLE WorkoutExercises ADD rpe INT NULL;');
    console.log('✅ Altered WorkoutExercises table successfully to add rpe column!');
  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  }
  process.exit(0);
}

runMigration();
