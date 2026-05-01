// controllers/authController.js — Login, register, me

const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User   = require('../models/User');

// ── In-memory fallback (hashed passwords pre-generated) ──────────────────────
// These are bcrypt hashes of "123456" with salt=12
// Allows the app to work even without MongoDB
const BCRYPT_HASH_123456 = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCjvd3OQpqNuTqGx2g7l1W2';

const FALLBACK_USERS = [
  { _id: '1', name: 'Mitesh',   username: 'mitesh',   passwordHash: BCRYPT_HASH_123456, role: 'user'  },
  { _id: '2', name: 'Purva',    username: 'purva',    passwordHash: BCRYPT_HASH_123456, role: 'user'  },
  { _id: '3', name: 'Priyanka', username: 'priyanka', passwordHash: BCRYPT_HASH_123456, role: 'user'  },
  { _id: '4', name: 'Manish',   username: 'manish',   passwordHash: BCRYPT_HASH_123456, role: 'user'  },
  { _id: '5', name: 'Rajeev',   username: 'rajeev',   passwordHash: BCRYPT_HASH_123456, role: 'admin' },
];

// Helper: generate JWT
const signToken = (id, username) =>
  jwt.sign({ id, username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Helper: send token response
const sendTokenResponse = (user, res) => {
  const token = signToken(user._id || user.id, user.username);
  res.json({
    ok: true,
    token,
    user: {
      id:       user._id || user.id,
      name:     user.name,
      username: user.username,
      role:     user.role,
    },
  });
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ ok: false, error: 'Please provide username and password' });
    }

    const uname = username.trim().toLowerCase();

    // Try MongoDB first
    let user = null;
    let isMongoAvailable = false;

    try {
      user = await User.findOne({ username: uname }).select('+password');
      isMongoAvailable = true;
    } catch (dbErr) {
      console.warn('[auth] MongoDB unavailable, using fallback users');
    }

    if (isMongoAvailable) {
      // MongoDB path
      if (!user) {
        return res.status(401).json({ ok: false, error: 'Invalid username or password' });
      }
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ ok: false, error: 'Invalid username or password' });
      }
      return sendTokenResponse(user, res);
    } else {
      // Fallback path
      const fbUser = FALLBACK_USERS.find(u => u.username === uname);
      if (!fbUser) {
        return res.status(401).json({ ok: false, error: 'Invalid username or password' });
      }
      const isMatch = await bcrypt.compare(password, fbUser.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ ok: false, error: 'Invalid username or password' });
      }
      return sendTokenResponse({ ...fbUser, _id: fbUser._id }, res);
    }
  } catch (err) {
    console.error('[login error]', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({
    ok: true,
    user: {
      id:       req.user._id || req.user.id,
      name:     req.user.name,
      username: req.user.username,
      role:     req.user.role,
    },
  });
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
exports.logout = (req, res) => {
  res.json({ ok: true, message: 'Logged out successfully' });
};
