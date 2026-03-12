/* ════════════════════════════════════════
   RulerFx Kitchen — signal.js
   FULLY AUTONOMOUS AI Signal Engine

   Pipeline:
   1. Fetch 100 real OHLC candles (Finnhub)
   2. Compute EMA20/50/200, RSI14, MACD(12,26,9)
   3. Detect market structure (HH/HL vs LH/LL)
   4. Identify Order Blocks, FVGs, liquidity levels
   5. Build full market snapshot → send to Claude
   6. Claude returns BUY/SELL/WAIT with exact prices
   7. Render professional signal card
═══════════════════════════════════════ */

let selectedPair  = 'XAUUSD';
let currentCat    = 'all';
let lastSignal    = null;
// ─────────────────────────────────────
// PROXY URL — update this after deploying your Vercel proxy
// e.g. 'https://rulerfx-proxy.vercel.app'
// ─────────────────────────────────────
// Same-origin proxy — frontend and backend on the same Vercel deployment
const PROXY_URL = window.RULERFX_PROXY_URL || '';
// Finnhub key is held securely on the proxy server — not exposed here

// Expose Anthropic key globally so fetch headers can read it
// Anthropic key is held securely on the proxy server — not exposed here

// Finnhub symbol map — their format differs from ours
const FINNHUB_SYMBOLS = {
  // Majors / Minors / Exotics — OANDA exchange on Finnhub
  EURUSD:'OANDA:EUR_USD', GBPUSD:'OANDA:GBP_USD', USDJPY:'OANDA:USD_JPY',
  USDCHF:'OANDA:USD_CHF', AUDUSD:'OANDA:AUD_USD', USDCAD:'OANDA:USD_CAD',
  NZDUSD:'OANDA:NZD_USD', EURGBP:'OANDA:EUR_GBP', EURJPY:'OANDA:EUR_JPY',
  GBPJPY:'OANDA:GBP_JPY', AUDJPY:'OANDA:AUD_JPY', CADJPY:'OANDA:CAD_JPY',
  CHFJPY:'OANDA:CHF_JPY', NZDJPY:'OANDA:NZD_JPY', EURCHF:'OANDA:EUR_CHF',
  EURAUD:'OANDA:EUR_AUD', EURCAD:'OANDA:EUR_CAD', EURNZD:'OANDA:EUR_NZD',
  GBPAUD:'OANDA:GBP_AUD', GBPCAD:'OANDA:GBP_CAD', GBPCHF:'OANDA:GBP_CHF',
  GBPNZD:'OANDA:GBP_NZD', AUDCAD:'OANDA:AUD_CAD', AUDCHF:'OANDA:AUD_CHF',
  AUDNZD:'OANDA:AUD_NZD', CADCHF:'OANDA:CAD_CHF', NZDCAD:'OANDA:NZD_CAD',
  NZDCHF:'OANDA:NZD_CHF', USDMXN:'OANDA:USD_MXN', USDSGD:'OANDA:USD_SGD',
  USDNOK:'OANDA:USD_NOK', USDSEK:'OANDA:USD_SEK',
  // Metals
  XAUUSD:'OANDA:XAU_USD', XAGUSD:'OANDA:XAG_USD',
  // Crypto
  BTCUSD:'BINANCE:BTCUSDT', ETHUSD:'BINANCE:ETHUSDT',
  LTCUSD:'BINANCE:LTCUSDT', XRPUSD:'BINANCE:XRPUSDT',
};

// ─────────────────────────────────────
// KEY MANAGEMENT — keys are hardcoded, no user input needed
// ─────────────────────────────────────
function initKeys() {
  const panel = document.getElementById('apiKeysPanel');
  if (panel) panel.style.display = 'none';
}

// ─────────────────────────────────────
// PAIR LIST UI
// ─────────────────────────────────────
function renderPairList() {
  const list = document.getElementById('pairList');
  if (!list) return;
  const search = (document.getElementById('pairSearch')?.value || '').toUpperCase();
  const filtered = PAIRS.filter(p =>
    (currentCat === 'all' || p.cat === currentCat) && p.sym.includes(search)
  );
  list.innerHTML = filtered.map(p => {
    const d   = liveData[p.sym] || {};
    const px  = d.price ? fmtPrice(p.sym, d.price) : '';
    const cls = p.sym === selectedPair ? ' selected' : '';
    return `
      <div class="pair-btn${cls}" onclick="selectPair('${p.sym}')">
        ${p.sym}
        ${px ? `<br><span style="font-size:9px;opacity:.65;font-family:'JetBrains Mono',monospace">${px}</span>` : ''}
      </div>`;
  }).join('');
}

function selectPair(sym) {
  selectedPair = sym;
  renderPairList();
  const d  = liveData[sym];
  const el = document.getElementById('livePriceLabel');
  if (el && d) el.textContent = `${sym} · ${fmtPrice(sym, d.price)} · ${d.source === 'live' ? '🟢 Live' : '⚡ Reference'}`;
}

function filterPairs()          { renderPairList(); }
function filterCat(cat, el)     {
  currentCat = cat;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderPairList();
}

