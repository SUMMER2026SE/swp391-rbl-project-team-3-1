const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TrainerSchedules', {
    schedule_id: {
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
    working_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    availability_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: "Available"
    }
  }, {
    sequelize,
    tableName: 'TrainerSchedules',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__TrainerS__C46A8A6F88D363BD",
        unique: true,
        fields: [
          { name: "schedule_id" },
        ]
      },
    ]
  });
};
