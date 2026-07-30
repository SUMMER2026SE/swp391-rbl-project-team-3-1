const { sequelize, models } = require('../src/config/db');
const initModels = require('../src/models/init-models');

async function syncAllTables() {
  try {
    console.log('🔄 Bắt đầu kiểm tra và tạo toàn bộ bảng database...');

    // Load models via initModels
    const allModels = initModels(sequelize);
    console.log(`📋 Tổng số Models tìm thấy: ${Object.keys(allModels).length}`);

    // Sync all models (force: false creates missing tables without deleting data)
    await sequelize.sync({ force: false });
    console.log('✅ Đã chạy sequelize.sync({ force: false }) thành công!');

    // Check every table status in MSSQL
    console.log('\n📊 THỐNG KÊ DANH SÁCH BẢNG TRONG DATABASE:');
    for (const [modelName, model] of Object.entries(allModels)) {
      try {
        const count = await model.count();
        console.log(`  ✓ Bảng [${model.tableName}]: Tồn tại (${count} bản ghi)`);
      } catch (err) {
        console.log(`  ⚠️ Bảng [${model.tableName}]: Lỗi - ${err.message}`);
      }
    }

    console.log('\n🚀 Bắt đầu chạy migrations để đảm bảo các ràng buộc/cột mới...');
    const createBookingTables = require('../src/migrations/create_booking_tables');
    await createBookingTables.up();

    console.log('\n🎉 Hoàn tất kiểm tra và tạo toàn bộ bảng database thành công!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi đồng bộ database:', error);
    process.exit(1);
  }
}

syncAllTables();
