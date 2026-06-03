const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'CHANGE_ME';
const EXPIRY = process.env.JWT_EXPIRES_IN || '7d';

function sign(payload, expiresIn) {
  // expiresIn can be string like '1h' or number of seconds. If omitted, use default EXPIRY
  return jwt.sign(payload, SECRET, { expiresIn: expiresIn || EXPIRY });
}

function verify(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { sign, verify };
