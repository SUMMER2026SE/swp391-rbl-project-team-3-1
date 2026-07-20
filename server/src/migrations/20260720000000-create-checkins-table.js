'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.some(t => {
      const tableName = typeof t === 'object' ? (t.tableName || t.name) : t;
      return tableName && tableName.toLowerCase() === 'checkins';
    });

    if (!tableExists) {
      await queryInterface.createTable('CheckIns', {
        checkin_id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        member_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Members',
            key: 'member_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        checkin_time: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('GETDATE()')
        }
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('CheckIns');
  }
};
