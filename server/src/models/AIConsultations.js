const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('AIConsultations', {
    consultation_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    member_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Members',
        key: 'member_id'
      }
    },
    guest_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    consultation_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    gender: {
      type: DataTypes.STRING(10),
      allowNull: true
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
      type: DataTypes.FLOAT,
      allowNull: true
    },
    fitness_goal: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    recommended_sport: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    recommended_membership: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    recommended_schedule: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recommendation_detail: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'AIConsultations',
    schema: 'dbo',
    timestamps: true,
    indexes: [
      {
        name: "PK__AIConsul__650FE0FBA110828E",
        unique: true,
        fields: [
          { name: "consultation_id" },
        ]
      },
    ]
  });
};
