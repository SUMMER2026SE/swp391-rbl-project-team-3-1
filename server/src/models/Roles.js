const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Roles', {
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    role_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "UQ__Roles__783254B187DF921B"
    }
  }, {
    sequelize,
    tableName: 'Roles',
    schema: 'dbo',
    timestamps: false,
    indexes: [
      {
        name: "PK__Roles__760965CCF364A325",
        unique: true,
        fields: [
          { name: "role_id" },
        ]
      },
      {
        name: "UQ__Roles__783254B187DF921B",
        unique: true,
        fields: [
          { name: "role_name" },
        ]
      },
    ]
  });
};
