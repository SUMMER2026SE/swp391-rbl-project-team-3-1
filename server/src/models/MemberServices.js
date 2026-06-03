const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('MemberServices', {
    member_service_id: {
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
    service_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Services',
        key: 'service_id'
      }
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    service_status: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: "Active"
    }
  }, {
    sequelize,
    tableName: 'MemberServices',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__MemberSe__0CD777E6ED778576",
        unique: true,
        fields: [
          { name: "member_service_id" },
        ]
      },
    ]
  });
};
