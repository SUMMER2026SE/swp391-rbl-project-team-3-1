const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Trainers', {
    trainer_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'user_id'
      },
      unique: "UQ__Trainers__B9BE370E023C2ACB"
    },
    specialization: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    experience_years: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    experience_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: 'Trainers',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Trainers__65A4B629216F0AFC",
        unique: true,
        fields: [
          { name: "trainer_id" },
        ]
      },
      {
        name: "UQ__Trainers__B9BE370E023C2ACB",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
};
