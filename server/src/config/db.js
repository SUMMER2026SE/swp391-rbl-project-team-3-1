const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false, // Đặt thành true nếu dùng Azure SQL, false nếu chạy dưới máy local
    trustServerCertificate: true, // Quan trọng: Cho phép tự tin cậy chứng chỉ tự ký ở máy local
  },
};

console.log('⚡ Đang khởi tạo kết nối cơ sở dữ liệu với cấu hình:', {
  server: dbConfig.server,
  database: dbConfig.database,
  user: dbConfig.user,
  port: dbConfig.port,
});

const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then((pool) => {
    console.log('🔌 [SUCCESS] Kết nối Microsoft SQL Server thành công!');
    return pool;
  })
  .catch((err) => {
    console.error('❌ [ERROR] Kết nối cơ sở dữ liệu thất bại! Lỗi chi tiết:', err.message);
    // Không ném lỗi ra ngoài để server không bị crash đột ngột khi DB chưa bật dưới máy người dùng
    return null;
  });

module.exports = {
  sql,
  poolPromise,
};
