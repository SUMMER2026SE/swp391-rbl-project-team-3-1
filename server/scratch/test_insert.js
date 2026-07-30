const { Sequelize } = require('sequelize');
Sequelize.DATE.prototype.stringify = function (date, options) {
  date = this._applyTimezone(date, options);
  return date.format('YYYY-MM-DD HH:mm:ss.SSS');
};

const { sequelize, models } = require('../src/config/db');

async function test() {
  try {
    console.log('Testing single user insert...');
    const user = await models.Users.create({
      full_name: 'Test Date Insert',
      email: 'test_insert@example.com',
      password_hash: '123456',
      role_id: 1,
      qr_token: 'test_token_123',
      qr_created_at: new Date(),
      date_of_birth: '1995-05-15',
      status: 'Active'
    });
    console.log('User inserted successfully with ID:', user.user_id);
    
    // Clean up
    await user.destroy();
    console.log('User cleaned up.');
    process.exit(0);
  } catch (error) {
    console.error('Insert failed with error:', error);
    process.exit(1);
  }
}

test();
