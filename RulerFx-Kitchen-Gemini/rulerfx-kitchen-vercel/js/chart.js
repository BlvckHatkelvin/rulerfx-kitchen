/* ════════════════════════════════════════
   RulerFx Kitchen — chart.js
   TradingView Lightweight Charts v4
   
   FIX: Panel is display:none on load,
   so clientWidth = 0. We defer init
   until the panel is actually visible,
   then use offsetParent width + force
   a resize after a short delay.
═══════════════════════════════════════ */

let tvChart         = null;
let candleSeries    = null;
let ema20Series     = null;
let volSeries       = null;
let chartOHLC       = [];
let chartSym        = 'XAUUSD';
let liveUpdateTimer = null;
let chartReady      = false;

// ── INIT CHART (called when tab becomes visible) ──
function initChart() {
  const container = document.getElementById('chartContainer');
  if (!container) return;

  // Destroy previous instance if any
  if (tvChart) {
    try { tvChart.remove(); } catch(e) {}
    tvChart = null; candleSeries = null; ema20Series = null; volSeries = null;
  }
  container.innerHTML = '';
  if (liveUpdateTimer) clearInterval(liveUpdateTimer);

  // Check library loaded
  if (typeof LightweightCharts === 'undefined') {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#8492A6;font-size:13px">Loading chart library...</div>';
    setTimeout(initChart, 800);
    return;
  }

  // The panel was just made visible — we need a small delay for
  // the browser to calculate real dimensions before we read width.
  setTimeout(() => {
    _buildChart(container);
  }, 80);
}

