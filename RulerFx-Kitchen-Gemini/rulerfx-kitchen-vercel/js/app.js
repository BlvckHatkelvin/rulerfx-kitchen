/* ════════════════════════════════════════
   RulerFx Kitchen — app.js
   Main init, tabs, market UI, clocks
═══════════════════════════════════════ */

// ── BOOT ──────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initPrices();      // api.js
  initJournal();     // journal.js
  initKeys();        // signal.js — restore saved API keys
  renderPairList();  // signal.js
  renderTicker();
  renderAllPairsTable();
  renderMarketCards();
  renderSentiment();
  renderCalendar();
  renderStrategies();
  renderEducation();
  renderSessions();
  updateClocks();

  setInterval(updateClocks, 1000);
  setInterval(() => {
    renderTicker();
    renderAllPairsTable();
    renderMarketCards();
  }, 5000);

  // Restore API key notice
  if (localStorage.getItem('rfx_api_key')) dismissNotice();
});

// ── TABS ──────────────────────────────
function switchTab(id, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('panel-' + id).classList.add('active');

  if (id === 'chart') {
    // Always reinit — panel was display:none so width was 0 before
    chartReady = false;
    initChart();
  }
  if (id === 'market')  { renderMarketCards(); renderSentiment(); }
  if (id === 'pairs')   renderAllPairsTable();
  if (id === 'journal') renderJournal();
}

// ── CLOCKS ────────────────────────────
function updateClocks() {
  const zones = [
    ['londonT','Europe/London'],
    ['nyT','America/New_York'],
    ['tokyoT','Asia/Tokyo'],
    ['sydneyT','Australia/Sydney'],
  ];
  const now = new Date();
  zones.forEach(([id, tz]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = now.toLocaleTimeString('en-GB', { timeZone:tz, hour:'2-digit', minute:'2-digit', second:'2-digit' });
  });
  updateSessionIndicator(now);
}

function updateSessionIndicator(now) {
  const h   = now.getUTCHours();
  const el  = document.getElementById('sessionIndicator');
  if (!el) return;
  let sess, color;
  if      (h >= 0  && h < 7)  { sess='🌙 Asian';            color='var(--soft)';   }
  else if (h >= 7  && h < 12) { sess='🟢 London Open';       color='var(--green)';  }
  else if (h >= 12 && h < 17) { sess='🟡 London/NY Overlap'; color='var(--gold)';   }
  else if (h >= 17 && h < 21) { sess='🔵 NY Session';        color='var(--blue3)';  }
  else                         { sess='🌙 Late NY/Closed';    color='var(--soft)';   }
  el.innerHTML = `📡 Session: <span style="color:${color};font-weight:600">${sess}</span>`;
}

// ── TICKER ────────────────────────────
function renderTicker() {
  const inner = document.getElementById('tickerInner');
  if (!inner) return;

  const display = PAIRS.filter(p => ['major','metal','crypto'].includes(p.cat)).slice(0, 16);
  let html = '';
  for (let i = 0; i < 2; i++) {
    display.forEach(p => {
      const d   = liveData[p.sym] || { price: p.base, change: 0, dir: 'up' };
      const chg = parseFloat(d.change) || 0;
      html += `
        <div class="ticker-item">
          <span class="tick-pair">${p.sym}</span>
          <span class="tick-price ${d.dir==='up'?'tick-up':'tick-dn'}">${fmtPrice(p.sym, d.price)}</span>
          <span class="tick-chg ${chg>=0?'up':'dn'}">${chg>=0?'+':''}${chg.toFixed(2)}%</span>
        </div>`;
    });
  }
  inner.innerHTML = html;
}

// ── MARKET CARDS ──────────────────────
function renderMarketCards() {
  const cats = [
    {label:'EUR/USD', sym:'EURUSD', ico:'💶'},
    {label:'XAU/USD', sym:'XAUUSD', ico:'🥇'},
    {label:'BTC/USD', sym:'BTCUSD', ico:'₿'},
    {label:'GBP/USD', sym:'GBPUSD', ico:'💷'},
    {label:'USD/JPY', sym:'USDJPY', ico:'💴'},
    {label:'NAS100',  sym:'NAS100', ico:'📈'},
    {label:'Silver',  sym:'XAGUSD', ico:'🥈'},
    {label:'US30',    sym:'US30',   ico:'🏛'},
  ];
  const el = document.getElementById('mktCards');
  if (!el) return;
  el.innerHTML = cats.map(c => {
    const d   = liveData[c.sym] || { price: 0, change: 0, dir: 'up' };
    const chg = parseFloat(d.change) || 0;
    return `
      <div class="mc g1">
        <div style="font-size:22px;margin-bottom:6px">${c.ico}</div>
        <div class="mn">${c.label}</div>
        <div class="mp">${fmtPrice(c.sym, d.price)}</div>
        <span class="mc2 ${chg>=0?'up':'dn'}">${chg>=0?'+':''}${chg.toFixed(2)}%</span>
      </div>`;
  }).join('');
}

