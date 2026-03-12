/* ════════════════════════════════════════
   RulerFx Kitchen — data.js
   All pairs, strategies, static content
═══════════════════════════════════════ */

const PAIRS = [
  // MAJORS
  { sym:'EURUSD', cat:'major', base:1.0847, spread:0.8,  vol:'Medium',    strat:'Trend Following' },
  { sym:'GBPUSD', cat:'major', base:1.2734, spread:1.0,  vol:'High',      strat:'ICT/SMC'         },
  { sym:'USDJPY', cat:'major', base:149.82, spread:0.8,  vol:'Medium',    strat:'Breakout'        },
  { sym:'USDCHF', cat:'major', base:0.8923, spread:1.0,  vol:'Low',       strat:'S&R Bounce'      },
  { sym:'AUDUSD', cat:'major', base:0.6521, spread:1.2,  vol:'Medium',    strat:'Trend Following' },
  { sym:'USDCAD', cat:'major', base:1.3612, spread:1.2,  vol:'Medium',    strat:'Trend Following' },
  { sym:'NZDUSD', cat:'major', base:0.5988, spread:1.5,  vol:'Medium',    strat:'S&R Bounce'      },
  // MINORS
  { sym:'EURGBP', cat:'minor', base:0.8521, spread:1.2,  vol:'Low',       strat:'Mean Reversion'  },
  { sym:'EURJPY', cat:'minor', base:162.54, spread:1.5,  vol:'High',      strat:'Trend Following' },
  { sym:'GBPJPY', cat:'minor', base:190.82, spread:2.0,  vol:'Very High', strat:'ICT/SMC'         },
  { sym:'AUDJPY', cat:'minor', base:97.63,  spread:1.8,  vol:'High',      strat:'Trend Following' },
  { sym:'CADJPY', cat:'minor', base:109.24, spread:2.0,  vol:'High',      strat:'Breakout'        },
  { sym:'CHFJPY', cat:'minor', base:167.91, spread:2.2,  vol:'High',      strat:'Trend Following' },
  { sym:'NZDJPY', cat:'minor', base:89.71,  spread:2.0,  vol:'High',      strat:'Trend Following' },
  { sym:'EURCHF', cat:'minor', base:0.9682, spread:1.5,  vol:'Low',       strat:'Mean Reversion'  },
  { sym:'EURAUD', cat:'minor', base:1.6628, spread:1.8,  vol:'Medium',    strat:'Trend Following' },
  { sym:'EURCAD', cat:'minor', base:1.4761, spread:1.8,  vol:'Medium',    strat:'S&R Bounce'      },
  { sym:'EURNZD', cat:'minor', base:1.8120, spread:2.5,  vol:'Medium',    strat:'Mean Reversion'  },
  { sym:'GBPAUD', cat:'minor', base:1.9530, spread:2.0,  vol:'High',      strat:'ICT/SMC'         },
  { sym:'GBPCAD', cat:'minor', base:1.7342, spread:2.2,  vol:'High',      strat:'Trend Following' },
  { sym:'GBPCHF', cat:'minor', base:1.1371, spread:2.0,  vol:'High',      strat:'Breakout'        },
  { sym:'GBPNZD', cat:'minor', base:2.1280, spread:2.8,  vol:'High',      strat:'ICT/SMC'         },
  { sym:'AUDCAD', cat:'minor', base:0.8870, spread:1.8,  vol:'Medium',    strat:'Mean Reversion'  },
  { sym:'AUDCHF', cat:'minor', base:0.5821, spread:1.8,  vol:'Medium',    strat:'S&R Bounce'      },
  { sym:'AUDNZD', cat:'minor', base:1.0891, spread:2.0,  vol:'Low',       strat:'Mean Reversion'  },
  { sym:'CADCHF', cat:'minor', base:0.6556, spread:2.0,  vol:'Low',       strat:'S&R Bounce'      },
  { sym:'NZDCAD', cat:'minor', base:0.8143, spread:2.2,  vol:'Medium',    strat:'Mean Reversion'  },
  { sym:'NZDCHF', cat:'minor', base:0.5341, spread:2.2,  vol:'Low',       strat:'Mean Reversion'  },
  // EXOTICS
  { sym:'USDTRY', cat:'exotic', base:32.48,  spread:15,  vol:'Very High', strat:'Trend Following' },
  { sym:'USDZAR', cat:'exotic', base:18.62,  spread:12,  vol:'Very High', strat:'Trend Following' },
  { sym:'USDMXN', cat:'exotic', base:17.12,  spread:8,   vol:'High',      strat:'Trend Following' },
  { sym:'USDSGD', cat:'exotic', base:1.3421, spread:3.5, vol:'Low',       strat:'S&R Bounce'      },
  { sym:'USDHKD', cat:'exotic', base:7.8201, spread:3.0, vol:'Low',       strat:'Mean Reversion'  },
  { sym:'USDNOK', cat:'exotic', base:10.543, spread:6,   vol:'High',      strat:'Trend Following' },
  { sym:'USDSEK', cat:'exotic', base:10.324, spread:6,   vol:'High',      strat:'Trend Following' },
  { sym:'USDDKK', cat:'exotic', base:6.892,  spread:5,   vol:'Low',       strat:'Mean Reversion'  },
  { sym:'USDPLN', cat:'exotic', base:4.021,  spread:5,   vol:'Medium',    strat:'Trend Following' },
  { sym:'USDHUF', cat:'exotic', base:362.4,  spread:8,   vol:'Medium',    strat:'Trend Following' },
  { sym:'EURTRY', cat:'exotic', base:35.21,  spread:18,  vol:'Very High', strat:'Trend Following' },
  { sym:'GBPTRY', cat:'exotic', base:41.38,  spread:20,  vol:'Very High', strat:'Trend Following' },
  // METALS
  { sym:'XAUUSD', cat:'metal',  base:2312.45, spread:0.3, vol:'High',     strat:'ICT/SMC'         },
  { sym:'XAGUSD', cat:'metal',  base:27.42,   spread:0.03,vol:'High',     strat:'Breakout'        },
  { sym:'XPTUSD', cat:'metal',  base:984.2,   spread:0.5, vol:'Medium',   strat:'S&R Bounce'      },
  { sym:'XPDUSD', cat:'metal',  base:1021.4,  spread:1.0, vol:'Medium',   strat:'Trend Following' },
  // CRYPTO
  { sym:'BTCUSD', cat:'crypto', base:67420,   spread:15,  vol:'Very High', strat:'Breakout'       },
  { sym:'ETHUSD', cat:'crypto', base:3482,    spread:2,   vol:'Very High', strat:'Breakout'       },
  { sym:'LTCUSD', cat:'crypto', base:84.2,    spread:0.5, vol:'Very High', strat:'Trend Following'},
  { sym:'XRPUSD', cat:'crypto', base:0.5821,  spread:0.002,vol:'Very High',strat:'Breakout'       },
  // INDICES
  { sym:'US30',   cat:'index',  base:38420,   spread:2,   vol:'High',      strat:'Trend Following'},
  { sym:'NAS100', cat:'index',  base:17842,   spread:1,   vol:'High',      strat:'ICT/SMC'        },
  { sym:'SP500',  cat:'index',  base:5124,    spread:0.5, vol:'High',      strat:'Trend Following'},
  { sym:'GER40',  cat:'index',  base:18320,   spread:1.2, vol:'High',      strat:'Trend Following'},
  { sym:'UK100',  cat:'index',  base:8124,    spread:1,   vol:'Medium',    strat:'S&R Bounce'     },
  { sym:'JPN225', cat:'index',  base:38820,   spread:5,   vol:'High',      strat:'Trend Following'},
];