function _buildChart(container) {
  // Get real width — fall back to window width if still 0
  const w = container.offsetWidth || container.parentElement?.offsetWidth || window.innerWidth - 80;
  const h = 460;

  try {
    tvChart = LightweightCharts.createChart(container, {
      width:  w,
      height: h,
      layout: {
        background: { type: 'solid', color: 'rgba(246,242,234,0)' },
        textColor:  '#3D4A5C',
        fontSize:   12,
        fontFamily: "'DM Sans', sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(160,196,232,.18)', style: 1 },
        horzLines: { color: 'rgba(160,196,232,.18)', style: 1 },
      },
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
        vertLine: { color: 'rgba(91,155,213,.6)', labelBackgroundColor: '#5B9BD5' },
        horzLine: { color: 'rgba(91,155,213,.6)', labelBackgroundColor: '#5B9BD5' },
      },
      rightPriceScale: {
        borderColor: 'rgba(160,196,232,.3)',
        scaleMargins: { top: 0.08, bottom: 0.22 },
      },
      timeScale: {
        borderColor: 'rgba(160,196,232,.3)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale:  { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });
  } catch(e) {
    container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#D03030;font-size:13px">Chart error: ${e.message}</div>`;
    return;
  }

  // ── Candlestick series ──
  candleSeries = tvChart.addCandlestickSeries({
    upColor:          '#1E9E6A',
    downColor:        '#D03030',
    borderUpColor:    '#1E9E6A',
    borderDownColor:  '#D03030',
    wickUpColor:      '#1E9E6A',
    wickDownColor:    '#D03030',
  });

  // ── EMA20 overlay ──
  ema20Series = tvChart.addLineSeries({
    color:            '#C08A20',
    lineWidth:        2,
    title:            'EMA20',
    priceLineVisible: false,
    lastValueVisible: true,
  });

  // ── Volume histogram ──
  volSeries = tvChart.addHistogramSeries({
    color:        'rgba(91,155,213,.22)',
    priceFormat:  { type: 'volume' },
    priceScaleId: 'vol',
  });
  tvChart.priceScale('vol').applyOptions({
    scaleMargins: { top: 0.84, bottom: 0 },
  });

  // ── Crosshair tooltip ──
  tvChart.subscribeCrosshairMove(param => {
    if (!param || !param.time || !candleSeries) return;
    const candle = param.seriesData.get(candleSeries);
    if (candle) updateChartIndicators(candle);
  });

  // ── ResizeObserver for responsive width ──
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(entries => {
      if (!tvChart) return;
      for (const entry of entries) {
        const newW = Math.floor(entry.contentRect.width);
        if (newW > 0) tvChart.applyOptions({ width: newW });
      }
    });
    ro.observe(container);
  }

  chartReady = true;
  loadChartData(chartSym);
}

// ── LOAD DATA ─────────────────────────
function loadChartData(sym) {
  if (!tvChart || !candleSeries) return;
  chartSym  = sym;
  chartOHLC = generateOHLC(sym, 200);

  try {
    candleSeries.setData(chartOHLC);
    ema20Series.setData(calcEMA(chartOHLC, 20));
    volSeries.setData(chartOHLC.map(b => ({
      time:  b.time,
      value: b.volume,
      color: b.close >= b.open
        ? 'rgba(30,158,106,.28)'
        : 'rgba(208,48,48,.22)',
    })));

    tvChart.timeScale().fitContent();

    const last = chartOHLC[chartOHLC.length - 1];
    updateChartIndicators(last);
    updateChartHeader(sym, last);
  } catch(e) {
    console.warn('Chart load error:', e);
  }

  // Live ticking
  clearInterval(liveUpdateTimer);
  liveUpdateTimer = setInterval(tickChartCandle, 3000);
}

// ── LIVE CANDLE TICK ──────────────────
function tickChartCandle() {
  if (!tvChart || !candleSeries || !chartOHLC.length) return;

  const last  = chartOHLC[chartOHLC.length - 1];
  const p     = PAIRS.find(x => x.sym === chartSym) || { cat:'major' };
  const volSc = { major:.0001, minor:.00015, exotic:.0002, metal:.0003, crypto:.0008, index:.0002 }[p.cat] || .0002;
  const move  = last.close * (Math.random() - 0.499) * volSc;
  const close = Math.max(0.00001, +(last.close + move).toFixed(6));
  const high  = Math.max(last.high, close);
  const low   = Math.min(last.low,  close);

  const updated = { ...last, close, high, low };
  chartOHLC[chartOHLC.length - 1] = updated;

  try {
    candleSeries.update(updated);
    volSeries.update({ time: updated.time, value: updated.volume,
      color: close >= last.open ? 'rgba(30,158,106,.28)' : 'rgba(208,48,48,.22)' });
  } catch(e) {}

  updateChartHeader(chartSym, updated);
  updateChartIndicators(updated);
}

// ── EMA CALCULATION ───────────────────
function calcEMA(data, period) {
  if (!data || data.length < period) return [];
  const k   = 2 / (period + 1);
  let ema   = data.slice(0, period).reduce((s, b) => s + b.close, 0) / period;
  const out = [];

  data.forEach((bar, i) => {
    if (i < period - 1) return;
    if (i === period - 1) { ema = data.slice(0, period).reduce((s,b) => s+b.close, 0) / period; }
    else                  { ema = bar.close * k + ema * (1 - k); }
    out.push({ time: bar.time, value: +ema.toFixed(6) });
  });
  return out;
}

// ── UI HEADER ─────────────────────────
function updateChartHeader(sym, bar) {
  if (!bar) return;
  const prev   = chartOHLC.length > 1 ? chartOHLC[chartOHLC.length - 2].close : bar.open;
  const chgPct = ((bar.close - prev) / prev * 100).toFixed(2);
  const isUp   = bar.close >= prev;

  const priceEl = document.getElementById('chartCurrentPrice');
  const chgEl   = document.getElementById('chartPriceChange');
  const titleEl = document.getElementById('chartTitle');
  const subEl   = document.getElementById('chartSubtitle');

  if (priceEl) { priceEl.textContent = fmtPrice(sym, bar.close); priceEl.style.color = isUp ? 'var(--green)' : 'var(--red)'; }
  if (chgEl)   { chgEl.textContent = `${isUp?'+':''}${chgPct}%`; chgEl.style.background = isUp ? 'var(--greenp)' : 'var(--redp)'; chgEl.style.color = isUp ? 'var(--green)' : 'var(--red)'; }
  if (titleEl) titleEl.textContent = `Chart — ${sym}`;
  if (subEl)   subEl.textContent   = `TradingView Lightweight Chart · ${sym} · M15`;
}

function updateChartIndicators(bar) {
  if (!bar) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('indOpen',  fmtPrice(chartSym, bar.open));
  set('indHigh',  fmtPrice(chartSym, bar.high));
  set('indLow',   fmtPrice(chartSym, bar.low));
  set('indClose', fmtPrice(chartSym, bar.close));
  set('indVol',   bar.volume ? bar.volume.toLocaleString() : '—');
  const emaData = calcEMA(chartOHLC, 20);
  if (emaData.length) set('indEma', fmtPrice(chartSym, emaData[emaData.length-1].value));
}

// ── CONTROLS ──────────────────────────
function changeChartPair() {
  const sym = document.getElementById('chartPairSelect')?.value || 'XAUUSD';
  if (chartReady) loadChartData(sym);
}
