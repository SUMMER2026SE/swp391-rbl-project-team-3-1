'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MembershipPlanServices', {
      membership_plan_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'MembershipPlans',
          key: 'membership_plan_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      service_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'Services',
          key: 'service_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      session_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Số lượng buổi sử dụng (nếu có)'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('MembershipPlanServices');
  }
};