const STRATEGIES = [
  {
    ico:'📈', color:'var(--blue3)', id:'trend', num:'01',
    name:'Trend Following',
    desc:'Trade in the direction of the dominant trend using EMA stacks (21/50/200). Enter on pullbacks to moving averages. Confirmed by MACD and ADX > 25.',
    tags:['EMA Stack','MACD','ADX > 25'], wr:'~60%', rrr:'1:2.5',
    tf:'H4, D1', pairs:'EURUSD, GBPUSD, XAUUSD', diff:'⭐⭐', sess:'Any',
    note:'Enter on pullbacks to EMA50/EMA200. Wait for price to touch and bounce. MACD histogram must align. ADX above 25. Hold until EMA20 is broken on lower TF.'
  },
  {
    ico:'🔄', color:'var(--gold)', id:'reversal', num:'02',
    name:'Mean Reversion',
    desc:'Fade overextended moves when RSI enters extreme zones (< 30 or > 70) with visible divergence. Best in ranging markets. Tight SL above/below swing.',
    tags:['RSI Divergence','Bollinger Bands'], wr:'~58%', rrr:'1:2',
    tf:'H1, H4', pairs:'EURUSD, AUDNZD, Crosses', diff:'⭐⭐⭐', sess:'Asian, NY',
    note:'RSI divergence is the key trigger. Bollinger Band touch for confirmation. Tight SL 5 pips beyond the swing. Best in low ADX, ranging conditions.'
  },
  {
    ico:'💥', color:'var(--green)', id:'breakout', num:'03',
    name:'Breakout Trading',
    desc:'Enter on decisive close above/below key S/R levels with volume expansion. Wait for candle close confirmation. Set SL just inside the broken level.',
    tags:['S&R Levels','Volume','ATR Filter'], wr:'~52%', rrr:'1:3',
    tf:'H4, D1', pairs:'USDJPY, GBPUSD, BTC', diff:'⭐⭐', sess:'London Open',
    note:'Wait for a full candle close beyond the level — not a wick. Volume must expand. SL just inside the broken structure. TP at measured move distance.'
  },
  {
    ico:'🏛', color:'var(--blue4)', id:'ict', num:'04',
    name:'ICT / Smart Money',
    desc:'Trade from Order Blocks, Fair Value Gaps (FVG), and liquidity sweeps. Identify displacement candles and enter on retracement into the OB/FVG.',
    tags:['Order Blocks','FVG','Liquidity'], wr:'~63%', rrr:'1:3+',
    tf:'M15, H1, H4', pairs:'XAUUSD, GBPUSD, NAS100', diff:'⭐⭐⭐⭐⭐', sess:'London, NY',
    note:'Mark displacement candles leaving OBs/FVGs. Wait for price to return and fill imbalance. Enter on confirmation wick within OB/FVG. Best during killzones.'
  },
  {
    ico:'🎯', color:'var(--orange)', id:'sr', num:'05',
    name:'S&R Bounce',
    desc:'Identify tested support/resistance levels on H4/D1. Enter on rejection candles (pin bars, engulfing) with RSI confirmation. Multi-touch zones are highest probability.',
    tags:['Pin Bars','Engulfing','RSI Confirm'], wr:'~61%', rrr:'1:2',
    tf:'H4, D1', pairs:'EURUSD, USDCHF, USDJPY', diff:'⭐⭐⭐', sess:'London, NY',
    note:'Mark multi-touch zones on H4/D1. Enter on rejection candles. RSI must confirm (oversold at support, overbought at resistance). Scale in on candle close.'
  },
  {
    ico:'⚡', color:'var(--red)', id:'scalp', num:'06',
    name:'Scalping',
    desc:'High frequency entries at London/NY open using EMA crossovers on M5. Use tight 8–15 pip SL. Only trade during session overlaps. ATR must confirm volatility.',
    tags:['EMA Cross','Session Timing','ATR'], wr:'~55%', rrr:'1:1.5',
    tf:'M5, M15', pairs:'EURUSD, GBPUSD, XAUUSD', diff:'⭐⭐⭐⭐', sess:'London/NY Overlap',
    note:'EMA 8/21 crossover on M5 for direction. Enter on first pullback at London (08:00) or NY (13:30). ATR > 5 pips minimum. Hard TP at 8–15 pips, SL at 5–8 pips.'
  }
];

