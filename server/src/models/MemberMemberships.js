const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('MemberMemberships', {
    member_membership_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    member_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Members',
        key: 'member_id'
      }
    },
    membership_plan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'MembershipPlans',
        key: 'membership_plan_id'
      }
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    membership_status: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: "Active"
    }
  }, {
    sequelize,
    tableName: 'MemberMemberships',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__MemberMe__FB2529BDC384751A",
        unique: true,
        fields: [
          { name: "member_membership_id" },
        ]
      },
    ]
  });
};
