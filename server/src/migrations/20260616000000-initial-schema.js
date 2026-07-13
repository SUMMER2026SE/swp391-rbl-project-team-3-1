'use strict';

const initModels = require('../models/init-models');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Gọi hàm initModels để khởi tạo tất cả các Model với instance sequelize hiện tại
    const models = initModels(queryInterface.sequelize);
    
    // Thực hiện đồng bộ (sync) tất cả các Model vào Database.
    // force: false nghĩa là sẽ KHÔNG xóa bảng nếu nó đã tồn tại (giữ an toàn cho dữ liệu cũ).
    // Tính năng này giúp các thành viên mới pull code về có thể tự động tạo toàn bộ >20 bảng
    // mà không cần phải chạy file FxFitnessCenterDB.sql bằng tay.
    await queryInterface.sequelize.sync({ force: false });
  },

  async down(queryInterface, Sequelize) {
    // Hàm down dùng để revert (quay lui) migration.
    // Do đây là baseline khởi tạo nên chúng ta có thể drop all tables nếu muốn,
    // hoặc để trống để tránh vô tình xóa mất dữ liệu gốc.
    // await queryInterface.dropAllTables();
  }
};
