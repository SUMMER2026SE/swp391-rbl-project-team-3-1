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
      type: DataTypes.VIRTUAL,
      // Computed column trong SQL Server, chỉ đọc, không ghi
      get() {
        const h = this.getDataValue('height');
        const w = this.getDataValue('weight');
        if (h && h > 0 && w) {
          return Math.round((w / (h * h)) * 100) / 100;
        }
        return null;
      }
    },
    fitness_goal: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    fitness_level: {
      type: DataTypes.STRING(50),
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