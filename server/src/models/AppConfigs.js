const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AppConfigs = sequelize.define('AppConfigs', {
        config_key: {
            type: DataTypes.STRING(100),
            primaryKey: true,
            allowNull: false
        },
        config_value: {
            type: DataTypes.TEXT, // Store as JSON string
            allowNull: false
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true
        }
    }, {
        tableName: 'AppConfigs',
        timestamps: false
    });

    return AppConfigs;
};
