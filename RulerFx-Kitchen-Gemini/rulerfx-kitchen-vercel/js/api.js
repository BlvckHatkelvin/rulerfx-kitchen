/* ════════════════════════════════════════
   RulerFx Kitchen — api.js
   Live Price Engine — Multi-Source

   Source 1: ExchangeRate-API Open Access
   → No key, no signup, 161 fiat currencies
   → Covers ALL forex pairs (majors/minors/exotics)
   → Cached locally 6h, re-fetched silently

   Source 2: FCS API (free tier, optional key)
   → Metals (XAU, XAG, XPT, XPD)
   → Crypto (BTC, ETH, LTC, XRP)
   → 500 req/month free, 60min cache
   → Falls back to seeded sim if no key

   Source 3: Realistic simulation
   → Indices (US30, NAS100, SP500, etc.)
   → Metals/crypto when no FCS key
   → All pairs: 3s micro-tick for live feel
═══════════════════════════════════════ */

let liveData     = {};
const FCS_KEY = true; // key is on proxy server — always attempt proxy call
let eraRates     = {};
let tickInterval = null;
let fetchInterval= null;

// ─────────────────────────────────────
// BOOT
// ─────────────────────────────────────
async function initPrices() {
  seedSimulation();
  renderTicker();
  await fetchExchangeRateAPI();
  buildLiveDataFromERA();
  await fetchFCSPrices();
  buildIndices();
  updateAllUI();
  startRealtimeTick();
  startPeriodicRefresh();

  // FCS key handled by proxy server
}

// ─────────────────────────────────────
// SEED — instant placeholder
// ─────────────────────────────────────
function seedSimulation() {
  PAIRS.forEach(p => {
    liveData[p.sym] = {
      price:     p.base,
      open:      p.base,
      high:      p.base * 1.001,
      low:       p.base * 0.999,
      change:    0,
      changePct: 0,
      dir:       'up',
      source:    'loading',
    };
  });
}

// ─────────────────────────────────────
// SOURCE 1 — ExchangeRate-API Open Access
// Endpoint: https://open.er-api.com/v6/latest/USD
// No API key. 161 currencies. Updates daily.
// ─────────────────────────────────────
async function fetchExchangeRateAPI() {
  const CACHE_KEY  = 'rfx_era_rates';
  const CACHE_TS   = 'rfx_era_time';
  const SIX_HOURS  = 6 * 60 * 60 * 1000;

  const cached   = localStorage.getItem(CACHE_KEY);
  const cachedTs = parseInt(localStorage.getItem(CACHE_TS) || '0');

  if (cached && Date.now() - cachedTs < SIX_HOURS) {
    eraRates = JSON.parse(cached);
    setApiStatus('Live Rates · Forex', true);
    return;
  }

  try {
    setApiStatus('Connecting...', false);
    const res  = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();

    if (data.result === 'success' && data.rates) {
      eraRates = data.rates;
      localStorage.setItem(CACHE_KEY, JSON.stringify(eraRates));
      localStorage.setItem(CACHE_TS,  Date.now().toString());
      setApiStatus('Live · All Forex Pairs', true);
    } else {
      throw new Error('bad response');
    }
  } catch {
    const stale = localStorage.getItem(CACHE_KEY);
    if (stale) {
      eraRates = JSON.parse(stale);
      setApiStatus('Cached Rates', false);
    } else {
      setApiStatus('Offline — Simulated', false);
    }
  }
}

// Build liveData for all forex pairs from ERA rates (USD base)
function buildLiveDataFromERA() {
  if (!Object.keys(eraRates).length) return;

  PAIRS.filter(p => ['major','minor','exotic'].includes(p.cat)).forEach(p => {
    const base  = p.sym.slice(0,3);
    const quote = p.sym.slice(3,6);
    let price   = null;

    if (base === 'USD') {
      price = eraRates[quote] ? eraRates[quote] : null;
    } else if (quote === 'USD') {
      price = eraRates[base]  ? 1 / eraRates[base] : null;
    } else {
      // Cross via USD: e.g. EURGBP = (1/EUR_rate) / (1/GBP_rate)
      const bR = eraRates[base];
      const qR = eraRates[quote];
      if (bR && qR) price = qR / bR;
    }

    if (price && price > 0) {
      const prev = liveData[p.sym]?.open || price;
      const chg  = +((price - prev) / prev * 100).toFixed(4);
      liveData[p.sym] = {
        price:     +price.toFixed(6),
        open:      +price.toFixed(6),
        high:      +(price * 1.002).toFixed(6),
        low:       +(price * 0.998).toFixed(6),
        change:    chg,
        changePct: chg,
        dir:       chg >= 0 ? 'up' : 'dn',
        source:    'live',
      };
    }
  });
}

