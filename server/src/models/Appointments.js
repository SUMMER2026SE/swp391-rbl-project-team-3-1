const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Appointments', {
    appointment_id: {
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
    schedule_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'TrainerSchedules',
        key: 'schedule_id'
      }
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: "Pending"
    },
    note: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    cancel_reason: {
      type: DataTypes.STRING(1000),
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
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    }
  }, {
    sequelize,
    tableName: 'Appointments',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Appointm__A50828FC86EE4CB7",
        unique: true,
        fields: [
          { name: "appointment_id" },
        ]
      },
    ]
  });
};