const STRATEGY_NOTES = {
  trend:    'Trend Following: Enter on pullbacks to EMA50/EMA200. Wait for price to touch and bounce. Confirm with MACD histogram aligned to trend. ADX should be above 25. Hold until EMA20 is broken on the lower TF.',
  reversal: 'Mean Reversion: RSI divergence is the key trigger. Enter when price reaches oversold/overbought on H1/H4 with clear divergence. Use Bollinger Bands for confirmation. Tight SL 5 pips beyond the swing.',
  breakout: 'Breakout: Wait for decisive close beyond key S/R — not a wick. Volume should expand on breakout candle. Entry at candle close, SL just inside the broken level, TP at measured move.',
  ict:      'ICT/SMC: Identify displacement candles leaving Order Blocks or FVGs. Wait for price to return and fill the imbalance. Entry on confirmation wick within OB/FVG. Best during London and NY killzones.',
  sr:       'S&R Bounce: Mark multi-touch zones on H4/D1. Enter on rejection candles (pin bars, engulfing) at these zones. RSI must confirm. Scale in on close of rejection candle.',
  scalp:    'Scalping: Use M5/M15 during London open (08:00 GMT) and NY open (13:30 GMT). EMA 8/21 crossover for direction. Enter on first pullback. ATR must be > 5 pips. Hard TP at 8–15 pips, SL at 5–8 pips.',
};

