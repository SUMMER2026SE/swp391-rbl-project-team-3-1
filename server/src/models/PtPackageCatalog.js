const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('PtPackageCatalog', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.NVARCHAR(100),
      allowNull: false
    },
    sessions_per_month: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    frequency_per_week: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    price_1_month: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    price_3_months: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    price_6_months: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'PtPackageCatalog',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK_PtPackageCatalog",
        unique: true,
        fields: [{ name: "id" }]
      }
    ]
  });
};
