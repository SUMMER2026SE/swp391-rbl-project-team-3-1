'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Appointments');
    
    // Add cancel_reason
    if (!tableInfo.cancel_reason) {
      await queryInterface.addColumn('Appointments', 'cancel_reason', {
        type: Sequelize.STRING(1000),
        allowNull: true
      });
      console.log('✅ Added cancel_reason column to Appointments');
    }

    // Add cancel_requested_at
    if (!tableInfo.cancel_requested_at) {
      await queryInterface.addColumn('Appointments', 'cancel_requested_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('✅ Added cancel_requested_at column to Appointments');
    }

    // Add cancel_requested_by
    if (!tableInfo.cancel_requested_by) {
      await queryInterface.addColumn('Appointments', 'cancel_requested_by', {
        type: Sequelize.STRING(50),
        allowNull: true
      });
      console.log('✅ Added cancel_requested_by column to Appointments');
    }

    // Alter CHECK constraint on MSSQL
    try {
      // Drop constraint if exists
      await queryInterface.sequelize.query(`
        IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Appointment_Status' AND parent_object_id = OBJECT_ID('Appointments'))
        BEGIN
            ALTER TABLE Appointments DROP CONSTRAINT CK_Appointment_Status;
        END
      `);
      
      // Add updated constraint
      await queryInterface.sequelize.query(`
        ALTER TABLE Appointments 
        ADD CONSTRAINT CK_Appointment_Status 
        CHECK (status IN ('Rejected', 'Cancelled', 'Confirmed', 'Pending', 'CancelPending'))
      `);
      console.log('✅ Re-created CK_Appointment_Status check constraint allowing "CancelPending"');
    } catch (err) {
      console.error('⚠️ Could not update CK_Appointment_Status constraint:', err.message);
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove columns
    await queryInterface.removeColumn('Appointments', 'cancel_reason');
    await queryInterface.removeColumn('Appointments', 'cancel_requested_at');
    await queryInterface.removeColumn('Appointments', 'cancel_requested_by');

    // Revert CHECK constraint
    try {
      await queryInterface.sequelize.query(`
        IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Appointment_Status' AND parent_object_id = OBJECT_ID('Appointments'))
        BEGIN
            ALTER TABLE Appointments DROP CONSTRAINT CK_Appointment_Status;
        END
      `);
      await queryInterface.sequelize.query(`
        ALTER TABLE Appointments 
        ADD CONSTRAINT CK_Appointment_Status 
        CHECK (status IN ('Rejected', 'Cancelled', 'Confirmed', 'Pending'))
      `);
    } catch (err) {
      console.error('⚠️ Could not revert CK_Appointment_Status constraint:', err.message);
    }
  }
};
