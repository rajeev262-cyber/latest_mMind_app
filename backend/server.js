// server.js — MarketMind Express Backend

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const connectDB  = require('./config/db');

const app = express();

// ── Trust proxy for rate limiting ─────────────────────────────────────────────
app.set("trust proxy", 1);

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS — allow frontend origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
  'https://frontend-mmind-app.onrender.com',
  'https://marketmind-frontend.onrender.com',
  'https://marketmind-frontend.vercel.app',
  'https://marketmind-frontend.netlify.app',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      cb(null, true);
    } else {
      cb(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting — prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { ok: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/news',   require('./routes/news'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok:      true,
    status:  'MarketMind API v2.0 running',
    env:     process.env.NODE_ENV,
    time:    new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ ok: false, error: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    ok:    false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server error',
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   MarketMind Backend v2.0 — Running    ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`  API  : http://localhost:${PORT}/api`);
  console.log(`  Auth : POST /api/auth/login`);
  console.log(`  News : GET  /api/news?category=india`);
  console.log(`  Pred : GET  /api/stocks/predict?ticker=TCS\n`);
});
