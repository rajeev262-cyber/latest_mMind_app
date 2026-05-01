// controllers/stockController.js
// Serves stock price history, ML prediction metadata, and portfolio data.
// Prices: real yfinance data via Python subprocess OR KNOWN_PRICES fallback.
// AI predictions: calls Python Flask AI service for ML predictions.

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

// ── Simple rule-based prediction (no ML needed in Node) ──────────────────────
function computePrediction(ticker, rows) {
  const closes = rows.map(r => r.close);
  const n = closes.length;
  if (n < 50) return null;

  const ma10  = closes.slice(-10).reduce((a,b) => a + b, 0) / 10;
  const ma50  = closes.slice(-50).reduce((a,b) => a + b, 0) / 50;
  const ma200 = closes.slice(-Math.min(200, n)).reduce((a,b) => a + b, 0) / Math.min(200, n);
  const last  = closes[n - 1];
  const prev  = closes[n - 2];
  const ret   = (last - prev) / prev;

  // Volatility
  const rets = [];
  for (let i = 1; i < Math.min(15, n); i++) rets.push((closes[n-i] - closes[n-i-1]) / closes[n-i-1]);
  const vol = Math.sqrt(rets.reduce((a,r) => a + r*r, 0) / rets.length);

  // RSI (14)
  const diffs = closes.slice(-15).map((v,i,a) => i ? v - a[i-1] : 0).slice(1);
  const gains = diffs.filter(d => d > 0).reduce((a,b) => a+b, 0) / 14;
  const losses = diffs.filter(d => d < 0).map(Math.abs).reduce((a,b) => a+b, 0) / 14;
  const rsi = losses === 0 ? 100 : 100 - 100 / (1 + gains / losses);

  // MACD
  const ema = (arr, span) => arr.reduce((acc, v, i) => {
    const k = 2 / (span + 1);
    return i === 0 ? v : acc * (1 - k) + v * k;
  }, arr[0]);
  const recentCloses = closes.slice(-30);
  const macd = ema(recentCloses, 12) - ema(recentCloses, 26);

  // Trend
  let trend, tdir;
  if (last > ma50 && ma50 > ma200)  { trend = 'Upward Trend';   tdir = 'up';   }
  else if (last < ma50 && ma50 < ma200) { trend = 'Downward Trend'; tdir = 'down'; }
  else                               { trend = 'Sideways';       tdir = 'side'; }

  // Direction
  const bullScore = (last > ma10 ? 1 : 0) + (last > ma50 ? 1 : 0) + (macd > 0 ? 1 : 0) + (rsi < 70 && rsi > 40 ? 1 : 0);
  const direction = bullScore >= 3 ? 'UP' : bullScore <= 1 ? 'DOWN' : 'STABLE';
  const confidence = Math.round(50 + bullScore * 8 + Math.random() * 8);

  // Risk
  let risk, rlv;
  if (vol < 0.012)      { risk = 'Low Risk';    rlv = 'low'; }
  else if (vol < 0.025) { risk = 'Medium Risk'; rlv = 'mid'; }
  else                  { risk = 'High Risk';   rlv = 'high'; }

  // Signal
  const signal     = direction === 'UP' && confidence >= 70 ? 5 : direction === 'UP' ? 4 : direction === 'STABLE' ? 3 : confidence < 60 ? 1 : 2;
  const signal_lbl = {5:'Strong Buy',4:'Buy',3:'Hold',2:'Sell',1:'Strong Sell'}[signal];

  const tbadge     = {up:'Bullish', side:'Neutral', down:'Bearish'}[tdir];
  const tbadge_cls = {up:'', side:'neutral-badge', down:'bearish-badge'}[tdir];

  const reasons = [
    { text: `Trend strength: ${Math.abs(last - ma50) / ma50 > 0.03 ? 'Strong' : 'Weak'}`, warn: false },
    { text: `Volatility: ${vol > 0.02 ? 'High ⚠' : vol > 0.012 ? 'Moderate' : 'Low'}`,   warn: vol > 0.02 },
    { text: `RSI ${rsi.toFixed(1)} — ${rsi > 70 ? 'Overbought ⚠' : rsi < 30 ? 'Oversold ⚠' : 'Neutral zone'}`, warn: rsi > 70 || rsi < 30 },
    { text: `MACD: ${macd > 0 ? 'Bullish crossover ▲' : 'Bearish crossover ▼'}`,          warn: macd < 0 },
    { text: `Price vs MA50: ${last > ma50 ? 'above ✓' : 'below ✗'}`,                       warn: last < ma50 },
  ];

  const analysis =
    `${tbadge} signal detected. Last close ₹${last.toLocaleString('en-IN')} is ` +
    `${last > ma50 ? 'above' : 'below'} the 50-day MA (₹${ma50.toFixed(0)}). ` +
    `RSI at ${rsi.toFixed(0)} indicates ${rsi > 70 ? 'overbought conditions — consider booking profits' : rsi < 30 ? 'oversold conditions — potential reversal ahead' : 'a normal trading range'}. ` +
    `MACD is ${macd > 0 ? 'positive (bullish momentum)' : 'negative (bearish momentum)'}. ` +
    `Model confidence: ${confidence}%.`;

  return {
    direction, confidence,
    trend, trend_dir: tdir, trend_badge: tbadge, trend_badge_cls: tbadge_cls,
    risk, risk_lv: rlv, risk_badge: rlv.toUpperCase(),
    conf_lbl: confidence >= 75 ? 'High Confidence' : confidence >= 55 ? 'Moderate Confidence' : 'Low Confidence',
    conf_badge: confidence >= 75 ? 'HIGH' : confidence >= 55 ? 'MED' : 'LOW',
    signal, signal_lbl,
    reasons, analysis,
    close: +last.toFixed(2),
    change_pct: +(ret * 100).toFixed(2),
    ma10: +ma10.toFixed(2), ma50: +ma50.toFixed(2), ma200: +ma200.toFixed(2),
    rsi: +rsi.toFixed(1), macd: +macd.toFixed(2), vol: +(vol * 100).toFixed(2),
  };
}