// ─────────────────────────────────────
// SOURCE 2 — FCS API
// Metals + Crypto (free tier)
// Get key free at: https://fcsapi.com/signup
// ─────────────────────────────────────
const FCS_MAP = [
  { sym:'XAUUSD', fcs:'XAU/USD', cat:'metal'  },
  { sym:'XAGUSD', fcs:'XAG/USD', cat:'metal'  },
  { sym:'XPTUSD', fcs:'XPT/USD', cat:'metal'  },
  { sym:'XPDUSD', fcs:'XPD/USD', cat:'metal'  },
  { sym:'BTCUSD', fcs:'BTC/USD', cat:'crypto' },
  { sym:'ETHUSD', fcs:'ETH/USD', cat:'crypto' },
  { sym:'LTCUSD', fcs:'LTC/USD', cat:'crypto' },
  { sym:'XRPUSD', fcs:'XRP/USD', cat:'crypto' },
];

async function fetchFCSPrices() {
  if (!FCS_KEY) {
    seedMetalsCrypto();
    return;
  }

  const symbols = FCS_MAP.map(x => x.fcs).join(',');
  const PROXY = window.RULERFX_PROXY_URL || '';
    const url = `${PROXY}/api/prices?symbols=${encodeURIComponent(symbols)}`;

  try {
    const res  = await fetch(url);
    const data = await res.json();

    if (data.status && Array.isArray(data.response)) {
      data.response.forEach(r => {
        const entry = FCS_MAP.find(x => x.fcs === r.s);
        if (!entry) return;
        const price = parseFloat(r.c);
        const chg   = parseFloat(r.cp) || 0;
        liveData[entry.sym] = {
          price,
          open:      parseFloat(r.o) || price,
          high:      parseFloat(r.h) || price * 1.002,
          low:       parseFloat(r.l) || price * 0.998,
          change:    chg,
          changePct: chg,
          dir:       chg >= 0 ? 'up' : 'dn',
          source:    'live',
        };
      });
    } else {
      seedMetalsCrypto();
    }
  } catch {
    seedMetalsCrypto();
  }
}

// Realistic metal/crypto seeding when no FCS key
function seedMetalsCrypto() {
  const seeds = {
    XAUUSD: { base:2312.45, vol:0.004 },
    XAGUSD: { base:27.42,   vol:0.006 },
    XPTUSD: { base:984.2,   vol:0.005 },
    XPDUSD: { base:1021.4,  vol:0.005 },
    BTCUSD: { base:67420,   vol:0.012 },
    ETHUSD: { base:3482,    vol:0.014 },
    LTCUSD: { base:84.2,    vol:0.015 },
    XRPUSD: { base:0.5821,  vol:0.016 },
  };
  Object.entries(seeds).forEach(([sym, cfg]) => {
    const drift = cfg.base * (Math.random() * cfg.vol * 2 - cfg.vol);
    const price = +(cfg.base + drift);
    const chg   = +(drift / cfg.base * 100).toFixed(2);
    liveData[sym] = {
      price, open:cfg.base,
      high: +(price * 1.003),
      low:  +(price * 0.997),
      change:chg, changePct:chg,
      dir:  chg >= 0 ? 'up' : 'dn',
      source:'sim',
    };
  });
}

// ─────────────────────────────────────
// SOURCE 3 — Indices (anchored simulation)
// ─────────────────────────────────────
function buildIndices() {
  const seeds = {
    US30:   { base:38420, vol:0.003 },
    NAS100: { base:17842, vol:0.004 },
    SP500:  { base:5124,  vol:0.003 },
    GER40:  { base:18320, vol:0.004 },
    UK100:  { base:8124,  vol:0.003 },
    JPN225: { base:38820, vol:0.004 },
  };
  Object.entries(seeds).forEach(([sym, cfg]) => {
    const drift = cfg.base * (Math.random() * cfg.vol * 2 - cfg.vol);
    const price = +(cfg.base + drift).toFixed(2);
    const chg   = +(drift / cfg.base * 100).toFixed(2);
    liveData[sym] = {
      price, open:cfg.base,
      high: +(price * 1.002),
      low:  +(price * 0.998),
      change:chg, changePct:chg,
      dir:  chg >= 0 ? 'up' : 'dn',
      source:'index',
    };
  });
}

