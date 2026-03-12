/* ════════════════════════════════════════
   RulerFx Kitchen — Proxy: /api/ai
   Powered by Google Gemini 1.5 Flash
   Free tier — no credit card needed
   Keys never leave this server.
═══════════════════════════════════════ */

const rateLimits = new Map();
const RATE_LIMIT  = 10;
const RATE_WINDOW = 60000;

function checkRateLimit(ip) {
  const now = Date.now();
  const rec = rateLimits.get(ip) || { count: 0, start: now };
  if (now - rec.start > RATE_WINDOW) {
    rateLimits.set(ip, { count: 1, start: now });
    return true;
  }
  if (rec.count >= RATE_LIMIT) return false;
  rec.count++;
  rateLimits.set(ip, rec);
  return true;
}

export default async function handler(req, res) {
  // ── CORS ──
  const allowed   = (process.env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim());
  const origin    = req.headers.origin || '';
  const isAllowed = !origin || allowed.some(a => a === '*' || origin === a);
  if (!isAllowed) return res.status(403).json({ error: 'Forbidden: origin not allowed' });

  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  // ── RATE LIMIT ──
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  // ── VALIDATE ──
  const { messages, system, max_tokens } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
  }

  // ── BUILD GEMINI PROMPT ──
  // Gemini uses a single prompt string — merge system + user messages
  const userContent = messages.map(m => m.content).join('\n\n');
  const fullPrompt  = system ? `${system}\n\n${userContent}` : userContent;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature:     0.2,   // low = precise, consistent JSON output
          maxOutputTokens: max_tokens || 1200,
          responseMimeType: 'application/json', // force JSON output
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || 'Gemini API error';
      console.error('Gemini error:', data);
      return res.status(response.status).json({ error: errMsg });
    }

    // Extract text from Gemini response
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      const finishReason = data?.candidates?.[0]?.finishReason;
      return res.status(500).json({
        error: `Gemini returned empty response. Finish reason: ${finishReason || 'unknown'}`
      });
    }

    // Normalize to the shape frontend expects: data.content[0].text
    return res.status(200).json({
      content: [{ type: 'text', text }],
      model:   'gemini-1.5-flash',
    });

  } catch (err) {
    console.error('Gemini proxy error:', err);
    return res.status(500).json({ error: 'Proxy server error: ' + err.message });
  }
}
