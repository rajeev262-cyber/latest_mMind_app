// middleware/auth.js — JWT verification middleware

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// In-memory fallback users (used when MongoDB is not connected)
const FALLBACK_USERS = {
  mitesh:   { _id: '1', name: 'Mitesh',   username: 'mitesh',   role: 'user' },
  purva:    { _id: '2', name: 'Purva',    username: 'purva',    role: 'user' },
  priyanka: { _id: '3', name: 'Priyanka', username: 'priyanka', role: 'user' },
  manish:   { _id: '4', name: 'Manish',   username: 'manish',   role: 'user' },
  rajeev:   { _id: '5', name: 'Rajeev',   username: 'rajeev',   role: 'admin' },
};

const protect = async (req, res, next) => {
  let token;

  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ ok: false, error: 'Not authorized — no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try MongoDB first, fall back to in-memory
    try {
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        req.user = FALLBACK_USERS[decoded.username] || null;
      }
    } catch {
      req.user = FALLBACK_USERS[decoded.username] || { username: decoded.username };
    }

    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: 'Not authorized — invalid token' });
  }
};

module.exports = { protect };
