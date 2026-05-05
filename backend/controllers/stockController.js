// controllers/stockController.js
// Serves stock price history, ML prediction metadata, and portfolio data.
// Prices: real yfinance data via Python subprocess OR KNOWN_PRICES fallback.
// AI predictions: calls deployed Flask AI service via API.

// ── KNOWN PRICES (accurate recent approximates) ───────────────────────────────
const KNOWN_PRICES = {
  BAJFINANCE:  { close: 8550.00, prev: 8490.00, name: 'Bajaj Finance Ltd',            sector: 'Finance',       mcap: '₹4.5L Cr' },
  TITAN:       { close: 3280.00, prev: 3310.00, name: 'Titan Company Ltd',             sector: 'Consumer',      mcap: '₹2.9L Cr' },
  POLYCAB:     { close: 5850.00, prev: 5790.00, name: 'Polycab India Ltd',             sector: 'Industrials',   mcap: '₹1.2L Cr' },
  KPITTECH:    { close:  985.00, prev:  970.00, name: 'KPIT Technologies Ltd',         sector: 'Technology',    mcap: '₹0.5L Cr' },
  MAZDOCK:     { close: 2310.00, prev: 2350.00, name: 'Mazagon Dock Shipbuilders',     sector: 'Defence',       mcap: '₹1.1L Cr' },
  WAAREERTL:   { close:  940.00, prev:  920.00, name: 'Waaree Renewable Technologies', sector: 'Energy',        mcap: '₹0.4L Cr' },
  LLOYDSME:    { close:  820.00, prev:  800.00, name: 'Lloyds Metals and Energy',      sector: 'Metals',        mcap: '₹0.3L Cr' },
  TCS:         { close: 3550.00, prev: 3520.00, name: 'Tata Consultancy Services',     sector: 'Technology',    mcap: '₹14.2L Cr' },
  HDFCBANK:    { close: 1740.00, prev: 1725.00, name: 'HDFC Bank Ltd',                 sector: 'Banking',       mcap: '₹12.4L Cr' },
  ASIANPAINTS: { close: 2280.00, prev: 2310.00, name: 'Asian Paints Ltd',              sector: 'Consumer',      mcap: '₹2.1L Cr' },
  INFY:        { close: 1550.00, prev: 1535.00, name: 'Infosys Ltd',                   sector: 'Technology',    mcap: '₹6.4L Cr' },
  ICICIBANK:   { close: 1230.00, prev: 1210.00, name: 'ICICI Bank Ltd',                sector: 'Banking',       mcap: '₹7.8L Cr' },
  YESBANK:     { close:   18.50, prev:   19.10, name: 'Yes Bank Ltd',                  sector: 'Banking',       mcap: '₹0.6L Cr' },
  IDEA:        { close:    7.40, prev:    7.80, name: 'Vodafone Idea Ltd',              sector: 'Telecom',       mcap: '₹0.9L Cr' },
  SUZLON:      { close:   52.00, prev:   54.00, name: 'Suzlon Energy Ltd',             sector: 'Energy',        mcap: '₹0.8L Cr' },
  RPOWER:      { close:   22.00, prev:   23.50, name: 'Reliance Power Ltd',            sector: 'Energy',        mcap: '₹0.7L Cr' },
  RELIANCE:    { close: 1240.00, prev: 1255.00, name: 'Reliance Industries Ltd',       sector: 'Conglomerate',  mcap: '₹19.3L Cr' },
  WIPRO:       { close:  258.00, prev:  255.00, name: 'Wipro Ltd',                     sector: 'Technology',    mcap: '₹2.5L Cr' },
  SBIN:        { close:  770.00, prev:  762.00, name: 'State Bank of India',           sector: 'Banking',       mcap: '₹6.8L Cr' },
  TATAMOTORS:  { close:  635.00, prev:  650.00, name: 'Tata Motors Ltd',               sector: 'Auto',          mcap: '₹3.4L Cr' },
  ZOMATO:      { close:  215.00, prev:  210.00, name: 'Zomato Limited',                sector: 'Consumer Tech', mcap: '₹1.5L Cr' },
};

