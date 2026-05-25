const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Members', {
    member_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'user_id'
      },
      unique: "UQ__Members__B9BE370E99780868"
    },
    height: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    bmi: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    fitness_goal: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    emergency_contact: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    joined_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    }
  }, {
    sequelize,
    tableName: 'Members',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Members__B29B8534626117CE",
        unique: true,
        fields: [
          { name: "member_id" },
        ]
      },
      {
        name: "UQ__Members__B9BE370E99780868",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
};
