/* ════════════════════════════════════════
   RulerFx Kitchen — Proxy: /api/candles
   Forwards requests to Finnhub API.
   Keys never leave this server.
═══════════════════════════════════════ */

const rateLimits = new Map();
const RATE_LIMIT  = 30;
const RATE_WINDOW = 60000;

function checkRateLimit(ip) {
  const now = Date.now();
  const rec = rateLimits.get(ip) || { count: 0, start: now };
  if (now - rec.start > RATE_WINDOW) { rateLimits.set(ip, { count: 1, start: now }); return true; }
  if (rec.count >= RATE_LIMIT) return false;
  rec.count++;
  rateLimits.set(ip, rec);
  return true;
}

export default async function handler(req, res) {
  // ── CORS ──
  const allowed = (process.env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim());
  const origin  = req.headers.origin || '';
  // Allow: same-origin (no origin header), wildcard, or configured origin
  const isAllowed = !origin || allowed.some(a => a === '*' || origin === a);
  if (!isAllowed) return res.status(403).json({ error: 'Forbidden' });

  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')     return res.status(405).json({ error: 'Method not allowed' });

  // ── RATE LIMIT ──
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  if (!checkRateLimit(ip)) return res.status(429).json({ error: 'Too many requests' });

  // ── VALIDATE PARAMS ──
  const { symbol, resolution } = req.query;
  if (!symbol || !resolution) return res.status(400).json({ error: 'Missing symbol or resolution' });

  // Whitelist allowed symbols — no arbitrary endpoints
  const ALLOWED_SYMBOLS = [
    'OANDA:EUR_USD','OANDA:GBP_USD','OANDA:USD_JPY','OANDA:USD_CHF',
    'OANDA:AUD_USD','OANDA:USD_CAD','OANDA:NZD_USD','OANDA:EUR_GBP',
    'OANDA:EUR_JPY','OANDA:GBP_JPY','OANDA:AUD_JPY','OANDA:CAD_JPY',
    'OANDA:CHF_JPY','OANDA:NZD_JPY','OANDA:EUR_CHF','OANDA:EUR_AUD',
    'OANDA:EUR_CAD','OANDA:EUR_NZD','OANDA:GBP_AUD','OANDA:GBP_CAD',
    'OANDA:GBP_CHF','OANDA:GBP_NZD','OANDA:AUD_CAD','OANDA:AUD_CHF',
    'OANDA:AUD_NZD','OANDA:CAD_CHF','OANDA:NZD_CAD','OANDA:NZD_CHF',
    'OANDA:USD_MXN','OANDA:USD_SGD','OANDA:USD_NOK','OANDA:USD_SEK',
    'OANDA:XAU_USD','OANDA:XAG_USD',
    'BINANCE:BTCUSDT','BINANCE:ETHUSDT','BINANCE:LTCUSDT','BINANCE:XRPUSDT',
  ];
  const ALLOWED_RESOLUTIONS = ['5','15','60','240','D'];

  if (!ALLOWED_SYMBOLS.includes(symbol)) {
    return res.status(400).json({ error: `Symbol not allowed: ${symbol}` });
  }
  if (!ALLOWED_RESOLUTIONS.includes(resolution)) {
    return res.status(400).json({ error: `Resolution not allowed: ${resolution}` });
  }

  // ── FORWARD TO FINNHUB ──
  try {
    const now  = Math.floor(Date.now() / 1000);
    const mins = resolution === 'D' ? 1440 : parseInt(resolution);
    const from = now - mins * 220 * 60;

    const url = `https://finnhub.io/api/v1/forex/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${now}&token=${process.env.FINNHUB_KEY}`;

    const response = await fetch(url);
    const data     = await response.json();

    if (!response.ok) return res.status(response.status).json({ error: 'Finnhub error' });

    return res.status(200).json(data);

  } catch (err) {
    console.error('Finnhub proxy error:', err);
    return res.status(500).json({ error: 'Proxy server error' });
  }
}
