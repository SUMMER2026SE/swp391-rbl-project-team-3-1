const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ProgressTrackings', {
    progress_id: {
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
    body_fat: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    muscle_mass: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    recorded_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    },
    note: {
      type: DataTypes.STRING(300),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'ProgressTrackings',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Progress__49B3D8C1AA6ABC48",
        unique: true,
        fields: [
          { name: "progress_id" },
        ]
      },
    ]
  });
};