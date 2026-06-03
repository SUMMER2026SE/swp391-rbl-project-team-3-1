const bcrypt = require('bcryptjs');
const jwtUtil = require('../utils/jwt');
const userService = require('../services/userService');

async function register(req, res) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const existing = await userService.findByEmail(email);
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await userService.create({ email, password_hash: hash, name });
    const token = jwtUtil.sign({ id: user.user_id, email: user.email, roleId: user.role_id });

    res.status(201).json({ user: { id: user.user_id, email: user.email, fullName: user.full_name, roleId: user.role_id }, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    // Debug: log received login attempt (do not log raw password in production)
    try {
      console.log('[AUTH_ATTEMPT] email=%s passwordLen=%d ip=%s', email, password ? password.length : 0, req.ip || req.connection.remoteAddress);
    } catch (e) {
      console.log('[AUTH_ATTEMPT] email present, could not log more info');
    }

    const user = await userService.findByEmail(email);
    if (!user) {
      console.log('[DEBUG] login: user not found for', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('[DEBUG] login: found user', { user_id: user.user_id, email: user.email, password_hash: !!user.password_hash });
    const match = await bcrypt.compare(password, user.password_hash);
    console.log('[DEBUG] login: bcrypt.compare result =', match);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwtUtil.sign({ id: user.user_id, email: user.email, roleId: user.role_id });
    res.json({ user: { id: user.user_id, email: user.email, fullName: user.full_name, roleId: user.role_id }, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function me(req, res) {
  // `authMiddleware` attaches `req.user` from token
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const full = await userService.findById(req.user.id);
    if (!full) return res.status(404).json({ message: 'User not found' });
    // return safe fields only
    const safe = { id: full.user_id, email: full.email, fullName: full.full_name, roleId: full.role_id };
    res.json({ user: safe });
  } catch (err) {
    console.error('Get /me error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { register, login, me };
