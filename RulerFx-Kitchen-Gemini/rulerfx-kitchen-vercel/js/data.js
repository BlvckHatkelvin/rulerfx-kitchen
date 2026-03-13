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
    ico:'📊', color:'var(--blue3)', id:'ema_trend', num:'01',
    name:'EMA Trend Alignment',
    desc:'Price and all three EMAs must stack in perfect order. Price > EMA20 > EMA50 > EMA200 for BUY. The opposite for SELL. Strongest signal in trending markets.',
    tags:['EMA 20','EMA 50','EMA 200'], wr:'~62%', rrr:'1:2.5',
    tf:'H1, H4, D1', pairs:'All majors, XAUUSD, Indices', diff:'⭐⭐', sess:'Any',
    trigger_buy:'Price above EMA20, EMA20 above EMA50, EMA50 above EMA200 — all stacked bullish.',
    trigger_sell:'Price below EMA20, EMA20 below EMA50, EMA50 below EMA200 — all stacked bearish.',
    how_it_works:'The three EMAs act as dynamic support/resistance layers. When all four elements (price + 3 EMAs) are perfectly stacked, it confirms a strong institutional trend. The EMA200 is the most important — it separates bull and bear territory. EMA50 acts as the trend backbone. EMA20 is the entry trigger.',
    entry:'Enter on a pullback to EMA20 after all EMAs are aligned. Do not chase the move — wait for price to dip back to EMA20 and show rejection.',
    sl:'Place SL below the most recent swing low (BUY) or above the most recent swing high (SELL). Minimum 1.5x ATR distance.',
    tips:['Best on H4 and D1 timeframes for cleaner signals', 'Avoid during sideways/choppy markets — ADX below 20 = skip', 'The further EMA200 is from price, the stronger the trend', 'Use EMA50 as your trailing stop once in profit'],
    note:'EMA stack alignment is the backbone of the signal engine. When this fires with 2+ other strategies, it is a very high probability setup.'
  },
  {
    ico:'🎯', color:'var(--gold)', id:'rsi_ob', num:'02',
    name:'RSI + Order Block',
    desc:'RSI reaches oversold (<35) or overbought (>65) zone while price sits inside a detected institutional Order Block. Two confirmations in one setup.',
    tags:['RSI 14','Order Blocks','Institutional Zones'], wr:'~65%', rrr:'1:3',
    tf:'M15, H1, H4', pairs:'XAUUSD, GBPUSD, EURUSD, NAS100', diff:'⭐⭐⭐⭐', sess:'London, NY Killzones',
    trigger_buy:'RSI below 35 AND price inside a detected Bullish Order Block zone.',
    trigger_sell:'RSI above 65 AND price inside a detected Bearish Order Block zone.',
    how_it_works:'Order Blocks are the last candle before a major institutional move. When price returns to these zones, smart money is accumulating or distributing again. RSI in extreme territory confirms that the move is overextended and a reversal is likely. The combination of institutional zone + momentum extreme = high probability reversal.',
    entry:'Enter when price is inside the OB zone and RSI confirms the extreme. Look for a confirmation candle — a bullish engulfing or hammer at a bullish OB, a bearish engulfing or shooting star at a bearish OB.',
    sl:'Place SL just beyond the Order Block (below the low of a bullish OB, above the high of a bearish OB). If price fully closes beyond the OB, the setup is invalid.',
    tips:['Order Blocks are more powerful on higher timeframes (H4/D1)', 'RSI below 30 at a bullish OB is elite — very rare but very powerful', 'Not every OB touch will reverse — require RSI confirmation', 'After RSI divergence at an OB = near-guaranteed reversal'],
    note:'This is the highest win-rate strategy in the engine when both conditions align perfectly. Patience is key — wait for both OB touch AND RSI extreme simultaneously.'
  },
  {
    ico:'⚡', color:'var(--green)', id:'macd_struct', num:'03',
    name:'MACD + Structure Break',
    desc:'A fresh MACD histogram crossover (from negative to positive, or vice versa) aligned with confirmed market structure — Higher Highs/Higher Lows or Lower Highs/Lower Lows.',
    tags:['MACD 12/26/9','BOS','Market Structure'], wr:'~58%', rrr:'1:2',
    tf:'H1, H4', pairs:'EURUSD, USDJPY, GBPJPY, BTCUSD', diff:'⭐⭐⭐', sess:'London Open, NY Open',
    trigger_buy:'MACD histogram just crossed from negative to positive AND market structure shows HH/HL pattern.',
    trigger_sell:'MACD histogram just crossed from positive to negative AND market structure shows LH/LL pattern.',
    how_it_works:'MACD measures momentum shift — when the histogram flips, it means the buyers/sellers are taking control. But MACD alone gives too many false signals. By requiring the market structure to also confirm (price making higher highs/higher lows for bulls, lower highs/lower lows for bears), we filter out the noise and only trade momentum that is backed by structural proof.',
    entry:'Enter on the candle after the MACD crossover is confirmed. Do not enter before the histogram fully flips — wait for the close.',
    sl:'Below the most recent Higher Low (for BUY) or above the most recent Lower High (for SELL). This is the point where the structure is broken.',
    tips:['MACD crossover is only valid on the current candle close — do not anticipate', 'HH/HL must be the last 3-4 swing points, not older structure', 'This strategy works best at session opens when volatility picks up', 'Combine with EMA200 filter — only take MACD buys above EMA200'],
    note:'This strategy catches the early stage of trend continuation moves. It fires frequently but needs structure confirmation to be reliable.'
  },
  {
    ico:'🔲', color:'var(--blue4)', id:'fvg', num:'04',
    name:'FVG Fill Setup',
    desc:'A Fair Value Gap (3-candle imbalance) acts as a price magnet. When price enters an unfilled FVG, it tends to fill the imbalance before continuing in the original direction.',
    tags:['Fair Value Gap','Imbalance','ICT Concept'], wr:'~60%', rrr:'1:2.5',
    tf:'M15, H1, H4', pairs:'XAUUSD, NAS100, GBPUSD, EURUSD', diff:'⭐⭐⭐⭐', sess:'London, NY',
    trigger_buy:'Price enters a detected Bullish FVG (gap between previous candle high and next candle low after a bullish displacement).',
    trigger_sell:'Price enters a detected Bearish FVG (gap between previous candle low and next candle high after a bearish displacement).',
    how_it_works:'When price moves very fast in one direction, it creates an imbalance — a price range where no real two-sided trading occurred. These gaps act like magnets because institutional algorithms need to fill orders at every price level. When price returns to the FVG, it fills the imbalance and often uses the FVG as a launchpad to continue in the direction of the original move.',
    entry:'Enter when price enters the FVG from the outside. Best entries are at the 50% midpoint of the FVG. A candle wick into the FVG that then closes outside is also valid.',
    sl:'Below the bottom of a Bullish FVG (or above the top of a Bearish FVG). If price fully closes through the FVG, the setup fails.',
    tips:['FVGs formed during high-impact news moves are the most powerful', 'A FVG that has never been touched is stronger than one partially filled', 'Combine FVG with OB at the same level for a confluence zone', 'FVGs on H4/D1 take longer to fill but are more reliable when they do'],
    note:'FVG setups are core ICT/Smart Money concepts. The engine detects these automatically from the candle sequence — no manual marking needed.'
  },
  {
    ico:'🌊', color:'var(--red)', id:'liq_sweep', num:'05',
    name:'Liquidity Sweep Reversal',
    desc:'Price briefly spikes beyond a swing high or low to hunt retail stop losses, then sharply reverses. This is smart money at its most visible — the classic stop hunt pattern.',
    tags:['Stop Hunt','Liquidity','Swing Levels'], wr:'~68%', rrr:'1:3+',
    tf:'M15, H1, H4', pairs:'All pairs — especially XAUUSD, GBPUSD, NAS100', diff:'⭐⭐⭐⭐⭐', sess:'London Open, NY Open',
    trigger_buy:'Price wicks below a recent swing low (takes out stops) but the candle closes ABOVE that low — confirming a bullish sweep and reversal.',
    trigger_sell:'Price wicks above a recent swing high (takes out stops) but the candle closes BELOW that high — confirming a bearish sweep and reversal.',
    how_it_works:'Retail traders place their stop losses just below swing lows (long trades) and above swing highs (short trades). Institutional traders know exactly where these stops are clustered. They push price briefly into these zones to trigger the stops (providing them cheap liquidity to fill their own large orders), then reverse hard in their intended direction. The wick-and-close pattern is the fingerprint of this manipulation.',
    entry:'Enter on the close of the sweep candle (the candle that wicked beyond the level but closed back). This is the most aggressive entry. Alternatively, enter on the next candle open for confirmation.',
    sl:'Above the sweep wick high (for SELL) or below the sweep wick low (for BUY). The wick itself becomes the invalidation level.',
    tips:['The bigger the wick relative to the candle body, the stronger the signal', 'Sweeps during Asian session often set up London open reversals', 'Multiple stop clusters at the same level = more powerful sweep', 'This is the highest RRR strategy — often gives 1:4 or better'],
    note:'This is the most powerful single strategy when it fires. A liquidity sweep at a key level with RSI extreme is one of the cleanest setups in forex. The engine also detects EMA50 bounces as a secondary signal in this category.'
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
