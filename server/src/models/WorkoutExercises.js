const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('WorkoutExercises', {
    exercise_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    workout_plan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'WorkoutPlans',
        key: 'workout_plan_id'
      }
    },
    exercise_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    sets: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    reps: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    calories_burned: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'WorkoutExercises',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__WorkoutE__C121418E0B56747A",
        unique: true,
        fields: [
          { name: "exercise_id" },
        ]
      },
    ]
  });
};