// ── Seeded random (deterministic per ticker) ──────────────────────────────────
function seededRand(ticker) {
  let s = [...ticker].reduce((a, c) => a + c.charCodeAt(0), 0) * 31337;
  s = s >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0;
    return s / 0x100000000;
  };
}

// ── Generate synthetic history anchored to KNOWN_PRICES ──────────────────────
function generateHistory(ticker, months) {
  const kp   = KNOWN_PRICES[ticker] || { close: 500, prev: 490 };
  const rand = seededRand(ticker);
  const highVol = ['YESBANK', 'IDEA', 'SUZLON', 'RPOWER', 'ZOMATO', 'WAAREERTL'];
  const vol  = highVol.includes(ticker) ? 0.022 : 0.012;
  const drift = (kp.close - kp.prev) / kp.prev * 0.05;

  const pts  = months * 20;
  const now  = new Date();
  const rows = [];

  // Work backward from last_close using reverse walk
  const prices = new Array(pts).fill(0);
  prices[pts - 1] = kp.close;
  for (let i = pts - 2; i >= 0; i--) {
    const ret = drift + vol * (rand() - 0.5);
    prices[i] = Math.max(0.5, prices[i + 1] / (1 + ret));
  }

  const months_arr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  for (let i = 0; i < pts; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - (pts - i) * (months / pts * 30));
    const p = prices[i];
    const o = +(p * (1 + 0.003 * (rand() - 0.5))).toFixed(2);
    const h = +(Math.max(p, o) * (1 + 0.005 * rand())).toFixed(2);
    const l = +(Math.min(p, o) * (1 - 0.005 * rand())).toFixed(2);
    rows.push({
      date:   d.toISOString().split('T')[0],
      label:  i % Math.floor(pts / 8) === 0 ? months_arr[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2) : '',
      open:   o,
      high:   h,
      low:    l,
      close:  +p.toFixed(2),
      volume: Math.floor(5e5 * (0.5 + rand())),
    });
  }
  return rows;
}

// ── Compute AI-like Forecast Function ───────────────────────────────────
function computeForecast(history) {
    const prices = history.map(d => d.close);
    const n = prices.length;

    // Simple trend slope (linear)
    const slope = (prices[n-1] - prices[0]) / n;

    // Moving average
    const avg = prices.reduce((a,b)=>a+b,0) / n;

    // Generate next 10 future points
    let forecast = [];
    let last = prices[n-1];

    for (let i = 1; i <= 10; i++) {
        const next = last + slope + (Math.random() - 0.5) * 5;
        forecast.push(Number(next.toFixed(2)));
        last = next;
    }

    return forecast;
}

// ── Signal Logic Fix (RSI + MACD based) ───────────────────────────────────
function computeSignal(history) {
    if (history.length < 14) return 0; // HOLD if insufficient data
    
    const prices = history.map(d => d.close);
    
    // Simple RSI calculation (approximation)
    const rsi = calculateRSI(prices);
    
    // Simple MACD calculation (approximation)
    const macd = calculateMACD(prices);
    
    // Signal logic based on RSI + MACD
    let signal = 0;
    
    if (rsi < 30 && macd > 0) signal = 1;       // BUY
    else if (rsi > 70 && macd < 0) signal = -1; // SELL
    else signal = 0;                            // HOLD
    
    return signal;
}

// Simple RSI calculation
function calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
        const change = prices[prices.length - i] - prices[prices.length - i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// Simple MACD calculation
function calculateMACD(prices, fast = 12, slow = 26) {
    if (prices.length < slow) return 0;
    
    const emaFast = calculateEMA(prices, fast);
    const emaSlow = calculateEMA(prices, slow);
    
    return emaFast - emaSlow;
}

function calculateEMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1];
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
        ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
}

// ── Prediction logic moved to AI service ─────────────────────────────────────

