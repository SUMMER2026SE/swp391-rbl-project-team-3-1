const { sequelize } = require('../src/config/db');

async function createTable() {
    try {
        await sequelize.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AppConfigs' and xtype='U')
            BEGIN
                CREATE TABLE AppConfigs (
                    config_key VARCHAR(100) PRIMARY KEY,
                    config_value NVARCHAR(MAX) NOT NULL,
                    description NVARCHAR(255) NULL,
                    updated_at DATETIME DEFAULT GETDATE()
                );
                PRINT 'Table AppConfigs created successfully.';
            END
            ELSE
            BEGIN
                PRINT 'Table AppConfigs already exists.';
            END
        `);
        
        // Seed default core sports config
        const defaultSports = [
            {
                name: 'Gym',
                description: 'Khu vực tạ tự do, máy khối, dàn tạ chất lượng cao giúp tăng cơ giảm mỡ hiệu quả.',
                image: '/assets/images/gym.png'
            },
            {
                name: 'Yoga',
                description: 'Không gian yên tĩnh, các lớp Yoga từ cơ bản đến nâng cao giúp cải thiện sức khỏe và tinh thần.',
                image: '/assets/images/yoga.png'
            },
            {
                name: 'Boxing',
                description: 'Khu vực Boxing tiêu chuẩn, xả stress hiệu quả và đốt cháy calo vượt trội.',
                image: '/assets/images/boxing.png'
            }
        ];

        await sequelize.query(`
            IF NOT EXISTS (SELECT * FROM AppConfigs WHERE config_key='core_sports')
            BEGIN
                INSERT INTO AppConfigs (config_key, config_value, description)
                VALUES ('core_sports', N'${JSON.stringify(defaultSports)}', 'Cấu hình 3 bộ môn trên trang chủ');
            END
        `);

        console.log('✅ Database schema updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating table:', error);
        process.exit(1);
    }
}

createTable();
