const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TrainerCertifications', {
    certification_id: {
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
    certification_name: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    issued_by: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    issued_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'TrainerCertifications',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__TrainerC__185D5AEC893635CA",
        unique: true,
        fields: [
          { name: "certification_id" },
        ]
      },
    ]
  });
};
