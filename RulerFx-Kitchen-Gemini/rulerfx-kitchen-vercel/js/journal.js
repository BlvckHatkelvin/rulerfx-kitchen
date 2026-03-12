/* ════════════════════════════════════════
   RulerFx Kitchen — journal.js
   Trade Journal — localStorage persistence
═══════════════════════════════════════ */

let trades = JSON.parse(localStorage.getItem('rfx_trades') || '[]');

// ── INIT ──────────────────────────────
function initJournal() {
  // Populate pair dropdown
  const sel = document.getElementById('jPair');
  if (sel) {
    PAIRS.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.sym; opt.textContent = p.sym;
      sel.appendChild(opt);
    });
  }
  renderJournal();
}

// ── LOG TRADE ─────────────────────────
function logTrade() {
  const pair   = document.getElementById('jPair').value;
  const dir    = document.getElementById('jDir').value;
  const strat  = document.getElementById('jStrat').value;
  const entry  = parseFloat(document.getElementById('jEntry').value) || 0;
  const lot    = parseFloat(document.getElementById('jLot').value)   || 0;
  const sl     = parseFloat(document.getElementById('jSL').value)    || 0;
  const tp     = parseFloat(document.getElementById('jTP').value)    || 0;
  const exit   = parseFloat(document.getElementById('jExit').value)  || null;
  const result = document.getElementById('jResult').value;
  const pnl    = parseFloat(document.getElementById('jPnl').value)   || 0;
  const tf     = document.getElementById('jTf').value;
  const notes  = document.getElementById('jNotes').value;
  const emo    = document.getElementById('jEmotion').value;

  if (!pair) { alert('Please select a pair.'); return; }

  const trade = {
    id:     Date.now(),
    date:   new Date().toLocaleDateString('en-GB'),
    time:   new Date().toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit'}),
    pair, dir, strat, entry, lot, sl, tp, exit, result, pnl, tf, notes, emo,
  };

  trades.unshift(trade);
  saveTrades();
  renderJournal();
  clearJournalForm();

  // Flash success
  const btn = document.querySelector('#panel-journal .btn');
  if (btn) { const orig=btn.textContent; btn.textContent='✓ Saved!'; btn.style.background='var(--green)'; setTimeout(()=>{btn.textContent=orig;btn.style.background='';},2000); }
}

function saveTrades() {
  localStorage.setItem('rfx_trades', JSON.stringify(trades));
}

function deleteTrade(id) {
  if (!confirm('Delete this trade?')) return;
  trades = trades.filter(t => t.id !== id);
  saveTrades();
  renderJournal();
}

