const { sequelize } = require('../src/config/db');
const migration = require('../src/migrations/add_qr_fields_migration');

async function run() {
  try {
    console.log('🔄 Running QR fields migration...');
    const queryInterface = sequelize.getQueryInterface();
    const Sequelize = require('sequelize');
    await migration.up(queryInterface, Sequelize);
    console.log('✅ QR fields migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

run();
