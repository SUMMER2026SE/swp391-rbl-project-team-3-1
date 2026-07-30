'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Thêm cột qr_token, qr_created_at, qr_is_active vào Users
    const userTableDesc = await queryInterface.describeTable('Users');
    if (!userTableDesc.qr_token) {
      await queryInterface.addColumn('Users', 'qr_token', {
        type: Sequelize.STRING(64),
        allowNull: true
      });
    }

    if (!userTableDesc.qr_created_at) {
      await queryInterface.addColumn('Users', 'qr_created_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!userTableDesc.qr_is_active) {
      await queryInterface.addColumn('Users', 'qr_is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    }

    // Cấu trúc bảng CheckIns
    const checkinsTableDesc = await queryInterface.describeTable('CheckIns');
    if (checkinsTableDesc.member_id && checkinsTableDesc.member_id.allowNull === false) {
      await queryInterface.changeColumn('CheckIns', 'member_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }

    if (!checkinsTableDesc.trainer_id) {
      await queryInterface.addColumn('CheckIns', 'trainer_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Trainers',
          key: 'trainer_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    }

    if (!checkinsTableDesc.checkout_time) {
      await queryInterface.addColumn('CheckIns', 'checkout_time', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    // 2. Điền data qr_token cho toàn bộ User đang NULL
    const { sequelize } = queryInterface;
    const [users] = await sequelize.query(`SELECT user_id FROM Users WHERE qr_token IS NULL`);
    if (users && users.length > 0) {
      const crypto = require('crypto');
      for (const u of users) {
        const token = crypto.randomBytes(32).toString('hex');
        await sequelize.query(`
          UPDATE Users 
          SET qr_token = :token, qr_created_at = GETDATE(), qr_is_active = 1
          WHERE user_id = :userId
        `, {
          replacements: { token, userId: u.user_id }
        });
      }
    }

    // 3. Đổi qr_token sang NOT NULL và tạo UNIQUE constraint
    await sequelize.query(`
      IF EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'qr_token' AND IS_NULLABLE = 'YES'
      )
      BEGIN
        ALTER TABLE Users ALTER COLUMN qr_token VARCHAR(64) NOT NULL;
      END

      IF NOT EXISTS (
        SELECT * FROM sys.objects 
        WHERE parent_object_id = OBJECT_ID('Users') AND type = 'UQ' AND name = 'UQ_Users_qr_token'
      )
      BEGIN
        ALTER TABLE Users ADD CONSTRAINT UQ_Users_qr_token UNIQUE (qr_token);
      END
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Không cần hoàn tác ngược lại để tránh mất mát dữ liệu sản xuất
  }
};