const CALENDAR_EVENTS = [
  { time:'08:30', cur:'USD', event:'Initial Jobless Claims',        impact:'high'   },
  { time:'10:00', cur:'EUR', event:'ECB President Lagarde Speech',  impact:'high'   },
  { time:'13:30', cur:'USD', event:'Core PPI m/m',                 impact:'medium' },
  { time:'15:00', cur:'USD', event:'Fed Member Williams Speech',    impact:'medium' },
  { time:'16:00', cur:'GBP', event:'BOE Credit Conditions Survey', impact:'low'    },
  { time:'18:30', cur:'CAD', event:'BOC Gov Macklem Speech',       impact:'high'   },
];

const EDU_SECTIONS = [
  {
    title: 'Entry Rules',
    rows: [
      { n:'Trend Filter',  v:'D1 bias must confirm direction',    cls:'' },
      { n:'EMA Stack',     v:'Price > EMA50 > EMA200 = BUY bias', cls:'ac' },
      { n:'RSI Zone',      v:'Buy 30–55 · Sell 45–70',           cls:'' },
      { n:'Divergence',    v:'+15% confluence bonus',            cls:'ac' },
      { n:'Min Factors',   v:'At least 3 aligned before entry',  cls:'' },
      { n:'News Filter',   v:'No entry ±30min high-impact',      cls:'wn' },
      { n:'Session',       v:'London/NY overlap preferred',      cls:'ok' },
    ]
  },
  {
    title: 'Exit Rules',
    rows: [
      { n:'SL Placement',  v:'Below/above nearest structure',    cls:'' },
      { n:'Minimum RRR',   v:'1:2 minimum · target 1:3',        cls:'ac' },
      { n:'TP1 — 50%',     v:'Close at 1:1.5 · SL to BE',       cls:'' },
      { n:'TP2 — 50%',     v:'Trail on EMA20 · let run',        cls:'' },
      { n:'Time Stop',     v:'Exit if no move after 3 candles', cls:'wn' },
      { n:'Daily DD Max',  v:'Stop trading at −3% equity',      cls:'wn' },
      { n:'Max Trades',    v:'3/day max · 1 open at a time',    cls:'' },
    ]
  },
  {
    title: 'Position Sizing',
    rows: [
      { n:'Core Rule',     v:'Never risk > 1–2% per trade',     cls:'ac' },
      { n:'Formula',       v:'Risk$ ÷ (SL pips × pip value)',   cls:'' },
      { n:'Conservative',  v:'0.5% per trade',                  cls:'ok' },
      { n:'Standard',      v:'1% per trade',                    cls:'ac' },
      { n:'Aggressive',    v:'2% (experienced traders only)',   cls:'wn' },
      { n:'Monthly DD',    v:'Stop at −10% drawdown/month',     cls:'wn' },
    ]
  },
  {
    title: 'Expectancy Model',
    rows: [
      { n:'Conservative',  v:'50% WR · 1:2 RRR = +0.50R',      cls:'ok' },
      { n:'Realistic',     v:'58% WR · 1:2.5 = +0.87R',        cls:'ok' },
      { n:'Optimistic',    v:'65% WR · 1:3 = +1.30R',          cls:'ok' },
      { n:'Bad Month',     v:'35% WR · 1:2 = −0.30R',          cls:'wn' },
      { n:'Formula',       v:'E=(W%×Avg Win)−(L%×Avg Loss)',    cls:'' },
    ]
  },
];
