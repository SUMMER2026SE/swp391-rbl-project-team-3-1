const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Services', {
    service_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    service_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    service_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: "Available"
    }
  }, {
    sequelize,
    tableName: 'Services',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Services__3E0DB8AF524C19C5",
        unique: true,
        fields: [
          { name: "service_id" },
        ]
      },
    ]
  });
};
