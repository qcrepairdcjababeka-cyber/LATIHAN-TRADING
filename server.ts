/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Gemini SDK securely on the server
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn('WARNING: GEMINI_API_KEY environment variable is not set. AI analysis will fall back to local rule-based commentary.');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON
  app.use(express.json());

  // --- API ROUTE: HEALTH CHECK ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: Date.now(), hasApiKey: !!apiKey });
  });

// --- COMPREHENSIVE PRICE ACCURACY & SYMBOL RESOLUTION MAP FOR TOP 500 & ALPHA GEMS ---
const ACCURATE_TOKEN_BASE_PRICES: Record<string, number> = {
  // Gold & Commodities
  'XAUUSD': 2920.0,
  'XAUUSDT': 2920.0,
  'PAXGUSDT': 2920.0,

  // Majors
  'BTCUSDT': 96500.0,
  'ETHUSDT': 2750.0,
  'SOLUSDT': 185.0,
  'BNBUSDT': 645.0,
  'XRPUSDT': 2.45,
  'DOGEUSDT': 0.265,
  'ADAUSDT': 0.78,
  'AVAXUSDT': 28.5,
  'SUIUSDT': 3.25,
  'LINKUSDT': 18.2,
  'NEARUSDT': 4.85,
  'APTUSDT': 8.6,
  'DOTUSDT': 6.5,
  'ICPUSDT': 10.8,
  'TRXUSDT': 0.24,
  'UNIUSDT': 9.8,
  'LTCUSDT': 108.0,
  'BCHUSDT': 425.0,
  'ETCUSDT': 24.2,
  'XLMUSDT': 0.32,
  'HBARUSDT': 0.22,
  'FETUSDT': 1.45,
  'RENDERUSDT': 6.2,
  'TAOUSDT': 485.0,
  'AAVEUSDT': 215.0,
  'INJUSDT': 22.4,
  'TIAUSDT': 4.8,
  'SEIUSDT': 0.42,
  'ATOMUSDT': 5.8,
  'STXUSDT': 1.65,
  'FILUSDT': 4.2,
  'KASUSDT': 0.14,
  'FTMUSDT': 0.75,
  'ALGOUSDT': 0.24,
  'VETUSDT': 0.038,
  'SANDUSDT': 0.48,
  'MANAUSDT': 0.46,
  'AXSUSDT': 6.8,
  'GALAUSDT': 0.028,
  'THETAUSDT': 1.85,
  'EGLDUSDT': 28.0,
  'FLOWUSDT': 0.68,
  'CHZUSDT': 0.078,
  'CRVUSDT': 0.62,
  'MKRUSDT': 1650.0,
  'SNXUSDT': 1.65,
  'LDOUSDT': 1.45,
  'QNTUSDT': 88.0,
  'RUNEUSDT': 4.2,
  'DYDXUSDT': 1.25,
  'KAVAUSDT': 0.48,
  'ZILUSDT': 0.022,
  'ENJUSDT': 0.21,
  '1INCHUSDT': 0.38,
  'COMPUSDT': 62.0,
  'ZRXUSDT': 0.42,
  'BATUSDT': 0.22,
  'HOTUSDT': 0.00195,
  'IOTAUSDT': 0.24,
  'NEOUSDT': 12.5,
  'WAVESUSDT': 1.45,
  'KSMUSDT': 24.5,
  'DASHUSDT': 32.0,
  'ZECUSDT': 42.0,
  'XMRUSDT': 165.0,
  'LRCUSDT': 0.195,
  'ANKRUSDT': 0.032,
  'QTUMUSDT': 3.2,
  'ONTUSDT': 0.21,
  'ICXUSDT': 0.185,
  'RVNUSDT': 0.021,
  'SCUSDT': 0.0058,
  'ZENUSDT': 9.8,
  'IOSTUSDT': 0.0072,
  'WAXPUSDT': 0.042,
  'ARUSDT': 16.5,
  'MINAUSDT': 0.62,
  'BLURUSDT': 0.24,
  'JASMYUSDT': 0.021,
  'CFXUSDT': 0.165,
  'ACHUSDT': 0.028,
  'WOOUSDT': 0.22,
  'SSVUSDT': 22.0,
  'PENDLEUSDT': 4.65,
  'ARKMUSDT': 1.75,
  'WLDUSDT': 2.15,
  'CYBERUSDT': 3.8,
  'STRKUSDT': 0.48,
  'ENAUSDT': 0.68,
  'ORDIUSDT': 26.5,
  'SATSUSDT': 0.000000245,
  '1000SATSUSDT': 0.000245,
  'RATSUSDT': 0.000088,
  '1000RATSUSDT': 0.088,

  // Solana & Ecosystem
  'RAYUSDT': 4.25,
  'JUPUSDT': 0.98,
  'PYTHUSDT': 0.38,
  'WIFUSDT': 1.68,
  'BONKUSDT': 0.0000285,
  '1000BONKUSDT': 0.0285,
  'POPCATUSDT': 0.725,
  'MOODENGUSDT': 0.245,
  'GOATUSDT': 0.52,
  'PNUTUSDT': 0.445,
  'ACTUSDT': 0.225,
  'MEWUSDT': 0.00845,
  'DRIFTUSDT': 1.48,
  'TNSRUSDT': 0.585,
  'FARTCOINUSDT': 0.85,
  'AIXBTUSDT': 0.65,
  'VIRTUALUSDT': 1.85,
  'SPXUSDT': 0.62,
  'GIGAUSDT': 0.045,
  'PONKEUSDT': 0.48,
  'PENGUUSDT': 0.032,
  'MEUSDT': 3.45,

  // Meme & Viral Tokens
  'PEPEUSDT': 0.0000185,
  '1000PEPEUSDT': 0.0185,
  'SHIBUSDT': 0.0000245,
  '1000SHIBUSDT': 0.0245,
  'FLOKIUSDT': 0.000195,
  '1000FLOKIUSDT': 0.195,
  'TURBOUSDT': 0.00625,
  'BOMEUSDT': 0.00785,
  'BABYDOGEUSDT': 0.00000000215,
  '1MBABYDOGEUSDT': 0.00215,
  'MEMEUSDT': 0.0125,
  'BRETTUSDT': 0.125,
  'DEGENUSDT': 0.0115,

  // Binance Alpha Gems & New Listings
  'NEIROUSDT': 0.00185,
  '1000NEIROCTOUSDT': 0.00185,
  'NEIROETHUSDT': 0.085,
  'NOTUSDT': 0.0072,
  'DOGSUSDT': 0.00062,
  'CATIUSDT': 0.385,
  'HMSTRUSDT': 0.00325,
  'TONUSDT': 5.45,
  'ETHFIUSDT': 1.85,
  'WUSDT': 0.245,
  'REZUSDT': 0.0385,
  'BBUSDT': 0.325,
  'LISTAUSDT': 0.385,
  'IOUSDT': 1.95,
  'BANANAUSDT': 48.5,
  'AEVOUSDT': 0.35,
  'SCRUSDT': 0.68,
  'EIGENUSDT': 2.85,
  'CETUSUSDT': 0.285,
  'COWUSDT': 0.425,
  'THEUSDT': 1.65,

  // Fan Tokens & Consumer
  'SANTOSUSDT': 3.85,
  'PORTOUSDT': 2.15,
  'LAZIOUSDT': 1.95,
  'BARUSDT': 2.45,
  'CITYUSDT': 2.25,
  'PSGUSDT': 2.95,
  'JUVUSDT': 1.85,
  'ACMUSDT': 1.75,
  'ATMUSDT': 2.35,
  'ASRUSDT': 2.15,
  'OGUSDT': 5.45,
  'GASUSDT': 4.25,
  'VTHOUSDT': 0.00325,
  'COSUSDT': 0.00785,
  'HIVEUSDT': 0.265,
  'UTKUSDT': 0.0485,
};

