/* ════════════════════════════════════════
   RulerFx Kitchen — Single API handler
   Routes: /api/ai, /api/candles, /api/prices
═══════════════════════════════════════ */

const rateLimits = new Map();
function checkRateLimit(ip, limit = 10) {
  const now = Date.now();
  const rec = rateLimits.get(ip) || { count: 0, start: now };
  if (now - rec.start > 60000) { rateLimits.set(ip, { count: 1, start: now }); return true; }
  if (rec.count >= limit) return false;
  rec.count++;
  rateLimits.set(ip, rec);
  return true;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ip  = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const url = req.url || '';

  // ── Route: /api/ai ──
  if (url.includes('/ai') && req.method === 'POST') {
    if (!checkRateLimit(ip, 10)) return res.status(429).json({ error: 'Too many requests' });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not set' });

    const { messages, system, max_tokens } = req.body || {};
    if (!messages) return res.status(400).json({ error: 'Invalid body' });

    const userContent = messages.map(m => m.content).join('\n\n');
    const fullPrompt  = system ? `${system}\n\n${userContent}` : userContent;

    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: max_tokens || 1200, responseMimeType: 'application/json' },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ],
          }),
        }
      );
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || 'Gemini error' });
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) return res.status(500).json({ error: 'Empty Gemini response: ' + (data?.candidates?.[0]?.finishReason || 'unknown') });
      return res.status(200).json({ content: [{ type: 'text', text }], model: 'gemini-1.5-flash' });
    } catch (e) {
      return res.status(500).json({ error: 'Gemini proxy error: ' + e.message });
    }
  }

  // ── Route: /api/candles ──
  if (url.includes('/candles') && req.method === 'GET') {
    if (!checkRateLimit(ip, 30)) return res.status(429).json({ error: 'Too many requests' });
    if (!process.env.FINNHUB_KEY) return res.status(500).json({ error: 'FINNHUB_KEY not set' });

    const { symbol, resolution } = req.query || {};
    if (!symbol || !resolution) return res.status(400).json({ error: 'Missing params' });

    try {
      const now  = Math.floor(Date.now() / 1000);
      const mins = resolution === 'D' ? 1440 : parseInt(resolution);
      const from = now - mins * 220 * 60;
      const r    = await fetch(`https://finnhub.io/api/v1/forex/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${now}&token=${process.env.FINNHUB_KEY}`);
      const data = await r.json();
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: 'Finnhub proxy error: ' + e.message });
    }
  }

  // ── Route: /api/prices ──
  if (url.includes('/prices') && req.method === 'GET') {
    if (!checkRateLimit(ip, 20)) return res.status(429).json({ error: 'Too many requests' });
    if (!process.env.FCS_KEY) return res.status(500).json({ error: 'FCS_KEY not set' });

    const { symbols } = req.query || {};
    if (!symbols) return res.status(400).json({ error: 'Missing symbols' });

    try {
      const r    = await fetch(`https://fcsapi.com/api-v3/forex/latest?symbol=${encodeURIComponent(symbols)}&access_key=${process.env.FCS_KEY}`);
      const data = await r.json();
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: 'FCS proxy error: ' + e.message });
    }
  }

  return res.status(404).json({ error: 'Route not found: ' + url });
}
