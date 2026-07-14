const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('PtOffRequests', {
    request_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    trainer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Trainers',
        key: 'trainer_id'
      }
    },
    off_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Pending'
    },
    reject_reason: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    }
  }, {
    sequelize,
    tableName: 'PtOffRequests',
    schema: 'dbo',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: "PK_PtOffRequests",
        unique: true,
        fields: [
          { name: "request_id" },
        ]
      },
      {
        name: "UQ_Trainer_OffDate",
        unique: true,
        fields: [
          { name: "trainer_id" },
          { name: "off_date" }
        ]
      }
    ]
  });
};