// Helper to determine symbol aliases across Binance Spot, Futures and Bybit
function getSymbolCandidates(rawSymbol: string): string[] {
  const clean = rawSymbol.toUpperCase().replace(/[\s/_\-]/g, '');
  const list: string[] = [];

  const add = (s: string) => {
    if (s && !list.includes(s)) list.push(s);
  };

  // Specific alias mappings
  if (clean === 'XAUUSD' || clean === 'XAUUSDT' || clean === 'PAXG' || clean === 'PAXGUSDT') {
    add('PAXGUSDT');
    add('PAXGUSD');
    add('XAUUSDT');
    add('XAUUSD');
    return list;
  }

  if (clean === 'NEIRO' || clean === 'NEIROUSDT') {
    add('NEIROUSDT');
    add('1000NEIROCTOUSDT');
    add('NEIROETHUSDT');
  }

  if (clean === 'BABYDOGE' || clean === 'BABYDOGEUSDT' || clean === '1MBABYDOGE' || clean === '1MBABYDOGEUSDT') {
    add('1MBABYDOGEUSDT');
    add('BABYDOGEUSDT');
    add('1000000BABYDOGEUSDT');
  }

  if (clean === 'PEPE' || clean === 'PEPEUSDT') {
    add('PEPEUSDT');
    add('1000PEPEUSDT');
  }

  if (clean === 'BONK' || clean === 'BONKUSDT') {
    add('BONKUSDT');
    add('1000BONKUSDT');
  }

  if (clean === 'FLOKI' || clean === 'FLOKIUSDT') {
    add('FLOKIUSDT');
    add('1000FLOKIUSDT');
  }

  if (clean === 'SHIB' || clean === 'SHIBUSDT') {
    add('SHIBUSDT');
    add('1000SHIBUSDT');
  }

  if (clean === 'SATS' || clean === 'SATSUSDT' || clean === '1000SATSUSDT') {
    add('1000SATSUSDT');
    add('SATSUSDT');
  }

  if (clean === 'RATS' || clean === 'RATSUSDT' || clean === '1000RATSUSDT') {
    add('1000RATSUSDT');
    add('RATSUSDT');
  }

  // Base pair
  add(clean.endsWith('USDT') ? clean : `${clean}USDT`);
  add(clean);
  if (!clean.startsWith('1000') && !clean.startsWith('1M')) {
    add(`1000${clean.endsWith('USDT') ? clean : `${clean}USDT`}`);
    add(`1M${clean.endsWith('USDT') ? clean : `${clean}USDT`}`);
  }

  return list;
}

