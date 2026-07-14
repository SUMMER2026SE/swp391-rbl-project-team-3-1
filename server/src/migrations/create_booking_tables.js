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
          cancel_reason NVARCHAR(500) NULL,
          cancel_requested_at DATETIME2 NULL,
          cancel_requested_by NVARCHAR(50) NULL,
          created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
        );
        PRINT 'Created PtBookings table';
      END
      ELSE
        PRINT 'PtBookings table already exists';
    `);

    // 2.5 Add cancel columns to PtBookings if they don't exist
    await sequelize.query(`
      IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PtBookings')
      BEGIN
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'PtBookings' AND COLUMN_NAME = 'cancel_reason')
        BEGIN
          ALTER TABLE PtBookings ADD cancel_reason NVARCHAR(500) NULL;
          PRINT 'Added cancel_reason column to PtBookings';
        END

        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'PtBookings' AND COLUMN_NAME = 'cancel_requested_at')
        BEGIN
          ALTER TABLE PtBookings ADD cancel_requested_at DATETIME2 NULL;
          PRINT 'Added cancel_requested_at column to PtBookings';
        END

        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'PtBookings' AND COLUMN_NAME = 'cancel_requested_by')
        BEGIN
          ALTER TABLE PtBookings ADD cancel_requested_by NVARCHAR(50) NULL;
          PRINT 'Added cancel_requested_by column to PtBookings';
        END
      END
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

    // 4. Create PtOffRequests table
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PtOffRequests')
      BEGIN
        CREATE TABLE PtOffRequests (
          request_id INT IDENTITY(1,1) PRIMARY KEY,
          trainer_id INT NOT NULL FOREIGN KEY REFERENCES Trainers(trainer_id),
          off_date DATE NOT NULL,
          status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
          reject_reason NVARCHAR(500) NULL,
          created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
        );
        PRINT 'Created PtOffRequests table';
      END
      ELSE
        PRINT 'PtOffRequests table already exists';
    `);

    // 5. Create unique index UQ_Trainer_OffDate
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Trainer_OffDate' AND object_id = OBJECT_ID('PtOffRequests'))
      BEGIN
        CREATE UNIQUE INDEX UQ_Trainer_OffDate
        ON PtOffRequests (trainer_id, off_date);
        PRINT 'Created unique index UQ_Trainer_OffDate';
      END
      ELSE
        PRINT 'Index UQ_Trainer_OffDate already exists';
    `);

    // 6. Update CK_Availability_Status check constraint on TrainerSchedules
    await sequelize.query(`
      IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Availability_Status' AND parent_object_id = OBJECT_ID('TrainerSchedules'))
      BEGIN
        ALTER TABLE TrainerSchedules DROP CONSTRAINT CK_Availability_Status;
        PRINT 'Dropped old CK_Availability_Status constraint';
      END

      ALTER TABLE TrainerSchedules
      ADD CONSTRAINT CK_Availability_Status
      CHECK (availability_status IN ('Off', 'Busy', 'Available', 'Pending_Off'));
      PRINT 'Created new CK_Availability_Status constraint allowing Pending_Off';
    `);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
