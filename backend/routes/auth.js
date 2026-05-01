// routes/auth.js

const express = require('express');
const router  = express.Router();
const { login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login',  login);
router.get('/me',      protect, getMe);
router.post('/logout', logout);

module.exports = router;
