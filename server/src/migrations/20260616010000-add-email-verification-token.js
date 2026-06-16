'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Kiểm tra xem cột đã tồn tại chưa trước khi thêm
    const tableInfo = await queryInterface.describeTable('Users');
    
    if (!tableInfo.email_verification_token) {
      await queryInterface.addColumn('Users', 'email_verification_token', {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null
      });
      console.log('✅ Đã thêm cột email_verification_token vào bảng Users');
    } else {
      console.log('ℹ️ Cột email_verification_token đã tồn tại, bỏ qua.');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'email_verification_token');
  }
};
