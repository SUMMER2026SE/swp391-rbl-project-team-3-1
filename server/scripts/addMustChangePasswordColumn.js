#!/usr/bin/env node
/**
 * Script to add must_change_password column to Users table
 * Run: node scripts/addMustChangePasswordColumn.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { poolPromise } = require('../src/config/db');

(async function main() {
  try {
    console.log('🔄 Attempting to add must_change_password column...');
    
    const pool = await poolPromise;
    if (!pool) {
      console.error('❌ Database pool not connected!');
      process.exit(1);
    }

    // Check if column already exists
    const checkResult = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Users' AND TABLE_SCHEMA = 'dbo' AND COLUMN_NAME = 'must_change_password'
    `);

    if (checkResult.recordset && checkResult.recordset.length > 0) {
      console.log('✅ Column must_change_password already exists.');
      process.exit(0);
    }

    // Add column if it doesn't exist
    await pool.request().query(`
      ALTER TABLE dbo.Users 
      ADD must_change_password BIT NOT NULL 
      CONSTRAINT DF_Users_must_change_password DEFAULT 0
    `);

    console.log('✅ Column must_change_password added successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