// ── SENTIMENT ─────────────────────────
function renderSentiment() {
  const el = document.getElementById('sentimentGrid');
  if (!el) return;
  const items = [
    { label:'Majors',  bias:'Bullish', color:'var(--green)' },
    { label:'Crosses', bias:'Ranging', color:'var(--gold)'  },
    { label:'Exotics', bias:'Bearish', color:'var(--red)'   },
  ];
  el.innerHTML = items.map(s => `
    <div class="g3" style="padding:16px;text-align:center">
      <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--soft);margin-bottom:6px">${s.label}</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:700;color:${s.color}">${s.bias}</div>
    </div>`).join('');
}

// ── CALENDAR ──────────────────────────
function renderCalendar() {
  const el = document.getElementById('calendarItems');
  if (!el) return;
  el.innerHTML = CALENDAR_EVENTS.map(e => `
    <div class="cal-row">
      <span class="cal-time">${e.time}</span>
      <span class="cal-cur">${e.cur}</span>
      <span class="cal-event">${e.event}</span>
      <span class="imp-badge imp-${e.impact.slice(0,3)}">${e.impact}</span>
    </div>`).join('');
}

// ── ALL PAIRS TABLE ───────────────────
function renderAllPairsTable() {
  const tbody = document.getElementById('allPairsTbody');
  if (!tbody) return;
  const catLabels = { major:'Major', minor:'Minor', exotic:'Exotic', metal:'Metal', crypto:'Crypto', index:'Index' };

  tbody.innerHTML = PAIRS.map(p => {
    const d   = liveData[p.sym] || { price: p.base, change: 0, dir: 'up' };
    const chg = parseFloat(d.change) || 0;
    const bias= chg > 0.2 ? 'buy' : chg < -0.2 ? 'sell' : 'neutral';
    const bl  = bias==='buy'?'BUY':bias==='sell'?'SELL':'NEUTRAL';
    const src = d.source === 'live' ? '<span style="font-size:9px;color:var(--green);font-weight:700"> ●</span>' : '';
    return `
      <tr>
        <td class="pair-cell">${p.sym}${src}</td>
        <td>${catLabels[p.cat]}</td>
        <td style="font-family:'JetBrains Mono',monospace">${fmtPrice(p.sym, d.price)}</td>
        <td class="${chg>=0?'up':'dn'}">${chg>=0?'+':''}${chg.toFixed(2)}%</td>
        <td style="font-family:'JetBrains Mono',monospace">${p.spread}</td>
        <td>${p.vol}</td>
        <td><span class="sig-pill ${bias}">${bl}</span></td>
        <td style="font-size:11px">${p.strat}</td>
      </tr>`;
  }).join('');
}

// ── STRATEGIES ────────────────────────
function renderStrategies() {
  const grid = document.getElementById('stratGrid');
  if (!grid) return;
  grid.innerHTML = STRATEGIES.map(s => `
    <div class="sc g1">
      <div class="si">${s.ico}</div>
      <div class="st" style="color:${s.color}">Strategy ${s.num}</div>
      <div class="sn">${s.name}</div>
      <div class="sd">${s.desc}</div>
      <div class="sr">
        ${s.tags.map(t=>`<span class="stag">${t}</span>`).join('')}
        <span class="stag g">Win: ${s.wr}</span>
        <span class="stag gold">RRR: ${s.rrr}</span>
      </div>
    </div>`).join('');

  const tbody = document.getElementById('stratTableBody');
  if (!tbody) return;
  tbody.innerHTML = STRATEGIES.map(s => `
    <tr>
      <td>${s.name}</td>
      <td>${s.tf}</td>
      <td style="font-size:12px">${s.pairs}</td>
      <td class="up">${s.wr}</td>
      <td class="up">${s.rrr}</td>
      <td>${s.diff}</td>
      <td>${s.sess}</td>
    </tr>`).join('');
}

// ── EDUCATION ─────────────────────────
function renderEducation() {
  const grid = document.getElementById('eduGrid');
  if (!grid) return;
  grid.innerHTML = EDU_SECTIONS.map(sec => `
    <div class="ec g1">
      <h3>${sec.title}</h3>
      ${sec.rows.map(r=>`
        <div class="erow">
          <span class="en">${r.n}</span>
          <span class="ev ${r.cls}">${r.v}</span>
        </div>`).join('')}
    </div>`).join('');
}

// ── SESSIONS ──────────────────────────
function renderSessions() {
  const el = document.getElementById('sessRow');
  if (!el) return;
  const sessions = [
    { name:'Asian',           time:'00:00–09:00 GMT', cls:'avoid', badge:'Low Volume'     },
    { name:'London Open',     time:'08:00–12:00 GMT', cls:'best',  badge:'High Quality'   },
    { name:'London/NY Overlap',time:'13:00–17:00 GMT',cls:'best',  badge:'Best Liquidity' },
    { name:'NY Afternoon',    time:'17:00–21:00 GMT', cls:'good',  badge:'Moderate'       },
  ];
  el.innerHTML = sessions.map(s => `
    <div class="sesscard g1 ${s.cls}">
      <div class="sn2">${s.name}</div>
      <div class="st2">${s.time}</div>
      <span class="sb2">${s.badge}</span>
    </div>`).join('');
}
