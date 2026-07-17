const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('CheckIns', {
    checkin_id: {
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
    checkin_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    }
  }, {
    sequelize,
    tableName: 'CheckIns',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK_CheckIns",
        unique: true,
        fields: [
          { name: "checkin_id" }
        ]
      }
    ]
  });
};
