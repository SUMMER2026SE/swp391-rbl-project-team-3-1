const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('MembershipPlanServices', {
    membership_plan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'MembershipPlans',
        key: 'membership_plan_id'
      }
    },
    service_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Services',
        key: 'service_id'
      }
    },
    session_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'MembershipPlanServices',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK_MembershipPlanServices",
        unique: true,
        fields: [
          { name: "membership_plan_id" },
          { name: "service_id" }
        ]
      }
    ]
  });
};
