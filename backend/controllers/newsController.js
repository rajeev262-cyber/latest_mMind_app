// controllers/newsController.js — Real-time news from Finnhub

const fetch = require('node-fetch');

const FINNHUB_KEY = process.env.FINNHUB_API_KEY || 'd7e9c7hr01qkuebjdr3gd7e9c7hr01qkuebjdr40';

// ── India & Economy filter keywords ──────────────────────────────────────────
const INDIA_KW = [
  'india','indian','nifty','sensex','rupee','bse','nse','rbi','sebi',
  'reliance','tcs','wipro','hdfc','infosys','bajaj','icici','sbi',
  'adani','tata','mahindra','mumbai','delhi','modi','budget','msci',
  'inr','bombay','national stock','zerodha','groww','paytm'
];

const ECONOMY_KW = [
  'gdp','inflation','recession','interest rate','federal reserve','fed','central bank',
  'fiscal','monetary','rbi rate','repo rate','economy','economic','cpi','ppi',
  'unemployment','trade deficit','imf','world bank','tariff','export','import',
  'current account','growth rate','stimulus','treasury','yield curve','bond'
];

const BULL_KW = ['surge','rally','gain','rise','bull','record high','profit','growth','boost','strong','beat','soar','jump','climb','recover','up','positive'];
const BEAR_KW = ['crash','fall','drop','plunge','bear','loss','low','recession','decline','weak','miss','warning','risk','fear','slump','tumble','concern','down','negative'];

// ── Static fallback articles (shown if API fails) ────────────────────────────
const STATIC_FALLBACK = [
  { headline: 'SEBI tightens F&O rules to protect retail investors; new margin norms from April 2026', source: 'Economic Times', datetime: Date.now()/1000 - 3600, summary: 'Market regulator SEBI has introduced stricter futures & options margin requirements to curb excessive speculation by retail traders.', url: '#', category: 'india' },
  { headline: 'RBI holds repo rate at 6.25%; flags global headwinds on inflation outlook', source: 'Business Standard', datetime: Date.now()/1000 - 7200, summary: 'The Monetary Policy Committee voted unanimously to keep rates unchanged while monitoring global crude oil prices and US Fed signals.', url: '#', category: 'india' },
  { headline: 'Nifty 50 rallies 1.4% on strong FII inflows; banking and auto stocks lead', source: 'Mint', datetime: Date.now()/1000 - 10800, summary: 'Foreign institutional investors pumped ₹4,200 Cr into Indian equities on Wednesday as global risk appetite improved.', url: '#', category: 'india' },
  { headline: 'HDFC Bank Q3 FY26 results beat Street estimates; NIM holds at 3.5%', source: 'Reuters India', datetime: Date.now()/1000 - 14400, summary: 'India\'s largest private sector bank reported a 19% YoY rise in net profit driven by loan growth and stable asset quality.', url: '#', category: 'india' },
  { headline: 'TCS secures $1.5B multi-year digital transformation deal from European bank', source: 'NDTV Profit', datetime: Date.now()/1000 - 18000, summary: 'Tata Consultancy Services won its largest European banking deal, strengthening its BFSI vertical pipeline heading into FY27.', url: '#', category: 'india' },
  { headline: 'Reliance Industries to invest ₹75,000 Cr in green energy over next 3 years', source: 'Bloomberg India', datetime: Date.now()/1000 - 21600, summary: 'The conglomerate announced a major capital expenditure roadmap for solar, wind, and green hydrogen infrastructure projects.', url: '#', category: 'india' },
  { headline: 'India GDP growth forecast raised to 7.2% for FY26 by IMF', source: 'IMF', datetime: Date.now()/1000 - 25200, summary: 'The International Monetary Fund upgraded India\'s growth projections citing resilient domestic consumption and strong services exports.', url: '#', category: 'economy' },
  { headline: 'US Federal Reserve signals two rate cuts in 2026 as inflation softens', source: 'Reuters', datetime: Date.now()/1000 - 28800, summary: 'Fed Chair Jerome Powell indicated confidence in the disinflation trajectory, opening the door for policy easing in H1 2026.', url: '#', category: 'economy' },
  { headline: 'India CPI inflation eases to 4.8% in November; food prices cool', source: 'MoSPI', datetime: Date.now()/1000 - 32400, summary: 'Consumer price inflation declined from 5.2% in October driven by falling vegetable and edible oil prices across major cities.', url: '#', category: 'economy' },
  { headline: 'Brent crude falls 3% as OPEC+ raises output; IEA cuts demand forecast', source: 'Financial Times', datetime: Date.now()/1000 - 36000, summary: 'Oil markets faced selling pressure after the OPEC+ alliance agreed to gradually unwind production cuts starting February 2026.', url: '#', category: 'economy' },
  { headline: 'World Bank raises India growth outlook to 6.9% citing infrastructure momentum', source: 'World Bank', datetime: Date.now()/1000 - 39600, summary: 'Record public capital expenditure in roads, railways, and ports is expected to crowd in private investment over the medium term.', url: '#', category: 'economy' },
  { headline: 'India trade deficit narrows to $18.2B in November on softer gold imports', source: 'RBI', datetime: Date.now()/1000 - 43200, summary: 'Merchandise exports rose 4.1% YoY while gold imports declined sharply after a record festive season in October.', url: '#', category: 'economy' },
];

