const fs = require('fs');
const path = require('path');
const sql = require('mssql');
require('dotenv').config();

async function initDatabase() {
  console.log('🔄 Đang khởi tạo Database từ tệp SQL mới nhất...');

  const mssqlConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || '1234',
    server: process.env.DB_SERVER || process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  };

  try {
    const pool = await sql.connect(mssqlConfig);
    console.log('✅ Đã kết nối SQL Server thành công!');

    const sqlFilePath = path.join(__dirname, '../../database/FxFitnessCenterDB.sql');
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ Không tìm thấy tệp database/FxFitnessCenterDB.sql!');
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL script into batches separated by GO
    const batches = sqlContent
      .split(/^GO\s*$/im)
      .map(b => b.trim())
      .filter(b => b.length > 0);

    console.log(`⏳ Đang thực thi ${batches.length} câu lệnh SQL batches...`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      try {
        await pool.request().query(batch);
      } catch (err) {
        console.warn(`⚠️ Warning ở batch ${i + 1}: ${err.message}`);
      }
    }

    console.log('🎉 KHỞI TẠO VÀ CẬP NHẬT DATABASE MỚI NHẤT THÀNH CÔNG!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi khởi tạo Database:', err.message);
    process.exit(1);
  }
}

initDatabase();