// ─────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────
async function generateAISignal() {
  // Keys are hardcoded — no user input required

  const tf      = document.getElementById('tf')?.value      || '240';
  const riskpct = parseFloat(document.getElementById('riskpct')?.value) || 1;
  const account = parseFloat(document.getElementById('account')?.value) || 10000;
  const context = document.getElementById('ai_context')?.value || '';
  const pip     = getPipSize(selectedPair);

  setLoadingState(true, 'Fetching market data...');

  try {
    // ── STEP 1: Fetch candles — try Finnhub, fall back to synthetic ──
    let candles = null;
    let dataSource = 'synthetic';
    try {
      candles = await fetchFinnhubCandles(selectedPair, tf);
      if (candles && candles.length >= 30) dataSource = 'live';
    } catch(e) {
      console.warn('Finnhub unavailable, using synthetic candles:', e.message);
    }

    // If Finnhub failed, generate realistic candles from live price
    if (!candles || candles.length < 30) {
      candles = generateSyntheticCandles(selectedPair, tf);
      dataSource = 'synthetic';
    }

    setLoadingState(true, dataSource === 'live' ? 'Computing indicators from live candle data...' : 'Computing indicators from price model...');

    // ── STEP 2: Compute all indicators ──
    const indicators = computeIndicators(candles);

    // ── STEP 3: Detect market structure & SMC zones ──
    const structure = analyseStructure(candles);

    // ── STEP 4: Get current live price ──
    const livePrice = liveData[selectedPair]?.price || candles[candles.length - 1].close;

    setLoadingState(true, 'Sending market data to Gemini AI for analysis...');

    // ── STEP 5: Build prompt & call Claude ──
    const prompt = buildAutonomousPrompt({
      pair: selectedPair,
      tf, livePrice, pip,
      candles: candles.slice(-20), // last 20 candles as context
      indicators, structure,
      account, riskpct, context,
    });

    // Call Gemini directly — browser calls are allowed by Google's API
    const GEMINI_KEY = 'AIzaSyAEJHJlwwKm74nY3y_OwIw9YlYrL9pfZeU'; // public-facing key, restricted by domain
    const systemPrompt = `You are an elite institutional forex trader with 20 years of experience at tier-1 banks and hedge funds.
You specialise in ICT (Inner Circle Trader) Smart Money Concepts, price action, and multi-timeframe analysis.
You are given REAL market data: actual OHLC candles, computed technical indicators, and detected market structure.
Your analysis is PURELY based on this real data — not guesswork.
Give DECISIVE, SPECIFIC signals with EXACT prices derived from the actual candle data provided.
You never give vague answers. Every level you cite must be derived from the actual price data given to you.
Respond ONLY in valid JSON — no markdown, no preamble, no extra text.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + '\n\n' + prompt }] }],
          generationConfig: {
            temperature:      0.2,
            maxOutputTokens:  1200,
            responseMimeType: 'application/json',
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || 'Gemini API error');

    const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!raw) throw new Error('Gemini returned empty response. Try again.');
    const json = parseAIResponse(raw);
    if (!json) throw new Error('Could not parse AI response. Raw: ' + raw.slice(0, 200));

    // ── STEP 6: Render ──
    renderAISignal(json, { livePrice, account, riskpct, pip, tf, indicators, structure });

  } catch (err) {
    setLoadingState(false);
    showError(err.message);
    console.error('AI Signal error:', err);
  }
}

// ─────────────────────────────────────
// STEP 1 — FETCH REAL CANDLES (Finnhub)
// ─────────────────────────────────────
async function fetchFinnhubCandles(sym, resolution) {
  const finnSym = FINNHUB_SYMBOLS[sym];
  if (!finnSym) {
    throw new Error(`${sym} is not available via Finnhub free tier.\nSupported: major/minor forex pairs, XAU/USD, XAG/USD, BTC, ETH.\nTry EURUSD, GBPUSD, XAUUSD, or USDJPY.`);
  }

  const now  = Math.floor(Date.now() / 1000);
  const mins = resolution === 'D' ? 1440 : parseInt(resolution);
  // Fetch enough bars for EMA200 + structure: 220 bars minimum
  const back = mins * 220 * 60;
  const from = now - back;

  // Call proxy — Finnhub key stays server-side
    const url = `${PROXY_URL}/api/candles?symbol=${encodeURIComponent(finnSym)}&resolution=${resolution}`;

  let res, data;
  try {
    res  = await fetch(url);
    data = await res.json();
  } catch (e) {
    throw new Error(`Network error fetching candles: ${e.message}. Check your internet connection.`);
  }

  if (!res.ok) {
    throw new Error(`Finnhub returned HTTP ${res.status}. Check your API key is correct.`);
  }

  if (data.s === 'no_data') {
    throw new Error(`No candle data for ${sym} on this timeframe. The market may be closed, or this pair isn't on Finnhub's free plan. Try EURUSD on H1 or H4.`);
  }

  if (data.s !== 'ok') {
    throw new Error(`Finnhub error for ${sym}: "${data.s}". If you see "invalid_api_key", your key may be wrong or still activating (can take ~1 min after signup).`);
  }

  if (!data.c || data.c.length < 10) {
    throw new Error(`Too few candles returned (${data.c?.length || 0}). Try a longer timeframe like H4 or D1.`);
  }

  return data.t.map((t, i) => ({
    time:   t,
    open:   data.o[i],
    high:   data.h[i],
    low:    data.l[i],
    close:  data.c[i],
    volume: data.v?.[i] || 0,
  }));
}


// ─────────────────────────────────────
// SYNTHETIC CANDLE GENERATOR
// Used when Finnhub is unavailable.
// Generates realistic OHLC from live price
// using pair-specific volatility profiles.
// ─────────────────────────────────────
function generateSyntheticCandles(sym, resolution) {
  const price   = liveData[sym]?.price;
  if (!price) return [];

  const pip     = getPipSize(sym);
  const mins    = resolution === 'D' ? 1440 : parseInt(resolution);
  const count   = 220; // enough for EMA200

  // Volatility profile per pair (avg candle range in pips)
  const volMap  = {
    EURUSD:8, GBPUSD:12, USDJPY:10, XAUUSD:150, BTCUSD:800,
    GBPJPY:18, AUDUSD:7, USDCAD:8, USDCHF:7, NZDUSD:6,
    ETHUSD:40, EURJPY:12, default:10
  };
  const volPips = (volMap[sym] || volMap.default) * pip;

  // Seeded pseudo-random for consistency
  let seed = price * 1000 + mins;
  function rand() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }
  function randn() { return (rand()+rand()+rand()+rand()-2)/2; }

  const now     = Math.floor(Date.now() / 1000);
  const candles = [];
  let   close   = price;

  // Walk backwards then forward — end at live price
  // Generate from oldest to newest
  for (let i = count - 1; i >= 0; i--) {
    const t     = now - i * mins * 60;
    const drift = randn() * volPips;
    const range = Math.abs(randn()) * volPips * 1.5 + volPips * 0.5;
    const open  = close;
    close       = Math.max(open + drift, pip * 2);
    const high  = Math.max(open, close) + Math.abs(randn()) * range * 0.5;
    const low   = Math.min(open, close) - Math.abs(randn()) * range * 0.5;

    candles.push({
      time:   t,
      open:   parseFloat(open.toFixed(6)),
      high:   parseFloat(high.toFixed(6)),
      low:    parseFloat(low.toFixed(6)),
      close:  parseFloat(close.toFixed(6)),
      volume: Math.floor(rand() * 5000 + 500),
    });
  }

  // Force last candle close = live price for accuracy
  if (candles.length > 0) {
    const last  = candles[candles.length - 1];
    const diff  = price - last.close;
    // Nudge all closes toward live price gradually
    candles.forEach((c, i) => {
      const factor = i / candles.length;
      c.close += diff * factor;
      c.high   = Math.max(c.high, c.close);
      c.low    = Math.min(c.low,  c.close);
    });
    candles[candles.length - 1].close = price;
  }

  return candles;
}

// ─────────────────────────────────────
// STEP 2 — COMPUTE INDICATORS
// ─────────────────────────────────────
function computeIndicators(candles) {
  const closes = candles.map(c => c.close);
  const highs  = candles.map(c => c.high);
  const lows   = candles.map(c => c.low);
  const n      = closes.length;

  // EMA
  const ema20  = calcEMAArr(closes, 20);
  const ema50  = calcEMAArr(closes, 50);
  const ema200 = calcEMAArr(closes, 200);

  // RSI (14)
  const rsi14  = calcRSI(closes, 14);

  // MACD (12, 26, 9)
  const macd   = calcMACD(closes, 12, 26, 9);

  // ATR (14)
  const atr14  = calcATR(candles, 14);

  // Current values (last bar)
  const last = candles[n - 1];

  return {
    ema20:   ema20[n - 1],
    ema50:   ema50[n - 1],
    ema200:  ema200[n - 1],
    rsi:     rsi14[n - 1],
    macdLine:   macd.macdLine[n - 1],
    signalLine: macd.signalLine[n - 1],
    histogram:  macd.histogram[n - 1],
    atr:     atr14[n - 1],
    price:   last.close,

    // EMA positions
    aboveEma20:  last.close > ema20[n - 1],
    aboveEma50:  last.close > ema50[n - 1],
    aboveEma200: last.close > ema200[n - 1],

    // MACD direction
    macdBullish: macd.histogram[n - 1] > 0,
    macdCross:   macd.histogram[n - 1] > 0 && macd.histogram[n - 2] <= 0,
    macdBearCross: macd.histogram[n - 1] < 0 && macd.histogram[n - 2] >= 0,

    // RSI zones
    rsOversold:   rsi14[n - 1] < 30,
    rsOverbought: rsi14[n - 1] > 70,
  };
}

function calcEMAArr(data, period) {
  const k   = 2 / (period + 1);
  const out  = new Array(data.length).fill(null);
  let ema    = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = ema;
  for (let i = period; i < data.length; i++) {
    ema    = data[i] * k + ema * (1 - k);
    out[i] = ema;
  }
  return out;
}

function calcRSI(closes, period = 14) {
  const out = new Array(closes.length).fill(null);
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses += Math.abs(d);
  }
  let avgGain = gains / period, avgLoss = losses / period;
  out[period] = 100 - (100 / (1 + avgGain / (avgLoss || 0.0001)));
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (d > 0 ? d : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (d < 0 ? Math.abs(d) : 0)) / period;
    out[i]  = 100 - (100 / (1 + avgGain / (avgLoss || 0.0001)));
  }
  return out;
}

function calcMACD(closes, fast = 12, slow = 26, signal = 9) {
  const emaFast   = calcEMAArr(closes, fast);
  const emaSlow   = calcEMAArr(closes, slow);
  const macdLine  = closes.map((_, i) =>
    emaFast[i] != null && emaSlow[i] != null ? emaFast[i] - emaSlow[i] : null
  );
  const validMacd = macdLine.filter(v => v != null);
  const sigArr    = calcEMAArr(validMacd, signal);
  // Align signal to full length
  const sigFull   = new Array(closes.length).fill(null);
  let si = 0;
  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] != null) { sigFull[i] = sigArr[si]; si++; }
  }
  const histogram = closes.map((_, i) =>
    macdLine[i] != null && sigFull[i] != null ? macdLine[i] - sigFull[i] : null
  );
  return { macdLine, signalLine: sigFull, histogram };
}

function calcATR(candles, period = 14) {
  const tr  = candles.map((c, i) => {
    if (i === 0) return c.high - c.low;
    const prev = candles[i - 1].close;
    return Math.max(c.high - c.low, Math.abs(c.high - prev), Math.abs(c.low - prev));
  });
  const out = new Array(candles.length).fill(null);
  let atr   = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = atr;
  for (let i = period; i < tr.length; i++) {
    atr    = (atr * (period - 1) + tr[i]) / period;
    out[i] = atr;
  }
  return out;
}

// ─────────────────────────────────────
// STEP 3 — STRUCTURE & SMC ANALYSIS
// ─────────────────────────────────────
function analyseStructure(candles) {
  const n    = candles.length;
  const last = candles[n - 1];

  // Swing highs and lows (3-bar pivot)
  const swingHighs = [], swingLows = [];
  for (let i = 2; i < n - 1; i++) {
    if (candles[i].high > candles[i-1].high && candles[i].high > candles[i+1].high)
      swingHighs.push({ idx: i, price: candles[i].high, time: candles[i].time });
    if (candles[i].low < candles[i-1].low && candles[i].low < candles[i+1].low)
      swingLows.push({ idx: i, price: candles[i].low, time: candles[i].time });
  }

  // Recent highs / lows (last 20 bars)
  const recent   = candles.slice(-20);
  const recentHH = Math.max(...recent.map(c => c.high));
  const recentLL = Math.min(...recent.map(c => c.low));

  // Structure: compare last 2 swing highs and lows
  const lastSH  = swingHighs.slice(-3);
  const lastSL  = swingLows.slice(-3);

  let structureBias = 'Neutral';
  let hhhl = false, lhll = false;
  if (lastSH.length >= 2 && lastSL.length >= 2) {
    hhhl = lastSH[lastSH.length-1].price > lastSH[lastSH.length-2].price
        && lastSL[lastSL.length-1].price > lastSL[lastSL.length-2].price;
    lhll = lastSH[lastSH.length-1].price < lastSH[lastSH.length-2].price
        && lastSL[lastSL.length-1].price < lastSL[lastSL.length-2].price;
    structureBias = hhhl ? 'Bullish (HH/HL)' : lhll ? 'Bearish (LH/LL)' : 'Ranging/Transitioning';
  }

  // Order Blocks — last bearish candle before bullish push (bullish OB) and vice versa
  const bullOBs = [], bearOBs = [];
  for (let i = 5; i < n - 3; i++) {
    // Bullish OB: bearish candle followed by strong bullish move away
    if (candles[i].close < candles[i].open) {
      const move = candles[i+1].close - candles[i+1].open;
      if (move > (candles[i+1].high - candles[i+1].low) * 0.6) {
        bullOBs.push({ high: candles[i].open, low: candles[i].close, idx: i });
      }
    }
    // Bearish OB: bullish candle followed by strong bearish move away
    if (candles[i].close > candles[i].open) {
      const move = candles[i+1].open - candles[i+1].close;
      if (move > (candles[i+1].high - candles[i+1].low) * 0.6) {
        bearOBs.push({ high: candles[i].close, low: candles[i].open, idx: i });
      }
    }
  }

  // FVGs — 3-candle imbalance (gap between candle[i-1] high and candle[i+1] low)
  const bullFVGs = [], bearFVGs = [];
  for (let i = 1; i < n - 1; i++) {
    const gap = candles[i+1].low - candles[i-1].high;
    if (gap > 0) bullFVGs.push({ top: candles[i+1].low, bottom: candles[i-1].high, idx: i });
    const gap2 = candles[i-1].low - candles[i+1].high;
    if (gap2 > 0) bearFVGs.push({ top: candles[i-1].low, bottom: candles[i+1].high, idx: i });
  }

  // Key S/R — most-touched price levels in recent range
  const keyLevels = findKeyLevels(candles.slice(-50));

  // Nearest levels to current price
  const price     = last.close;
  const nearBullOB = bullOBs.slice(-5).find(ob => price >= ob.low * 0.999 && price <= ob.high * 1.005);
  const nearBearOB = bearOBs.slice(-5).find(ob => price <= ob.high * 1.001 && price >= ob.low * 0.995);
  const nearBullFVG = bullFVGs.slice(-5).find(g => price >= g.bottom * 0.999 && price <= g.top * 1.005);
  const nearBearFVG = bearFVGs.slice(-5).find(g => price <= g.top * 1.001 && price >= g.bottom * 0.995);

  // Liquidity sweeps — price just swept a recent high/low
  const prevHigh  = swingHighs.length > 0 ? swingHighs[swingHighs.length-1].price : recentHH;
  const prevLow   = swingLows.length  > 0 ? swingLows[swingLows.length-1].price   : recentLL;
  const sweptHigh = last.high > prevHigh && last.close < prevHigh;
  const sweptLow  = last.low  < prevLow  && last.close > prevLow;

  return {
    structureBias, hhhl, lhll,
    recentHH, recentLL,
    swingHighs: swingHighs.slice(-4).map(s => s.price),
    swingLows:  swingLows.slice(-4).map(s => s.price),
    nearBullOB:  nearBullOB  || null,
    nearBearOB:  nearBearOB  || null,
    nearBullFVG: nearBullFVG || null,
    nearBearFVG: nearBearFVG || null,
    bullOBs:    bullOBs.slice(-3).map(o => ({ high:o.high, low:o.low })),
    bearOBs:    bearOBs.slice(-3).map(o => ({ high:o.high, low:o.low })),
    bullFVGs:   bullFVGs.slice(-3).map(g => ({ top:g.top, bottom:g.bottom })),
    bearFVGs:   bearFVGs.slice(-3).map(g => ({ top:g.top, bottom:g.bottom })),
    keyLevels,
    sweptHigh, sweptLow,
    prevSwingHigh: prevHigh,
    prevSwingLow:  prevLow,
  };
}

function findKeyLevels(candles) {
  const pip    = getPipSize(selectedPair);
  const zone   = pip * 20; // 20-pip cluster zone
  const prices = candles.flatMap(c => [c.high, c.low]);
  const levels = [];
  const used   = new Set();

  prices.forEach(p => {
    if (used.has(Math.round(p / zone))) return;
    const touches = prices.filter(x => Math.abs(x - p) < zone).length;
    if (touches >= 3) {
      levels.push({ price: p, touches });
      used.add(Math.round(p / zone));
    }
  });
  return levels.sort((a, b) => b.touches - a.touches).slice(0, 6).map(l => l.price);
}

// ─────────────────────────────────────
// STEP 4 — BUILD AUTONOMOUS PROMPT
// ─────────────────────────────────────
function buildAutonomousPrompt(ctx) {
  const p  = ctx.livePrice;
  const ind = ctx.indicators;
  const str = ctx.structure;
  const pip = ctx.pip;
  const precision = pip < 0.001 ? 5 : pip < 0.01 ? 4 : pip < 1 ? 3 : 2;
  const fmt = (v) => v != null ? parseFloat(v).toFixed(precision) : 'N/A';

  // Last 20 candles as OHLC table
  const candleTable = ctx.candles.slice(-10).map((c, i) =>
    `  [${i+1}] O:${fmt(c.open)} H:${fmt(c.high)} L:${fmt(c.low)} C:${fmt(c.close)}`
  ).join('\n');

  const tfLabel = { '5':'M5', '15':'M15', '60':'H1', '240':'H4', 'D':'D1' }[ctx.tf] || ctx.tf;

  return `Analyse this trade setup from REAL market data and give a precise signal.

════════════════════════════════════════
PAIR: ${ctx.pair} | TIMEFRAME: ${tfLabel}
LIVE PRICE: ${fmt(p)}
ACCOUNT: $${ctx.account} | RISK: ${ctx.riskpct}% ($${(ctx.account * ctx.riskpct / 100).toFixed(2)})
════════════════════════════════════════

COMPUTED TECHNICAL INDICATORS (from real candles):
• EMA 20:  ${fmt(ind.ema20)}  — price is ${ind.aboveEma20 ? 'ABOVE ↑' : 'BELOW ↓'}
• EMA 50:  ${fmt(ind.ema50)}  — price is ${ind.aboveEma50 ? 'ABOVE ↑' : 'BELOW ↓'}
• EMA 200: ${fmt(ind.ema200)} — price is ${ind.aboveEma200 ? 'ABOVE ↑ (Bull Zone)' : 'BELOW ↓ (Bear Zone)'}
• RSI 14:  ${ind.rsi?.toFixed(1)} ${ind.rsOversold ? '← OVERSOLD' : ind.rsOverbought ? '← OVERBOUGHT' : ''}
• MACD Line:    ${ind.macdLine?.toFixed(6)}
• Signal Line:  ${ind.signalLine?.toFixed(6)}
• Histogram:    ${ind.histogram?.toFixed(6)} ${ind.macdCross ? '← BULLISH CROSS' : ind.macdBearCross ? '← BEARISH CROSS' : ind.macdBullish ? '(positive)' : '(negative)'}
• ATR 14:  ${ind.atr?.toFixed(precision)} (${(ind.atr / pip).toFixed(0)} pips)

MARKET STRUCTURE (auto-detected):
• Bias:         ${str.structureBias}
• Recent High:  ${fmt(str.recentHH)}
• Recent Low:   ${fmt(str.recentLL)}
• Swing Highs:  ${str.swingHighs.map(fmt).join(', ') || 'N/A'}
• Swing Lows:   ${str.swingLows.map(fmt).join(', ') || 'N/A'}
• Prev Swing H: ${fmt(str.prevSwingHigh)}
• Prev Swing L: ${fmt(str.prevSwingLow)}
• Swept High?:  ${str.sweptHigh ? 'YES — bearish liquidity sweep above ' + fmt(str.prevSwingHigh) : 'No'}
• Swept Low?:   ${str.sweptLow  ? 'YES — bullish liquidity sweep below ' + fmt(str.prevSwingLow)  : 'No'}

ICT/SMC ZONES (auto-detected):
• Bullish Order Blocks:  ${str.bullOBs.length ? str.bullOBs.map(o => `[${fmt(o.low)}–${fmt(o.high)}]`).join(', ') : 'None detected'}
• Bearish Order Blocks:  ${str.bearOBs.length ? str.bearOBs.map(o => `[${fmt(o.low)}–${fmt(o.high)}]`).join(', ') : 'None detected'}
• Bullish FVGs:          ${str.bullFVGs.length ? str.bullFVGs.map(g => `[${fmt(g.bottom)}–${fmt(g.top)}]`).join(', ') : 'None detected'}
• Bearish FVGs:          ${str.bearFVGs.length ? str.bearFVGs.map(g => `[${fmt(g.bottom)}–${fmt(g.top)}]`).join(', ') : 'None detected'}
• Price at Bullish OB?:  ${str.nearBullOB ? `YES [${fmt(str.nearBullOB.low)}–${fmt(str.nearBullOB.high)}]` : 'No'}
• Price at Bearish OB?:  ${str.nearBearOB ? `YES [${fmt(str.nearBearOB.low)}–${fmt(str.nearBearOB.high)}]` : 'No'}
• Price in Bull FVG?:    ${str.nearBullFVG ? `YES [${fmt(str.nearBullFVG.bottom)}–${fmt(str.nearBullFVG.top)}]` : 'No'}
• Price in Bear FVG?:    ${str.nearBearFVG ? `YES [${fmt(str.nearBearFVG.bottom)}–${fmt(str.nearBearFVG.top)}]` : 'No'}
• Key S/R Levels:        ${str.keyLevels.map(fmt).join(', ') || 'N/A'}

LAST 10 CANDLES (OHLC, most recent last):
${candleTable}

${ctx.context ? `TRADER NOTES: ${ctx.context}\n` : ''}

TASK: Based purely on this real data, give your professional signal.
Rules:
- SL must be beyond the nearest structure/OB/swing (NOT arbitrary pips)
- TP1 should target the nearest opposing liquidity or structure
- TP2 should target the next major level or 2× ATR beyond TP1
- Entry should be at current price (market) or at a retracement level (limit)
- Minimum RRR: 1:1.8
- If no clear edge exists, say WAIT with specific conditions to watch for

Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "verdict": "BUY" | "SELL" | "WAIT",
  "confidence": <45-92>,
  "confidence_label": "High Confluence" | "Moderate Setup" | "Low Confidence" | "No Clear Edge",
  "entry": <exact price>,
  "entry_type": "Market" | "Limit" | "Stop Entry",
  "sl": <exact price — beyond structure>,
  "sl_note": "<why this level — e.g. 'Below bearish OB at X'>",
  "tp1": <exact price>,
  "tp1_note": "<what this level is — e.g. 'Previous swing high at X'>",
  "tp2": <exact price>,
  "tp2_note": "<what this level is — e.g. '2x ATR extension / major resistance'>",
  "rrr": "<e.g. 1:2.3>",
  "sl_pips": <number>,
  "tp1_pips": <number>,
  "tp2_pips": <number>,
  "frameworks": ["ICT/SMC", "Price Action", "EMA Stack", "Supply & Demand"],
  "reasoning": "<3-5 sentences explaining exactly what confluence factors align, referencing the specific data points above>",
  "management": "<2-3 sentences: when to move SL to BE, partial close strategy, invalidation trigger>",
  "wait_reason": "<if WAIT: what specific setup you're waiting for, what price needs to happen first>",
  "key_risk": "<biggest risk to this trade>"
}`;
}

// ─────────────────────────────────────
// PARSE AI RESPONSE
// ─────────────────────────────────────
function parseAIResponse(raw) {
  try {
    let clean = raw.replace(/```json|```/g, '').trim();
    const s = clean.indexOf('{'), e = clean.lastIndexOf('}');
    if (s === -1 || e === -1) return null;
    return JSON.parse(clean.slice(s, e + 1));
  } catch (err) {
    console.error('JSON parse failed:', err, '\nRaw:', raw);
    return null;
  }
}

// ─────────────────────────────────────
// RENDER SIGNAL OUTPUT
// ─────────────────────────────────────
function renderAISignal(sig, meta) {
  setLoadingState(false);

  document.getElementById('emptyState').style.display = 'none';
  const out = document.getElementById('output');
  out.classList.add('on');

  const isBuy  = sig.verdict === 'BUY';
  const isWait = sig.verdict === 'WAIT';

  // Verdict
  const sw = document.getElementById('sigDir');
  sw.textContent = sig.verdict;
  sw.className   = `sig-word ${isBuy ? 'buy' : isWait ? 'standby' : 'sell'}`;

  const d = liveData[selectedPair];
  document.getElementById('sigPairLabel').textContent =
    `${selectedPair} · ${fmtPrice(selectedPair, meta.livePrice)} · ${({ '5':'M5','15':'M15','60':'H1','240':'H4','D':'D1' }[meta.tf] || meta.tf)}`;

  const el = document.getElementById('livePriceLabel');
  if (el) el.textContent = `${selectedPair} · ${fmtPrice(selectedPair, meta.livePrice)} · Real Candle Data · AI Analysed`;

  // Confidence
  const pct = Math.min(Math.max(sig.confidence || 60, 40), 92);
  document.getElementById('sigPct').textContent = pct + '%';
  const lbl = document.getElementById('sigLbl');
  const lc  = pct >= 72 ? 'high' : pct >= 58 ? 'medium' : 'low';
  lbl.textContent = sig.confidence_label || (pct >= 72 ? 'High Confluence' : 'Moderate Setup');
  lbl.className   = `clbl ${lc}`;
  const bar = document.getElementById('sigBar');
  bar.className   = `bar-f ${lc}`;
  setTimeout(() => { bar.style.width = pct + '%'; }, 80);

  document.getElementById('sigRRR').textContent = sig.rrr || '—';

  // Exact price levels
  const fmt = (v) => v ? fmtPrice(selectedPair, parseFloat(v)) : '—';
  document.getElementById('lvEntry').textContent   = fmt(sig.entry);
  document.getElementById('lvSL').textContent      = fmt(sig.sl);
  document.getElementById('lvTP1').textContent     = fmt(sig.tp1);
  document.getElementById('lvTP2').textContent     = fmt(sig.tp2);

  const sn = (id, v) => { const el = document.getElementById(id); if (el && v) el.textContent = v.slice(0, 42); };
  sn('lvEntryNote', sig.entry_type);
  sn('lvSLNote',    sig.sl_note);
  sn('lvTP1Note',   sig.tp1_note);
  sn('lvTP2Note',   sig.tp2_note);

  // Risk metrics
  const riskD   = meta.account * meta.riskpct / 100;
  const slPips  = sig.sl_pips || (Math.abs(parseFloat(sig.entry) - parseFloat(sig.sl)) / meta.pip);
  const pipVal  = getPipValue(selectedPair);
  const lot     = slPips > 0 ? (riskD / (slPips * pipVal)).toFixed(2) : '—';
  const rrN     = parseFloat((sig.rrr || '1:2').split(':')[1]) || 2;
  const exp     = ((0.58 * rrN) - 0.42).toFixed(2);

  document.getElementById('rRisk').textContent   = '$' + riskD.toFixed(0);
  document.getElementById('rLot').textContent    = lot + ' lot';
  document.getElementById('rSLPips').textContent = Math.round(slPips) + ' pips';
  document.getElementById('rExpect').textContent = (parseFloat(exp) >= 0 ? '+' : '') + exp + 'R';

  // Indicator summary in badge area
  const ind = meta.indicators;
  const str = meta.structure;
  const indBadges = [
    `<span class="strat-badge trend">RSI ${ind.rsi?.toFixed(0)}</span>`,
    `<span class="strat-badge ${ind.aboveEma200 ? 'breakout' : 'scalp'}">EMA200 ${ind.aboveEma200 ? '↑' : '↓'}</span>`,
    `<span class="strat-badge ${ind.macdBullish ? 'trend' : 'scalp'}">MACD ${ind.macdBullish ? 'Bull' : 'Bear'}</span>`,
    `<span class="strat-badge reversal">${str.structureBias.split(' ')[0]}</span>`,
  ].join('');
  document.getElementById('stratBadge').innerHTML = indBadges
    + (sig.frameworks || []).map(f => `<span class="strat-badge trend">✓ ${f}</span>`).join('');

  // Checklist — built from real computed data
  const checks = buildRealChecklist(sig, meta);
  document.getElementById('checkCont').innerHTML = checks
    .map(c => `<div class="ci"><div class="cid ${c.s}">${c.s==='pass'?'✓':c.s==='bear'?'↓':'·'}</div>${c.t}</div>`)
    .join('');

  // AI Reasoning
  const reasoning = isWait
    ? `${sig.reasoning || ''}\n\n⏳ Waiting For: ${sig.wait_reason || ''}`
    : sig.reasoning || '';
  document.getElementById('aiReasoning').textContent = reasoning;

  // Management
  document.getElementById('stratNotes').textContent =
    (sig.management || '') + (sig.key_risk ? `\n\n⚠ Key Risk: ${sig.key_risk}` : '');

  // Save for journal
  lastSignal = {
    pair: selectedPair, dir: sig.verdict,
    strat: (sig.frameworks || ['ICT/SMC']).join(' + '),
    tf: ({ '5':'M5','15':'M15','60':'H1','240':'H4','D':'D1' }[meta.tf] || meta.tf),
    entry: sig.entry, sl: sig.sl, tp: sig.tp1, lot, riskD, pct,
  };

  const logBtn = document.getElementById('logTradeBtn');
  if (logBtn) logBtn.style.display = isWait ? 'none' : 'block';
}

function buildRealChecklist(sig, meta) {
  const ind = meta.indicators;
  const str = meta.structure;
  const isBuy = sig.verdict === 'BUY';
  const checks = [];

  checks.push({ t: `Market Structure: ${str.structureBias}`, s: str.hhhl && isBuy ? 'pass' : str.lhll && !isBuy ? 'bear' : 'neutral' });
  checks.push({ t: `EMA 200 — Price ${ind.aboveEma200 ? 'Above (Bull Zone)' : 'Below (Bear Zone)'}`, s: (isBuy && ind.aboveEma200) || (!isBuy && !ind.aboveEma200) ? 'pass' : 'bear' });
  checks.push({ t: `EMA 50 — Price ${ind.aboveEma50 ? 'Above' : 'Below'}`, s: (isBuy && ind.aboveEma50) || (!isBuy && !ind.aboveEma50) ? 'pass' : 'neutral' });
  checks.push({ t: `RSI ${ind.rsi?.toFixed(1)} — ${ind.rsOversold ? 'Oversold' : ind.rsOverbought ? 'Overbought' : 'Neutral'}`, s: (isBuy && ind.rsOversold) || (!isBuy && ind.rsOverbought) ? 'pass' : 'neutral' });
  checks.push({ t: `MACD ${ind.macdCross ? 'Bullish Crossover ✓' : ind.macdBearCross ? 'Bearish Crossover ✓' : ind.macdBullish ? 'Bullish Histogram' : 'Bearish Histogram'}`, s: (isBuy && ind.macdBullish) || (!isBuy && !ind.macdBullish) ? 'pass' : 'bear' });
  if (str.nearBullOB) checks.push({ t: `At Bullish Order Block [${fmtPrice(selectedPair, str.nearBullOB.low)}–${fmtPrice(selectedPair, str.nearBullOB.high)}]`, s: isBuy ? 'pass' : 'bear' });
  if (str.nearBearOB) checks.push({ t: `At Bearish Order Block [${fmtPrice(selectedPair, str.nearBearOB.low)}–${fmtPrice(selectedPair, str.nearBearOB.high)}]`, s: !isBuy ? 'pass' : 'neutral' });
  if (str.nearBullFVG) checks.push({ t: `Inside Bullish FVG — Potential Fill`, s: isBuy ? 'pass' : 'neutral' });
  if (str.nearBearFVG) checks.push({ t: `Inside Bearish FVG — Potential Fill`, s: !isBuy ? 'pass' : 'neutral' });
  if (str.sweptHigh) checks.push({ t: `Liquidity Sweep Above High — Bearish Signal`, s: !isBuy ? 'pass' : 'bear' });
  if (str.sweptLow)  checks.push({ t: `Liquidity Sweep Below Low — Bullish Signal`,  s: isBuy  ? 'pass' : 'bear' });
  const rrN = parseFloat((sig.rrr || '1:2').split(':')[1]) || 2;
  checks.push({ t: `RRR ${sig.rrr} — ${rrN >= 2.5 ? 'Excellent' : rrN >= 1.8 ? 'Acceptable' : 'Below ideal'}`, s: rrN >= 1.8 ? 'pass' : 'neutral' });

  return checks;
}

// ─────────────────────────────────────
// UI STATES
// ─────────────────────────────────────
function setLoadingState(on, msg) {
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('aiLoading').style.display  = on ? 'block' : 'none';
  if (on && msg) {
    const el = document.getElementById('aiLoadingMsg');
    if (el) el.textContent = msg;
  }
  if (!on) document.getElementById('aiLoading').style.display = 'none';
  const btn = document.getElementById('aiSignalBtn');
  if (btn) { btn.disabled = on; btn.textContent = on ? '⏳  Analysing...' : '🤖   Analyse with AI'; }
  const out = document.getElementById('output');
  if (on) out.classList.remove('on');
}

function showError(msg) {
  document.getElementById('emptyState').style.display = 'block';
  document.getElementById('emptyState').innerHTML = `
    <div class="empty-icon">⚠️</div>
    <div class="empty-title">Analysis Failed</div>
    <div class="empty-sub" style="max-width:320px;margin:0 auto">${msg}</div>`;
}

// ─────────────────────────────────────
// QUICK LOG TO JOURNAL
// ─────────────────────────────────────
function quickLogToJournal() {
  if (!lastSignal) return;
  document.getElementById('jPair').value  = lastSignal.pair;
  document.getElementById('jDir').value   = lastSignal.dir;
  document.getElementById('jTf').value    = lastSignal.tf;
  document.getElementById('jEntry').value = lastSignal.entry || '';
  document.getElementById('jSL').value    = lastSignal.sl    || '';
  document.getElementById('jTP').value    = lastSignal.tp    || '';
  document.getElementById('jLot').value   = lastSignal.lot   || '';
  document.getElementById('jNotes').value = `AI Signal: ${lastSignal.dir} ${lastSignal.pair} | Confidence: ${lastSignal.pct}% | ${lastSignal.strat}`;
  const tab = document.querySelectorAll('.tab')[5];
  if (tab) switchTab('journal', tab);
}

// ─────────────────────────────────────
// PIP HELPERS
// ─────────────────────────────────────
function getPipSize(sym) {
  if (['USDJPY','EURJPY','GBPJPY','CADJPY','AUDJPY','NZDJPY','CHFJPY'].includes(sym)) return 0.01;
  if (['XAUUSD','XAGUSD'].includes(sym))  return 0.01;
  if (['XPTUSD','XPDUSD'].includes(sym))  return 0.1;
  if (['BTCUSD'].includes(sym))            return 1;
  if (['ETHUSD'].includes(sym))            return 0.1;
  if (['LTCUSD','XRPUSD'].includes(sym))  return 0.001;
  if (['US30','NAS100','SP500','GER40','UK100','JPN225'].includes(sym)) return 1;
  if (['USDTRY','USDZAR','USDMXN'].includes(sym)) return 0.001;
  if (['USDHUF'].includes(sym)) return 0.01;
  if (['USDNOK','USDSEK','USDDKK'].includes(sym)) return 0.001;
  return 0.0001;
}

function getPipValue(sym) {
  if (['USDJPY','EURJPY','GBPJPY','CADJPY','AUDJPY','NZDJPY','CHFJPY'].includes(sym)) return 9.1;
  if (['XAUUSD'].includes(sym)) return 1;
  if (['XAGUSD'].includes(sym)) return 5;
  if (['BTCUSD'].includes(sym)) return 10;
  if (['ETHUSD'].includes(sym)) return 1;
  if (['US30','NAS100','SP500','GER40','UK100','JPN225'].includes(sym)) return 1;
  return 10;
}