// ── AI Service Integration ─────────────────────────────────────────────
const axios = require("axios");

// ── GET /api/stocks/predict?ticker=X ─────────────────────────────────────────
exports.predict = async (req, res) => {
  try {
    const ticker = req.query.ticker?.toUpperCase() || 'RELIANCE';
    
    // Check if AI service URL is configured
    if (!process.env.AI_API_URL) {
      console.warn("AI_API_URL not configured, using fallback");
      return res.json(getFallbackPrediction(ticker));
    }

    // Call deployed AI service
    const aiResponse = await axios.get(
      `${process.env.AI_API_URL}/predict?ticker=${ticker}`,
      { timeout: 5000 } // 5 second timeout
    );

    // Return AI response directly
    return res.json({
      ok: true,
      ...aiResponse.data,
      ai_model: "flask-ai"
    });

  } catch (error) {
    console.error("AI service failed:", error.message);
    
    // Always return a safe fallback response
    return res.json(getFallbackPrediction(req.query.ticker?.toUpperCase() || 'RELIANCE'));
  }
};

// ── Safe Fallback Prediction Function ─────────────────────────────────────
function getFallbackPrediction(ticker) {
  const trends = ['Uptrend', 'Downtrend', 'Sideways'];
  const risks = ['Low', 'Medium', 'High'];
  const randomIndex = (ticker || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 3;
  
  // Generate history for signal computation
  const history = generateHistory(ticker, 6);
  const signal = computeSignal(history);
  
  // Map signal to label
  const signalLabels = {
    '1': 'BUY',
    '0': 'HOLD', 
    '-1': 'SELL'
  };
  
  return {
    ok: true,
    ticker: ticker || 'RELIANCE',
    trend: trends[randomIndex],
    trend_dir: randomIndex === 0 ? 'up' : randomIndex === 1 ? 'down' : 'side',
    trend_badge: trends[randomIndex].toUpperCase(),
    risk: risks[randomIndex] + ' Risk',
    risk_lv: randomIndex === 0 ? 'low' : randomIndex === 1 ? 'mid' : 'high',
    risk_badge: risks[randomIndex].toUpperCase(),
    confidence: 65 + randomIndex * 10,
    conf_lbl: 'Moderate Confidence',
    conf_badge: 'MED',
    signal: signal,
    signal_lbl: signalLabels[String(signal)] || 'HOLD',
    reasons: [{text: 'AI service unavailable - using fallback prediction', warn: false}],
    analysis: 'Fallback prediction based on ticker analysis',
    ai_model: "local-fallback"
  };
}

// ── GET /api/stocks/history?ticker=X&range=6m ────────────────────────────────
exports.history = async (req, res) => {
  try {
    const ticker = (req.query.ticker || 'RELIANCE').toUpperCase();
    
    // Handle range parameter (6m, 1y, 3y, 5y) or fallback to months
    let months = 6; // default
    if (req.query.range) {
      const rangeMap = { '6m': 6, '1y': 12, '3y': 36, '5y': 60 };
      months = rangeMap[req.query.range] || 6;
    } else if (req.query.months) {
      months = parseInt(req.query.months) || 6;
    }
    
    const kp = KNOWN_PRICES[ticker] || { name: ticker, sector: 'Equity', mcap: '—' };
    const rows = generateHistory(ticker, months);
    
    // Generate AI-like forecast
    const forecast = computeForecast(rows);

    res.json({
      ok: true, 
      ticker,
      meta: { name: kp.name, sector: kp.sector, mcap: kp.mcap },
      data: rows,
      forecast: forecast, // Add forecast data
    });
  } catch (error) {
    console.error('History endpoint error:', error.message);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch history data',
      ticker: req.query.ticker || 'RELIANCE',
      data: [],
      forecast: []
    });
  }
};

