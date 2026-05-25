const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT) || 1433,
        dialect: 'mssql',
        logging: false,
        dialectOptions: {
            options: {
                encrypt: false,
                trustServerCertificate: true,
                connectionTimeout: 5000,
                requestTimeout: 10000
            }
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 10000,
            idle: 10000
        }
    }
);

let models = {};

try {
    const initModels = require('../models/init-models');
    models = initModels(sequelize);
    console.log('✅ Đã nạp danh sách Models thành công!');
} catch (error) {
    console.error('❌ Lỗi khi khởi tạo Models:', error.message);
}

module.exports = { sequelize, models };
