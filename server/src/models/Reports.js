const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Reports', {
    report_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    reported_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'user_id'
      }
    },
    reported_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'user_id'
      }
    },
    reported_service_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Services',
        key: 'service_id'
      }
    },
    reported_membership_plan_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'MembershipPlans',
        key: 'membership_plan_id'
      }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: "Pending"
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    admin_note: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'Reports',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Reports__779B7C5843BE60A8",
        unique: true,
        fields: [
          { name: "report_id" },
        ]
      },
    ]
  });
};