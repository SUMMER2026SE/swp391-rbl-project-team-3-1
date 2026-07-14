/**
 * Migration: Create PtBookings and MemberTrainerPackages tables.
 * Run with: node src/migrations/create_booking_tables.js
 */
const { sequelize } = require('../config/db');

async function migrate() {
  try {
    console.log('🚀 Starting migration...');

    // 1. Create MemberTrainerPackages table
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'MemberTrainerPackages')
      BEGIN
        CREATE TABLE MemberTrainerPackages (
          package_id INT IDENTITY(1,1) PRIMARY KEY,
          member_id INT NOT NULL FOREIGN KEY REFERENCES Members(member_id),
          trainer_id INT NOT NULL FOREIGN KEY REFERENCES Trainers(trainer_id),
          total_sessions INT NOT NULL DEFAULT 12,
          used_sessions INT NOT NULL DEFAULT 0,
          is_active BIT NOT NULL DEFAULT 1,
          created_at DATETIME2 NOT NULL DEFAULT GETDATE()
        );
        PRINT 'Created MemberTrainerPackages table';
      END
      ELSE
        PRINT 'MemberTrainerPackages table already exists';
    `);

    // 2. Create PtBookings table
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PtBookings')
      BEGIN
        CREATE TABLE PtBookings (
          booking_id INT IDENTITY(1,1) PRIMARY KEY,
          member_id INT NOT NULL FOREIGN KEY REFERENCES Members(member_id),
          trainer_id INT NOT NULL FOREIGN KEY REFERENCES Trainers(trainer_id),
          session_date DATE NOT NULL,
          shift_code VARCHAR(10) NOT NULL,
          status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
          reject_reason NVARCHAR(500) NULL,
          note NVARCHAR(500) NULL,
          created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
        );
        PRINT 'Created PtBookings table';
      END
      ELSE
        PRINT 'PtBookings table already exists';
    `);

    // 3. Create filtered unique index for active bookings (prevents double-booking)
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Trainer_Slot_Active' AND object_id = OBJECT_ID('PtBookings'))
      BEGIN
        CREATE UNIQUE INDEX UQ_Trainer_Slot_Active
        ON PtBookings (trainer_id, session_date, shift_code)
        WHERE status IN ('Pending', 'Approved');
        PRINT 'Created filtered unique index UQ_Trainer_Slot_Active';
      END
      ELSE
        PRINT 'Index UQ_Trainer_Slot_Active already exists';
    `);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
