const { models, sequelize } = require('./src/config/db');
const dashboardController = require('./src/controllers/dashboardController');

// Mock req, res
const req = {};
const res = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log('STATUS:', this.statusCode);
    console.log('RESPONSE:', JSON.stringify(data, null, 2));
  }
};

async function testController() {
  try {
    // Override console.error to print full stack trace
    const origError = console.error;
    console.error = function(...args) {
      origError.apply(console, args);
    };
    await dashboardController.getAdminAnalytics(req, res);
  } catch (err) {
    console.error('CRITICAL ERROR IN RUN:', err.stack || err);
  } finally {
    await sequelize.close();
  }
}

testController();
