const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('PtBookings', {
    booking_id: {
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
    trainer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Trainers',
        key: 'trainer_id'
      }
    },
    session_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    shift_code: {
      type: DataTypes.STRING(10),
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
    note: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    cancel_reason: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    cancel_requested_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancel_requested_by: {
      type: DataTypes.STRING(50),
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
    tableName: 'PtBookings',
    schema: 'dbo',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: "PK_PtBookings",
        unique: true,
        fields: [{ name: "booking_id" }]
      }
    ]
  });
};
