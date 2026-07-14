const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('MemberTrainerPackages', {
    package_id: {
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
    total_sessions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 12
    },
    used_sessions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    }
  }, {
    sequelize,
    tableName: 'MemberTrainerPackages',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK_MemberTrainerPackages",
        unique: true,
        fields: [{ name: "package_id" }]
      }
    ]
  });
};
