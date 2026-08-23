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

// --- API ROUTE: PROXY BINANCE CANDLES (Avoids CORS, formats data) ---
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

    // Map XAUUSD to PAXGUSDT (Gold on Binance) or query both
    const isGold = cleanSymbol === 'XAUUSD' || cleanSymbol === 'XAUUSDT' || cleanSymbol === 'PAXGUSDT';
    const querySymbol = isGold ? 'PAXGUSDT' : cleanSymbol;

    const urls = [
      `https://api.binance.com/api/v3/klines?symbol=${querySymbol}&interval=${cleanInterval}&limit=${cleanLimit}`,
      `https://fapi.binance.com/fapi/v1/klines?symbol=${querySymbol}&interval=${cleanInterval}&limit=${cleanLimit}`,
      `https://data-api.binance.vision/api/v3/klines?symbol=${querySymbol}&interval=${cleanInterval}&limit=${cleanLimit}`,
    ];

    let rawData: any[] | null = null;
    let lastErrorMsg = '';

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const json = await response.json();
          if (Array.isArray(json) && json.length > 0) {
            rawData = json;
            break;
          }
        } else {
          const errText = await response.text().catch(() => '');
          lastErrorMsg = `Binance HTTP ${response.status}: ${errText.slice(0, 100)}`;
        }
      } catch (err: any) {
        lastErrorMsg = err.message || 'Fetch failed';
      }
    }

    if (rawData) {
      const candles = rawData.map((item: any) => {
        const time = item[0];
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

      return res.json({ success: true, candles, isFallback: false, symbol: cleanSymbol, interval: cleanInterval });
    }

    // Fallback: Generate synthetic candles if live APIs fail/rate-limited/blocked
    console.warn(`Binance API unavailable (${lastErrorMsg}). Generating synthetic candles for ${cleanSymbol} (${cleanInterval}).`);
    const now = Date.now();
    let intervalMs = 15 * 60 * 1000;
    if (cleanInterval === '1m') intervalMs = 60 * 1000;
    else if (cleanInterval === '3m') intervalMs = 3 * 60 * 1000;
    else if (cleanInterval === '5m') intervalMs = 5 * 60 * 1000;
    else if (cleanInterval === '15m') intervalMs = 15 * 60 * 1000;
    else if (cleanInterval === '30m') intervalMs = 30 * 60 * 1000;
    else if (cleanInterval === '1h') intervalMs = 60 * 60 * 1000;
    else if (cleanInterval === '4h') intervalMs = 4 * 60 * 60 * 1000;
    else if (cleanInterval === '1d') intervalMs = 24 * 60 * 60 * 1000;

    let basePrice = 64000;
    if (cleanSymbol.includes('XAU') || cleanSymbol.includes('PAXG') || isGold) basePrice = 2950;
    else if (cleanSymbol.includes('ETH')) basePrice = 3400;
    else if (cleanSymbol.includes('SOL')) basePrice = 145;
    else if (cleanSymbol.includes('BNB')) basePrice = 580;
    else if (cleanSymbol.includes('XRP')) basePrice = 0.58;
    else if (cleanSymbol.includes('ADA')) basePrice = 0.38;

    const startTime = now - cleanLimit * intervalMs;
    let currentPrice = basePrice;
    const syntheticCandles = [];

    for (let i = 0; i < cleanLimit; i++) {
      const time = startTime + i * intervalMs;
      const change = (Math.random() - 0.48) * (basePrice * 0.006);
      const open = currentPrice;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * (basePrice * 0.003);
      const low = Math.min(open, close) - Math.random() * (basePrice * 0.003);
      const volume = Math.floor(Math.random() * 500) + 50;

      syntheticCandles.push({
        time,
        timeString: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        open: parseFloat(open.toFixed(4)),
        high: parseFloat(high.toFixed(4)),
        low: parseFloat(low.toFixed(4)),
        close: parseFloat(close.toFixed(4)),
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
        analysis: `**[Koneksi AI Terbatas]** Kunci API Gemini tidak terdeteksi di server. Berikut adalah rekomendasi rule-based berdasarkan strategi Box H4 (Lilin Ke-2) + Breakout & Re-entry 5M Candle Kuat:\n\n1. **Area Box H4**: Lilin ke-2 pada chart 4 Jam menjadi batas kritis (Key Zone).\n2. **Logika Breakout & Re-entry 5M**: Tunggu candle 5 Menit sempat breakout keluar dari kotak H4 (ke bawah untuk Buy, ke atas untuk Sell), lalu masuk kembali ke dalam kotak H4 dengan badan candle tebal (>= 50%, bukan wick tipis).\n3. **Manajemen Risiko**: Pasang Stop Loss di luar swing level breakout dengan rasio Risk-to-Reward minimal 1:2.`
      });
    }

    try {
      const { symbol, h4Box, activeSignal, latest5mAnalysis, trend } = req.body;

      const prompt = `
Anda adalah AI Quantitative Analyst & Professional Trader Copilot. Tugas Anda adalah menganalisis peluang pasar berdasarkan metode strategi:
**"Area Box Lilin H4 (Lilin Ke-2 dan Lilin Ke-3) pada Timeframe H4 + Logika Breakout Keluar Kotak H4 lalu Masuk Kembali dengan Lilin 5 Menit KUAT (Bukan Wick), dengan Target Take Profit pada Close Badan Lilin H4 ke-2 atau ke-3"**.

Berikut adalah data teknikal saat ini:
- **Aset (Ticker)**: ${symbol}
- **Tren H4**: ${trend || 'Netral'}
- **Data Box H4 (Lilin #2 & #3)**:
  ${JSON.stringify(h4Box || {}, null, 2)}
- **Kondisi Lilin 5M Terkini**:
  ${JSON.stringify(latest5mAnalysis || {}, null, 2)}
- **Sinyal Aktif Algoritma**:
  ${activeSignal ? JSON.stringify(activeSignal, null, 2) : "Sedang memantau siklus harga breakout keluar dan masuk kembali ke Box H4 Lilin #2 / Lilin #3."}

Buatlah laporan analisis taktis yang mendalam dan mudah dipahami dalam **Bahasa Indonesia**.

Format laporan dengan Markdown terstruktur:
1. **📦 Evaluasi Area Box H4 (Lilin #2 & #3)**:
   - **Box Lilin #2 (H4-2)** & **Box Lilin #3 (H4-3)**: High-Low rentang harga serta level Close Badan Lilin H4.
   - Jelaskan signifikansi box ini sebagai zona batas referensi utama.
2. **⚡ Analisis Breakout & Re-entry Lilin 5 Menit**: Evaluasi apakah harga 5M sempat breakout keluar dari Box H4 (bawah / atas) lalu berhasil masuk kembali dengan "Candle Kuat" (badan tebal >= 50%) atau hanya "Wick Tipis" (harus diabaikan).
3. **🎯 Rencana Eksekusi Trading**:
   - **Arah Posisi**: (BUY / SELL / WAIT)
   - **Harga Entri**: Kisaran harga ideal saat 5M re-entry
   - **Level Stop Loss**: Di luar swing breakout Box H4
   - **Target Take Profit Utama**: Tepat pada level **Close Badan Lilin H4** (Lilin #2 atau #3 sesuai acuan setup)
4. **🛡️ Manajemen Risiko**: Catatan disiplin trading dan pengamanan modal.
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
