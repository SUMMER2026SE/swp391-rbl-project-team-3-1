const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Announcements', {
    announcement_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'user_id'
      }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'Announcements',
    schema: 'dbo',
    timestamps: true,
    indexes: [
      {
        name: "PK__Announce__C640A82D39261C19",
        unique: true,
        fields: [
          { name: "announcement_id" },
        ]
      },
    ]
  });
};