// ─────────────────────────────────────
// REALTIME MICRO-TICK
// 3s interval — keeps everything alive visually
// Small drift on top of real anchored prices
// ─────────────────────────────────────
function startRealtimeTick() {
  clearInterval(tickInterval);
  tickInterval = setInterval(() => {
    PAIRS.forEach(p => microTick(p));
    updateAllUI();
  }, 3000);
}

function microTick(p) {
  const d = liveData[p.sym];
  if (!d) return;

  const vol = {
    major:  0.00012, minor:  0.00018, exotic: 0.00025,
    metal:  0.00030, crypto: 0.00060, index:  0.00020,
  }[p.cat] || 0.0002;

  const move  = d.price * (Math.random() - 0.499) * vol;
  const price = Math.max(0.000001, +(d.price + move).toFixed(6));

  d.price     = price;
  d.high      = Math.max(d.high, price);
  d.low       = Math.min(d.low, price);
  d.change    = +((price - d.open) / d.open * 100).toFixed(4);
  d.changePct = d.change;
  d.dir       = price >= d.open ? 'up' : 'dn';
}

// ─────────────────────────────────────
// PERIODIC REFRESH (every 6h)
// ─────────────────────────────────────
function startPeriodicRefresh() {
  clearInterval(fetchInterval);
  fetchInterval = setInterval(async () => {
    localStorage.removeItem('rfx_era_time'); // force fresh fetch
    await fetchExchangeRateAPI();
    buildLiveDataFromERA();
    await fetchFCSPrices();
  }, 6 * 60 * 60 * 1000);
}

// ─────────────────────────────────────
// HELPERS
// ─────────────────────────────────────
function updateAllUI() {
  if (typeof renderTicker      === 'function') renderTicker();
  if (typeof renderMarketCards === 'function') renderMarketCards();
}

function setApiStatus(text, live) {
  const el = document.getElementById('apiStatus');
  if (!el) return;
  el.textContent   = live ? `🟢 ${text}` : `⚡ ${text}`;
  el.style.background  = live ? 'rgba(30,158,106,.15)' : 'rgba(217,119,6,.12)';
  el.style.color       = live ? 'var(--green)'          : 'var(--orange)';
  el.style.borderColor = live ? 'rgba(30,158,106,.25)' : 'rgba(217,119,6,.25)';
}

function setApiKey() {
  const key = document.getElementById('apiKeyInput')?.value?.trim();
  if (!key) return;
  // key managed by proxy
  fetchFCSPrices();
  dismissNotice();
}

function dismissNotice() {
  const n = document.getElementById('apiNotice');
  if (n) n.style.display = 'none';
}

function fmtPrice(sym, price) {
  if (!price && price !== 0) return '—';
  if (price >= 10000) return price.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  if (price >= 1000)  return price.toFixed(2);
  if (price >= 100)   return price.toFixed(2);
  if (price >= 10)    return price.toFixed(3);
  if (price >= 1)     return price.toFixed(4);
  if (price >= 0.1)   return price.toFixed(5);
  return price.toFixed(6);
}

// For chart.js — OHLC generation anchored to real prices
function generateOHLC(sym, bars = 200) {
  const d     = liveData[sym];
  const p     = PAIRS.find(x => x.sym === sym) || { base: 1, cat: 'major' };
  let price   = d?.open || p.base;

  const vol = {
    major:  0.003, minor:  0.004, exotic: 0.006,
    metal:  0.008, crypto: 0.018, index:  0.005,
  }[p.cat] || 0.004;

  const now  = Math.floor(Date.now() / 1000);
  const step = 15 * 60;
  const data = [];

  for (let i = bars; i >= 0; i--) {
    const open  = price;
    const bias  = Math.random() > 0.51 ? 1 : -1;
    const range = open * vol;
    const high  = +(open + Math.random() * range).toFixed(6);
    const low   = +(open - Math.random() * range).toFixed(6);
    const close = +(Math.min(high, Math.max(low, open + bias * Math.random() * range * 0.6))).toFixed(6);
    data.push({ time: now - i * step, open:+open.toFixed(6), high, low, close, volume: Math.floor(Math.random()*8000+1000) });
    price = close;
  }

  // Pin final bar to current live price
  if (d?.price && data.length) {
    const last = data[data.length-1];
    last.close = d.price;
    last.high  = Math.max(last.high, d.price);
    last.low   = Math.min(last.low,  d.price);
  }
  return data;
}
