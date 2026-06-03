const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('MembershipPlans', {
    membership_plan_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    plan_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    sport_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    duration_months: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: "Active"
    }
  }, {
    sequelize,
    tableName: 'MembershipPlans',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Membersh__B28530D017C9A773",
        unique: true,
        fields: [
          { name: "membership_plan_id" },
        ]
      },
    ]
  });
};
