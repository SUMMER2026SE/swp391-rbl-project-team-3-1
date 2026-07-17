const { Sequelize } = require('sequelize');
require('dotenv').config();

// Khởi tạo Sequelize (nếu project dùng ORM ở một số chỗ)
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD || process.env.DB_PASS,
    {
        host: process.env.DB_SERVER || process.env.DB_HOST || '127.0.0.1',
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

    // Tự động tạo bảng CheckIns nếu chưa tồn tại
    sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CheckIns' and xtype='U')
      BEGIN
        CREATE TABLE CheckIns (
          checkin_id INT IDENTITY(1,1) PRIMARY KEY,
          member_id INT NOT NULL FOREIGN KEY REFERENCES Members(member_id),
          checkin_time DATETIME NOT NULL DEFAULT GETDATE()
        )
      END
    `).then(() => {
        console.log('✅ Đã kiểm tra/tạo bảng CheckIns thành công!');
    }).catch(err => {
        console.error('❌ Lỗi khi tự động tạo bảng CheckIns:', err.message);
    });
} catch (error) {
    console.error('❌ Lỗi khi khởi tạo Models:', error.message);
}

// Đồng thời export một connection pool dùng `mssql` để các service hiện có (đang dùng poolPromise)
const sql = require('mssql');

const mssqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  server: process.env.DB_SERVER || process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  pool: {
    max: 5,
    min: 0,
    idleTimeoutMillis: 10000
  }
};

const poolPromise = sql.connect(mssqlConfig)
  .then(pool => {
    console.log('✅ MSSQL pool connected');
    return pool;
  })
  .catch(err => {
    console.error('❌ MSSQL pool connection error:', err && err.message ? err.message : err);
    return null;
  });

module.exports = { sequelize, models, poolPromise, sql };