// Map Binance interval string to Bybit interval
function toBybitInterval(interval: string): string {
  if (interval === '1m') return '1';
  if (interval === '3m') return '3';
  if (interval === '5m') return '5';
  if (interval === '15m') return '15';
  if (interval === '30m') return '30';
  if (interval === '1h') return '60';
  if (interval === '2h') return '120';
  if (interval === '4h') return '240';
  if (interval === '1d') return 'D';
  if (interval === '1w') return 'W';
  if (interval === '1M') return 'M';
  return '15';
}

// --- API ROUTE: PROXY BINANCE & BYBIT CANDLES (Avoids CORS, accurate Alpha Gems) ---
app.get('/api/binance/candles', async (req, res) => {
  // Parameter normalization helper functions
  const normalizeSymbol = (sym: any): string => {
    if (typeof sym !== 'string' || !sym.trim()) return 'BTCUSDT';
    const cleaned = sym.trim().toUpperCase().replace(/[\s/_\-]/g, '');
    return cleaned || 'BTCUSDT';
  };

  const normalizeInterval = (tf: any): string => {
    if (typeof tf !== 'string' || !tf.trim()) return '15m';
    const val = tf.trim();
    const lower = val.toLowerCase();

    if (['1d', 'd1', 'daily', 'day'].includes(lower)) return '1d';
    if (['4h', 'h4'].includes(lower)) return '4h';
    if (['2h', 'h2'].includes(lower)) return '2h';
    if (['1h', 'h1'].includes(lower)) return '1h';
    if (['30m', 'm30'].includes(lower)) return '30m';
    if (['15m', 'm15'].includes(lower)) return '15m';
    if (['5m', 'm5'].includes(lower)) return '5m';
    if (['3m', 'm3'].includes(lower)) return '3m';
    if (['1m', 'm1'].includes(lower)) return '1m';
    if (['1w', 'w1', 'weekly'].includes(lower)) return '1w';
    if (['1M', 'm1_month', 'monthly'].includes(val)) return '1M';

    const allowed = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];
    return allowed.includes(lower) ? lower : '15m';
  };

  const normalizeLimit = (lim: any): number => {
    const parsed = parseInt(String(lim), 10);
    if (isNaN(parsed) || parsed <= 0) return 120;
    return Math.min(Math.max(parsed, 10), 1000);
  };

  const cleanSymbol = normalizeSymbol(req.query.symbol);
  const cleanInterval = normalizeInterval(req.query.interval);
  const cleanLimit = normalizeLimit(req.query.limit);

  const candidateSymbols = getSymbolCandidates(cleanSymbol);
  const bybitInterval = toBybitInterval(cleanInterval);

  let candles: any[] | null = null;
  let lastErrorMsg = '';

  // Try Binance Spot, Binance Futures, Binance Vision, then Bybit Linear for all candidate symbols
  for (const sym of candidateSymbols) {
    if (candles) break;

    const endpoints = [
      {
        url: `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${cleanInterval}&limit=${cleanLimit}`,
        parser: (json: any) => {
          if (!Array.isArray(json) || json.length === 0) return null;
          return json.map((item: any) => ({
            time: item[0],
            timeString: new Date(item[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5]),
          }));
        },
      },
      {
        url: `https://fapi.binance.com/fapi/v1/klines?symbol=${sym}&interval=${cleanInterval}&limit=${cleanLimit}`,
        parser: (json: any) => {
          if (!Array.isArray(json) || json.length === 0) return null;
          return json.map((item: any) => ({
            time: item[0],
            timeString: new Date(item[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5]),
          }));
        },
      },
      {
        url: `https://data-api.binance.vision/api/v3/klines?symbol=${sym}&interval=${cleanInterval}&limit=${cleanLimit}`,
        parser: (json: any) => {
          if (!Array.isArray(json) || json.length === 0) return null;
          return json.map((item: any) => ({
            time: item[0],
            timeString: new Date(item[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5]),
          }));
        },
      },
      {
        url: `https://api.bybit.com/v5/market/kline?category=linear&symbol=${sym}&interval=${bybitInterval}&limit=${cleanLimit}`,
        parser: (json: any) => {
          if (!json?.result?.list || !Array.isArray(json.result.list) || json.result.list.length === 0) return null;
          // Bybit returns in reverse chronological order [newest ... oldest]
          const list = [...json.result.list].reverse();
          return list.map((item: any) => {
            const time = parseInt(item[0], 10);
            return {
              time,
              timeString: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              open: parseFloat(item[1]),
              high: parseFloat(item[2]),
              low: parseFloat(item[3]),
              close: parseFloat(item[4]),
              volume: parseFloat(item[5]),
            };
          });
        },
      },
    ];

    for (const ep of endpoints) {
      try {
        const response = await fetch(ep.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const json = await response.json();
          const parsed = ep.parser(json);
          if (parsed && parsed.length > 0) {
            candles = parsed;
            break;
          }
        } else {
          const errText = await response.text().catch(() => '');
          lastErrorMsg = `HTTP ${response.status}: ${errText.slice(0, 80)}`;
        }
      } catch (err: any) {
        lastErrorMsg = err.message || 'Fetch failed';
      }
    }
  }

  if (candles && candles.length > 0) {
    return res.json({
      success: true,
      candles,
      isFallback: false,
      symbol: cleanSymbol,
      interval: cleanInterval,
    });
  }

  // --- ACCURATE SYNTHETIC CANDLES FALLBACK (IF APIS ARE BLOCKED/SANDBOXED) ---
  console.warn(`Live market APIs unavailable (${lastErrorMsg}). Generating authentic scaled candles for ${cleanSymbol} (${cleanInterval}).`);
  const now = Date.now();
  let intervalMs = 15 * 60 * 1000;
  if (cleanInterval === '1m') intervalMs = 60 * 1000;
  else if (cleanInterval === '3m') intervalMs = 3 * 60 * 1000;
  else if (cleanInterval === '5m') intervalMs = 5 * 60 * 1000;
  else if (cleanInterval === '15m') intervalMs = 15 * 60 * 1000;
  else if (cleanInterval === '30m') intervalMs = 30 * 60 * 1000;
  else if (cleanInterval === '1h') intervalMs = 60 * 60 * 1000;
  else if (cleanInterval === '2h') intervalMs = 2 * 60 * 60 * 1000;
  else if (cleanInterval === '4h') intervalMs = 4 * 60 * 60 * 1000;
  else if (cleanInterval === '1d') intervalMs = 24 * 60 * 60 * 1000;

  // Determine realistic base price from accurate token mapping
  const normalizedKey = cleanSymbol.endsWith('USDT') ? cleanSymbol : `${cleanSymbol}USDT`;
  let basePrice = ACCURATE_TOKEN_BASE_PRICES[normalizedKey] || ACCURATE_TOKEN_BASE_PRICES[cleanSymbol];

  if (!basePrice) {
    // Dynamic fallback based on token characteristics rather than an absurd $64k
    if (cleanSymbol.includes('XAU') || cleanSymbol.includes('GOLD') || cleanSymbol.includes('PAXG')) {
      basePrice = 2920.0;
    } else if (cleanSymbol.includes('BTC')) {
      basePrice = 96500.0;
    } else if (cleanSymbol.includes('ETH')) {
      basePrice = 2750.0;
    } else if (cleanSymbol.includes('SOL')) {
      basePrice = 185.0;
    } else if (cleanSymbol.includes('BNB')) {
      basePrice = 645.0;
    } else {
      // Standard token pricing tier
      basePrice = 1.25;
    }
  }

  // Calculate dynamic precision to prevent micro tokens from losing digits
  const getDynamicPrecision = (price: number): number => {
    if (price >= 100) return 2;
    if (price >= 1) return 4;
    if (price >= 0.01) return 5;
    if (price >= 0.0001) return 7;
    return 9;
  };

  const precision = getDynamicPrecision(basePrice);
  const startTime = now - cleanLimit * intervalMs;
  let currentPrice = basePrice;
  const syntheticCandles = [];

  for (let i = 0; i < cleanLimit; i++) {
    const time = startTime + i * intervalMs;
    const volatility = 0.007; // 0.7% movement per candle
    const change = (Math.random() - 0.49) * (basePrice * volatility);
    const open = currentPrice;
    const close = Math.max(open + change, basePrice * 0.5);
    const high = Math.max(open, close) + Math.random() * (basePrice * (volatility * 0.5));
    const low = Math.max(Math.min(open, close) - Math.random() * (basePrice * (volatility * 0.5)), basePrice * 0.4);
    const volume = Math.floor(Math.random() * 5000) + 150;

    syntheticCandles.push({
      time,
      timeString: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      open: parseFloat(open.toFixed(precision)),
      high: parseFloat(high.toFixed(precision)),
      low: parseFloat(low.toFixed(precision)),
      close: parseFloat(close.toFixed(precision)),
      volume,
    });

    currentPrice = close;
  }

  res.json({
    success: true,
    candles: syntheticCandles,
    isFallback: true,
    warning: lastErrorMsg,
    symbol: cleanSymbol,
    interval: cleanInterval,
  });
});

  // --- API ROUTE: SECURE SERVER-SIDE GEMINI AI ANALYSIS ---
  app.post('/api/gemini/analyze', async (req, res) => {
    if (!ai) {
      return res.json({
        success: true,
        isMock: true,
        analysis: `**[Koneksi AI Terbatas]** Kunci API Gemini tidak terdeteksi di server. Berikut adalah rekomendasi rule-based berdasarkan 7 Pilar Strategi STF (Sifir Time Frame):\n\n1. **Sifir Time Frame (STF)**: Ikuti arah dominan HTF (Daily/H4), gunakan MTF (H1/M15) untuk struktur, dan eksekusi pada LTF (M5/M1).\n2. **Valid Breakout & Engulfing**: Pastikan body candle menembus level SnR secara utuh (bukan wick tipis).\n3. **Zero Floating Zona (ZFZ)**: Pasang posisi di pucuk/akar shadow wick fresh untuk meminimalisir floating negatif.\n4. **Kode 6C.9C**: Pantau candle ke-6 (ekspansi/pullback) atau lilin ke-9 (exhaustion/turning point).\n5. **Zona 1 Lot [FM]**: Eksekusi ukuran maksimal hanya saat seluruh 5 konfluensi terpenuhi.\n6. **Storyline**: Ketahui asal pantulan harga dan target terminal selanjutnya.\n7. **Gun Number**: Validasi dengan level psikologis sakral (.000, .500).`
      });
    }

    try {
      const { symbol, stfHierarchy, activeSignal, engulfing, zeroFloatingZone, cycle6C9C, storyline, gunNumber } = req.body;

      const prompt = `
Anda adalah AI Quantitative Analyst & Master Trader Institusional yang mahir dalam sistem strategi trading:
**7 Pilar Strategi Trading STF (Sifir Time Frame)**:
1. **Sifir Time Frame (STF)** (Kaidah hirarki fraktal HTF -> MTF -> LTF)
2. **Valid Breakout & Engulfing (VBO)** (Body candle break utuh & fresh base zone)
3. **Zero Floating Zona (ZFZ)** (Sniper entry di ujung pucuk/akar wick shadow)
4. **Kode 6C.9C** (Siklus lilin ke-6 ekspansi / lilin ke-9 pembalikan jenuh)
5. **Zona 1 Lot [FM]** (Confluence golden setup berakurasi tinggi dengan tight SL)
6. **Storyline** (Alur cerita harga: dari mana harga datang -> fase terkini -> tujuan akhir)
7. **Gun Number** (Level psikologis sakral .000, .500 & deret Gann matematis)

Berikut adalah data teknikal live saat ini:
- **Aset (Ticker)**: ${symbol}
- **Data Sifir Time Frame**: ${JSON.stringify(stfHierarchy || {}, null, 2)}
- **Storyline**: ${JSON.stringify(storyline || {}, null, 2)}
- **Fresh Engulfing & VBO**: ${JSON.stringify(engulfing || {}, null, 2)}
- **Zero Floating Zona (ZFZ)**: ${JSON.stringify(zeroFloatingZone || {}, null, 2)}
- **Kode Siklus 6C.9C**: ${JSON.stringify(cycle6C9C || {}, null, 2)}
- **Gun Number Key Level**: ${JSON.stringify(gunNumber || {}, null, 2)}
- **Sinyal Terdeteksi**: ${activeSignal ? JSON.stringify(activeSignal, null, 2) : "Sedang memantau konfluensi 7 pilar."}

Buatlah laporan analisis taktis mendalam, tajam, dan mudah dipahami dalam **Bahasa Indonesia**.

Format laporan dengan Markdown terstruktur:
1. **🗺️ 1 & 6. Storyline & Sifir Time Frame (STF)**:
   - Dari mana harga memantul (Origin) dan ke mana tujuan target selanjutnya (Destination)?
   - Bagaimana keselarasan tren HTF (H4/Daily) dengan eksekusi LTF?
2. **⚡ 2 & 3. Valid Breakout, Engulfing & Zero Floating Zona (ZFZ)**:
   - Evaluasi kualitas breakout lilin (apakah valid body break atau wick palsu).
   - Penentuan level harga presisi di area Zero Floating Zona (akar/pucuk wick).
3. **⏱️ 4 & 7. Kode 6C.9C & Validasi Gun Number**:
   - Status candle count saat ini (apakah sedang mendekati/aktif Kode 6C atau 9C?).
   - Konfirmasi reaksi harga di level Gun Number psikologis.
4. **🏆 5. Klasifikasi Zona 1 Lot [FM] & Rencana Eksekusi**:
   - Apakah setup ini layak disebut **Zona 1 Lot [FM]**? Jelaskan skor konfluensinya.
   - **Rekomendasi Aksi**: (BUY / SELL / WAIT)
   - **Entry Sniper**: Level ZFZ ideal
   - **Stop Loss Ketat**: Di luar wick ZFZ
   - **Target Take Profit 1 & Take Profit 2 (Storyline Target)**
   - **Rasio Risk-to-Reward (RR)**
5. **🛡️ SOP & Manajemen Risiko Institusional**: Pesan disiplin trading tanpa emosi.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });

      const analysisText = response.text || "Gagal memformulasikan analisis pasar.";
      res.json({ success: true, isMock: false, analysis: analysisText });

    } catch (error: any) {
      console.error('Gemini analysis error:', error);
      res.status(500).json({ success: false, error: error.message || 'AI analysis engine encountered an issue' });
    }
  });

  // --- VITE MIDDLEWARE / STATIC SERVING CONFIG ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware integrated for local development.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static build from dist folder.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Institutional Scanner server listening on host 0.0.0.0 and port ${PORT}`);
  });
}

startServer();