function enrichArticle(a) {
  const txt  = ((a.headline || '') + ' ' + (a.summary || '')).toLowerCase();
  const bulls = BULL_KW.filter(w => txt.includes(w)).length;
  const bears = BEAR_KW.filter(w => txt.includes(w)).length;
  const sentiment = bulls > bears ? 'bull' : bears > bulls ? 'bear' : 'neutral';

  // Simple category detection
  const isIndia   = INDIA_KW.some(k => txt.includes(k));
  const isEconomy = ECONOMY_KW.some(k => txt.includes(k));
  const category  = isIndia ? 'india' : isEconomy ? 'economy' : 'general';

  // Time ago
  const secs = Math.floor(Date.now() / 1000 - (a.datetime || 0));
  let timeAgo = '';
  if (secs < 3600)        timeAgo = `${Math.floor(secs / 60)}m ago`;
  else if (secs < 86400)  timeAgo = `${Math.floor(secs / 3600)}h ago`;
  else                    timeAgo = `${Math.floor(secs / 86400)}d ago`;

  return {
    headline:  a.headline || '',
    summary:   a.summary  || 'Click to read the full article.',
    source:    a.source   || 'Finnhub',
    url:       a.url      || '#',
    datetime:  a.datetime || 0,
    timeAgo,
    sentiment,
    category,
  };
}

// ── GET /api/news ─────────────────────────────────────────────────────────────
exports.getNews = async (req, res) => {
  const category = req.query.category || 'india';

  try {
    const url = `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`;
    const response = await fetch(url, { timeout: 8000 });

    if (!response.ok) throw new Error(`Finnhub HTTP ${response.status}`);

    const raw = await response.json();
    if (!Array.isArray(raw) || raw.length === 0) throw new Error('Empty response');

    let articles = raw
      .filter(a => a.headline && a.headline.length > 10)
      .map(enrichArticle);

    // Filter by category
    if (category !== 'all') {
      const filtered = articles.filter(a => a.category === category);
      articles = filtered.length >= 3 ? filtered : articles; // fallback to all if too few
    }

    res.json({ ok: true, count: articles.length, source: 'finnhub', articles });

  } catch (err) {
    console.warn('[news] API failed:', err.message, '— using fallback');

    let fallback = STATIC_FALLBACK;
    if (category !== 'all') {
      fallback = STATIC_FALLBACK.filter(a => a.category === category);
    }
    const enriched = fallback.map(enrichArticle);
    res.json({ ok: true, count: enriched.length, source: 'fallback', articles: enriched });
  }
};
