const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Users', {
    user_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "UQ__Users__AB6E616437AC55B3"
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    gender: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Roles',
        key: 'role_id'
      }
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: "Active"
    },
    avatar_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    must_change_password: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    email_verification_token: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'Users',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Users__B9BE370FFCC18A38",
        unique: true,
        fields: [
          { name: "user_id" }
        ]
      },
      {
        name: "UQ__Users__AB6E616437AC55B3",
        unique: true,
        fields: [
          { name: "email" }
        ]
      }
    ]
  });
};