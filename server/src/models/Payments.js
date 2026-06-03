const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Payments', {
    payment_id: {
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
    amount: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    payment_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    payment_status: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    transaction_code: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    }
  }, {
    sequelize,
    tableName: 'Payments',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Payments__ED1FC9EAA65C0263",
        unique: true,
        fields: [
          { name: "payment_id" },
        ]
      },
    ]
  });
};
