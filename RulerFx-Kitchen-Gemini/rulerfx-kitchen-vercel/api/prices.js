/* ════════════════════════════════════════
   RulerFx Kitchen — Proxy: /api/prices
   Forwards requests to FCS API.
   Keys never leave this server.
═══════════════════════════════════════ */

const rateLimits = new Map();
const RATE_LIMIT  = 20;
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

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  if (!checkRateLimit(ip)) return res.status(429).json({ error: 'Too many requests' });

  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'Missing symbols param' });

  try {
    const url = `https://fcsapi.com/api-v3/forex/latest?symbol=${encodeURIComponent(symbols)}&access_key=${process.env.FCS_KEY}`;
    const response = await fetch(url);
    const data     = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('FCS proxy error:', err);
    return res.status(500).json({ error: 'Proxy server error' });
  }
}
