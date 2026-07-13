// migrations/20260702_add_session_count_to_memberservices.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add session_count column if it does not exist
    const tableInfo = await queryInterface.describeTable('MemberServices');
    if (!tableInfo.session_count) {
      await queryInterface.addColumn('MemberServices', 'session_count', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('MemberServices', 'session_count');
  },
};