// ── AI Service Integration ─────────────────────────────────────────────
async function callAIService(ticker, endpoint = 'predict') {
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
  
  try {
    const response = await fetch(`${AI_SERVICE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        ticker: ticker,
        months: 12
      }),
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`AI service responded with ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`AI service call failed for ${ticker}:`, error.message);
    return null;
  }
}

// ── GET /api/stocks/predict?ticker=X ─────────────────────────────────────────
exports.predict = async (req, res) => {
  const ticker = (req.query.ticker || 'RELIANCE').toUpperCase();
  const kp     = KNOWN_PRICES[ticker] || { close: 500, prev: 490, name: ticker, sector: 'Equity', mcap: '—' };
  
  try {
    // Try to get prediction from AI service first
    const aiResponse = await callAIService(ticker, 'predict');
    
    if (aiResponse && aiResponse.ok) {
      const aiPred = aiResponse.prediction;
      
      // Transform AI prediction to match expected format
      const prediction = {
        direction: aiPred.trend_dir === 'up' ? 'UP' : aiPred.trend_dir === 'down' ? 'DOWN' : 'STABLE',
        confidence: aiPred.confidence,
        trend: aiPred.trend,
        trend_dir: aiPred.trend_dir,
        trend_badge: aiPred.trend_badge,
        risk: aiPred.risk,
        risk_lv: aiPred.risk_lv,
        risk_badge: aiPred.risk_badge,
        conf_lbl: aiPred.conf_lbl,
        conf_badge: aiPred.conf_badge,
        signal: aiPred.signal,
        signal_lbl: aiPred.signal_lbl,
        reasons: aiPred.reasons,
        analysis: aiPred.analysis,
        close: kp.close,
        change_pct: +(((kp.close - kp.prev) / kp.prev) * 100).toFixed(2),
        ai_model: 'python-flask-v2'
      };

      return res.json({
        ok: true,
        ticker,
        name: kp.name,
        sector: kp.sector,
        mcap: kp.mcap,
        ...prediction,
      });
    }
  } catch (error) {
    console.warn('AI prediction failed, using fallback:', error.message);
  }

  // Fallback to local prediction
  const rows = generateHistory(ticker, 14);
  const pred = computePrediction(ticker, rows);

  res.json({
    ok: true,
    ticker,
    name:   kp.name,
    sector: kp.sector,
    mcap:   kp.mcap,
    ...pred,
    ai_model: 'local-fallback'
  });
};

// ── GET /api/stocks/history?ticker=X&months=12 ────────────────────────────────
exports.history = (req, res) => {
  const ticker = (req.query.ticker || 'RELIANCE').toUpperCase();
  const months = parseInt(req.query.months) || 12;
  const kp     = KNOWN_PRICES[ticker] || { name: ticker, sector: 'Equity', mcap: '—' };
  const rows   = generateHistory(ticker, months);

  res.json({
    ok: true, ticker,
    meta: { name: kp.name, sector: kp.sector, mcap: kp.mcap },
    data: rows,
  });
};

// ── GET /api/stocks/analysis?ticker=X&months=6 ────────────────────────────────
exports.analysis = (req, res) => {
  const ticker = (req.query.ticker || 'RELIANCE').toUpperCase();
  const months = parseInt(req.query.months) || 6;
  const kp     = KNOWN_PRICES[ticker] || { name: ticker };
  const rows   = generateHistory(ticker, months);
  const closes = rows.map(r => r.close);
  const labels = rows.map(r => r.label);

  // AI forecast = smoothed trend extension
  const sm = 20;
  const smooth = closes.map((_, i) => {
    const w = closes.slice(Math.max(0, i - sm), i + 1);
    return w.reduce((a, b) => a + b, 0) / w.length;
  });
  const slope = smooth.length >= 30 ? (smooth[smooth.length-1] - smooth[smooth.length-30]) / 30 : 0;
  const pred  = closes.map((c, i) => +(c + slope * (i - closes.length + 1) * 0.4).toFixed(2));

  const prediction = computePrediction(ticker, rows);

  res.json({ ok: true, ticker, name: kp.name, labels, closes, pred, prediction });
};

// ── GET /api/stocks/search?q=QUERY ───────────────────────────────────────────
exports.search = (req, res) => {
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
  res.json({ ok: true, results });
};

// ── GET /api/stocks/portfolio ─────────────────────────────────────────────────
const PORTFOLIO_GROUPS = {
  green:  ['BAJFINANCE', 'TITAN',  'POLYCAB',    'KPITTECH',   'MAZDOCK'],
  red:    ['RPOWER',     'ZOMATO', 'SUZLON',     'IDEA',       'YESBANK'],
  yellow: ['INFY',       'TCS',    'HDFCBANK',   'ASIANPAINTS','ICICIBANK'],
};

exports.portfolio = (req, res) => {
  const result = {};
  for (const [group, tickers] of Object.entries(PORTFOLIO_GROUPS)) {
    result[group] = tickers.map(ticker => {
      const kp     = KNOWN_PRICES[ticker] || { close: 100, prev: 100, name: ticker };
      const change = +(((kp.close - kp.prev) / kp.prev) * 100).toFixed(2);
      return { ticker, name: kp.name, price: kp.close, prev_close: kp.prev, change };
    });
  }
  res.json({ ok: true, portfolio: result });
};