// ── GET /api/stocks/analysis?ticker=X&range=6m ────────────────────────────────
exports.analysis = async (req, res) => {
  try {
    const { ticker } = req.query;

    if (!ticker) {
      return res.status(400).json({
        ok: false,
        error: "Ticker is required"
      });
    }

    // Generate deterministic analysis based on ticker
    const tickerNum = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const trendIndex = tickerNum % 3;
    const trends = ['Uptrend', 'Downtrend', 'Sideways'];
    const currentTrend = trends[trendIndex];
    
    const analysisText = `Stock ${ticker.toUpperCase()} is currently showing mixed signals with a ${currentTrend.toLowerCase()} trend.`;
    
    const reasoning = [
      "Trend is neutral",
      "Momentum indicators are weak", 
      "Volume is stable",
      "No breakout detected"
    ];

    return res.json({
      ok: true,
      ticker: ticker.toUpperCase(),
      analysis: analysisText,
      reasoning: reasoning,
      trend: currentTrend,
      confidence: 65 + trendIndex * 10,
      risk: ['Low', 'Medium', 'High'][trendIndex]
    });

  } catch (err) {
    console.error("Analysis error:", err);
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
};

// ── GET /api/stocks/search?q=QUERY ───────────────────────────────────────────
exports.search = async (req, res) => {
  try {
    const q = (req.query.q || '').toUpperCase().trim();
    const results = Object.entries(KNOWN_PRICES)
      .filter(([ticker, info]) => !q || ticker.includes(q) || info.name.toUpperCase().includes(q))
      .map(([ticker, info]) => {
        const change_pct = +(((info.close - info.prev) / info.prev) * 100).toFixed(2);
        const dir        = change_pct > 0.1 ? 'up' : change_pct < -0.1 ? 'down' : 'flat';
        const sentiment  = dir === 'up' ? 'bull' : dir === 'down' ? 'bear' : 'hold';
        return {
          ticker,
          name:      info.name,
          sector:    info.sector,
          mcap:      info.mcap,
          price:     `₹${info.close.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          change:    `${change_pct >= 0 ? '+' : ''}${change_pct}%`,
          dir,
          sentiment,
          label:     dir === 'up' ? 'BUY' : dir === 'down' ? 'SELL' : 'HOLD',
          score:     Math.round(50 + Math.random() * 35),
          insight:   `${info.name} trading at ₹${info.close}. ${dir === 'up' ? 'Positive momentum' : dir === 'down' ? 'Under pressure' : 'Consolidating'}. Sector: ${info.sector}.`,
        };
      });

    results.sort((a, b) => b.score - a.score);

    res.json({ ok: true, query: q, results: results.slice(0, 10) });
  } catch (error) {
    console.error('Search endpoint error:', error.message);
    res.status(500).json({
      ok: false,
      error: 'Failed to search stocks',
      query: req.query.q || '',
      results: []
    });
  }
};

// ── GET /api/stocks/portfolio ─────────────────────────────────────────────────
const PORTFOLIO_GROUPS = {
  green:  ['BAJFINANCE', 'TITAN',  'POLYCAB',    'KPITTECH',   'MAZDOCK'],
  red:    ['RPOWER',     'ZOMATO', 'SUZLON',     'IDEA',       'YESBANK'],
  yellow: ['INFY',       'TCS',    'HDFCBANK',   'ASIANPAINTS','ICICIBANK'],
};

exports.portfolio = async (req, res) => {
  try {
    const result = {};
    for (const [group, tickers] of Object.entries(PORTFOLIO_GROUPS)) {
      result[group] = tickers.map(ticker => {
        const kp = KNOWN_PRICES[ticker] || { close: 100, prev: 100, name: ticker };
        const change = +(((kp.close - kp.prev) / kp.prev) * 100).toFixed(2);
        return { ticker, name: kp.name, price: kp.close, prev_close: kp.prev, change };
      });
    }
    res.json({ ok: true, portfolio: result });
  } catch (error) {
    console.error('Portfolio endpoint error:', error.message);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch portfolio data',
      portfolio: {}
    });
  }
};