function clearJournalForm() {
  ['jEntry','jLot','jSL','jTP','jExit','jPnl','jNotes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const res = document.getElementById('jResult');
  if (res) res.value = 'open';
}

// ── RENDER JOURNAL ────────────────────
function renderJournal() {
  renderJournalStats();
  renderPerfGrid();
  renderJournalTable();
}

function renderJournalStats() {
  const container = document.getElementById('journalStats');
  if (!container) return;

  const wins   = trades.filter(t => t.result === 'win');
  const losses = trades.filter(t => t.result === 'loss');
  const closed = trades.filter(t => t.result !== 'open');
  const totalPnl = trades.reduce((a, t) => a + (t.pnl || 0), 0);
  const wr     = closed.length ? Math.round(wins.length / closed.length * 100) : 0;
  const avgWin = wins.length  ? wins.reduce((a,t)=>a+(t.pnl||0),0)/wins.length : 0;
  const avgLoss= losses.length? losses.reduce((a,t)=>a+(t.pnl||0),0)/losses.length : 0;

  container.innerHTML = `
    <div class="jstat g1"><div class="jsl">Total Trades</div><div class="jsv">${trades.length}</div></div>
    <div class="jstat g1"><div class="jsl">Win Rate</div><div class="jsv ${wr>=55?'pos':wr<40?'neg':''}">${wr}%</div></div>
    <div class="jstat g1"><div class="jsl">Total P&L</div><div class="jsv ${totalPnl>=0?'pos':'neg'}">${totalPnl>=0?'+':''}$${totalPnl.toFixed(2)}</div></div>
    <div class="jstat g1"><div class="jsl">Avg Win</div><div class="jsv pos">$${avgWin.toFixed(2)}</div></div>
    <div class="jstat g1"><div class="jsl">Avg Loss</div><div class="jsv neg">$${avgLoss.toFixed(2)}</div></div>
  `;
}

function renderPerfGrid() {
  const container = document.getElementById('perfGrid');
  if (!container) return;

  const wins   = trades.filter(t => t.result === 'win');
  const losses = trades.filter(t => t.result === 'loss');
  const closed = trades.filter(t => t.result !== 'open');
  const totalPnl = trades.reduce((a,t)=>a+(t.pnl||0),0);
  const wr     = closed.length ? (wins.length / closed.length * 100).toFixed(1) : '0.0';

  // Best strategy
  const stratPnl = {};
  trades.forEach(t => { stratPnl[t.strat] = (stratPnl[t.strat]||0)+(t.pnl||0); });
  const bestStrat = Object.entries(stratPnl).sort((a,b)=>b[1]-a[1])[0];

  // Best pair
  const pairPnl = {};
  trades.forEach(t => { pairPnl[t.pair] = (pairPnl[t.pair]||0)+(t.pnl||0); });
  const bestPair = Object.entries(pairPnl).sort((a,b)=>b[1]-a[1])[0];

  // Expectancy
  const avgW = wins.length  ? wins.reduce((a,t)=>a+(t.pnl||0),0)/wins.length : 0;
  const avgL = losses.length? Math.abs(losses.reduce((a,t)=>a+(t.pnl||0),0)/losses.length) : 0;
  const wrDec= closed.length? wins.length/closed.length : 0;
  const exp  = closed.length ? ((wrDec*avgW - (1-wrDec)*avgL)).toFixed(2) : '0.00';

  container.innerHTML = `
    <div class="pg-item"><div class="pg-lbl">Win Rate</div><div class="pg-val ${parseFloat(wr)>=55?'g':'r'}">${wr}%</div></div>
    <div class="pg-item"><div class="pg-lbl">Wins / Losses</div><div class="pg-val">${wins.length} / ${losses.length}</div></div>
    <div class="pg-item"><div class="pg-lbl">Expectancy/Trade</div><div class="pg-val ${parseFloat(exp)>=0?'g':'r'}">${parseFloat(exp)>=0?'+':''}$${exp}</div></div>
    <div class="pg-item"><div class="pg-lbl">Best Strategy</div><div class="pg-val gold">${bestStrat?bestStrat[0]:'—'}</div></div>
    <div class="pg-item"><div class="pg-lbl">Best Pair</div><div class="pg-val gold">${bestPair?bestPair[0]:'—'}</div></div>
    <div class="pg-item"><div class="pg-lbl">Total P&L</div><div class="pg-val ${totalPnl>=0?'g':'r'}">${totalPnl>=0?'+':''}$${totalPnl.toFixed(2)}</div></div>
  `;
}

function renderJournalTable() {
  const tbody   = document.getElementById('journalTbody');
  const empty   = document.getElementById('emptyJournal');
  const counter = document.getElementById('tradeCount');

  if (!tbody) return;
  if (counter) counter.textContent = `${trades.length} trade${trades.length!==1?'s':''} recorded`;

  if (!trades.length) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  const resultClass = { win:'win', loss:'loss', be:'be', open:'open' };
  const resultLabel = { win:'Win ✓', loss:'Loss ✗', be:'Breakeven', open:'Open' };
  const emoMap = { calm:'😌', fomo:'😰', revenge:'😤', confident:'💪', uncertain:'😕' };

  tbody.innerHTML = trades.map((t, i) => `
    <tr>
      <td>${trades.length - i}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:11px">${t.date}<br><span style="opacity:.6">${t.time}</span></td>
      <td class="pair-cell">${t.pair}</td>
      <td><span class="sig-pill ${t.dir==='BUY'?'buy':'sell'}">${t.dir}</span></td>
      <td style="font-size:11px">${t.strat}</td>
      <td style="font-family:'JetBrains Mono',monospace">${t.entry||'—'}</td>
      <td style="font-family:'JetBrains Mono',monospace">${t.sl||'—'}</td>
      <td style="font-family:'JetBrains Mono',monospace">${t.tp||'—'}</td>
      <td style="font-family:'JetBrains Mono',monospace">${t.exit||'—'}</td>
      <td class="${(t.pnl||0)>=0?'up':'dn'}" style="font-family:'JetBrains Mono',monospace;font-weight:600">
        ${(t.pnl||0)>=0?'+':''}$${(t.pnl||0).toFixed(2)}
      </td>
      <td><span class="jresult ${resultClass[t.result]}">${resultLabel[t.result]}</span> <span class="emo-badge" title="${t.emo}">${emoMap[t.emo]||''}</span></td>
      <td><button class="del-btn" onclick="deleteTrade(${t.id})">✕</button></td>
    </tr>
  `).join('');
}

// ── EXPORT CSV ────────────────────────
function exportCSV() {
  if (!trades.length) { alert('No trades to export.'); return; }

  const headers = ['#','Date','Time','Pair','Direction','Strategy','TF','Entry','SL','TP','Exit','P&L','Result','Emotion','Notes'];
  const rows = trades.map((t, i) => [
    trades.length - i, t.date, t.time, t.pair, t.dir, t.strat, t.tf,
    t.entry||'', t.sl||'', t.tp||'', t.exit||'',
    t.pnl||0, t.result, t.emo, `"${(t.notes||'').replace(/"/g,'""')}"`
  ]);

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `RulerFx_Journal_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
