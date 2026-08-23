/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Candle, H4Box, TradingSignal, ScanResult } from './types';
import { scanH4BoxAnd5m, generateMockPair } from './utils/h4BoxScanner';
import { CRYPTO_TOKENS, XAUUSD_TOKENS, TOP_10_TOKENS, TOP_100_TOKENS, TOP_500_TOKENS, ALPHA_TOKENS, TokenInfo } from './data/cryptoTokens';
import MultiPanelGrid from './components/MultiPanelGrid';
import SimulationSandbox from './components/SimulationSandbox';
import EducationalPortal from './components/EducationalPortal';
import { 
  LayoutGrid, 
  Radar, 
  Sparkles, 
  BookOpen, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Maximize2, 
  Minimize2, 
  Bot, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Flame, 
  ArrowRight, 
  Rocket, 
  Star, 
  Zap, 
  Search,
  Coins,
  Globe
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'multichart' | 'scanner' | 'sandbox' | 'education'>('multichart');
  const [symbol, setSymbol] = useState<string>('BTCUSDT');
  const [activeSignal, setActiveSignal] = useState<TradingSignal | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // AI Assistant states
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Multi-Pair Radar Scanner States
  const [scannerCategory, setScannerCategory] = useState<'xauusd' | 'top10' | 'top100' | 'top500' | 'alpha' | 'all'>('top10');
  const [scannerSearch, setScannerSearch] = useState<string>('');
  const [scannerData, setScannerData] = useState<ScanResult[]>([]);
  const [scannerLoading, setScannerLoading] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  const runMultiPairScanner = async (cat = scannerCategory) => {
    setScannerLoading(true);
    const results: ScanResult[] = [];

    let targetTokens: TokenInfo[] = [];
    if (cat === 'xauusd') {
      targetTokens = XAUUSD_TOKENS;
    } else if (cat === 'top10') {
      targetTokens = TOP_10_TOKENS;
    } else if (cat === 'alpha') {
      targetTokens = ALPHA_TOKENS.slice(0, 20); // Top 20 Binance Alpha Gems
    } else if (cat === 'top100') {
      targetTokens = TOP_100_TOKENS.slice(0, 30); // Top 30 of Top 100 for fast responsiveness
    } else if (cat === 'top500') {
      targetTokens = TOP_500_TOKENS.slice(0, 40); // Active coins from Top 500 pool
    } else {
      targetTokens = [...XAUUSD_TOKENS, ...TOP_10_TOKENS, ...ALPHA_TOKENS.slice(0, 10)];
    }

    setScanProgress({ current: 0, total: targetTokens.length });

    for (let i = 0; i < targetTokens.length; i++) {
      const t = targetTokens[i];
      setScanProgress({ current: i + 1, total: targetTokens.length });
      try {
        const [resH4, res5m] = await Promise.all([
          fetch(`/api/binance/candles?symbol=${t.symbol}&interval=4h&limit=30`),
          fetch(`/api/binance/candles?symbol=${t.symbol}&interval=5m&limit=50`),
        ]);
        const dH4 = await resH4.json();
        const d5m = await res5m.json();

        if (dH4.success && d5m.success && dH4.candles?.length > 0) {
          const res = scanH4BoxAnd5m(t.symbol, dH4.candles, d5m.candles);
          results.push(res);
        } else {
          throw new Error('API fallback');
        }
      } catch {
        const mock = generateMockPair(t.symbol.includes('BTC') || t.symbol.includes('NEIRO') ? 'buy_retest' : 'neutral', 30, 50);
        const res = scanH4BoxAnd5m(t.symbol, mock.h4, mock.fiveM);
        results.push(res);
      }
    }

    setScannerData(results);
    setScannerLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'scanner') {
      runMultiPairScanner(scannerCategory);
    }
  }, [activeTab, scannerCategory]);

  // Fullscreen Handler
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch((err) => console.error(err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Request AI Tactical Analysis
  const requestAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis('');

    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          activeSignal,
          h4Box: activeSignal?.h4Box,
          latest5mAnalysis: activeSignal ? { isStrong: true, bodyRatio: activeSignal.bodyRatioPercent / 100 } : null,
          trend: 'neutral',
        }),
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        setAiAnalysis('Gagal memperoleh analisis dari server AI.');
      }
    } catch {
      setAiAnalysis('Terjadi kesalahan saat memanggil asisten AI. Silakan coba kembali.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyAnalysis = () => {
    navigator.clipboard.writeText(aiAnalysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* 1. TOP HEADER / APP NAVIGATION */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30 text-white flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black tracking-tight text-white font-sans">
                H4 BOX & 5M CANDLE KUAT <span className="text-indigo-400 font-light">SCANNER</span>
              </h1>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                STRATEGI REAL-TIME
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Metode Kotak Lilin H4 (Lilin Ke-2) dengan Konfirmasi Re-entry Lilin 5 Menit Kuat (Bukan Wick)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={requestAiAnalysis}
            className="px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Bot className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">AI Analisis Taktis</span>
          </button>

          <button
            onClick={toggleFullScreen}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition cursor-pointer"
            title="Layar Penuh"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-5">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-800 flex flex-wrap gap-2">
          <button
            id="tab-multichart"
            onClick={() => setActiveTab('multichart')}
            className={`flex items-center gap-2 py-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'multichart'
                ? 'border-indigo-500 text-white bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-indigo-400" />
            <span>Grafik Dual Timeframe (4H + 5M)</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-black">
              2 Panel
            </span>
          </button>

          <button
            id="tab-scanner"
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-2 py-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'scanner'
                ? 'border-indigo-500 text-white bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Radar className="w-4 h-4 text-emerald-400" />
            <span>Radar Multi-Kripto</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black">
              Live Scanner
            </span>
          </button>

          <button
            id="tab-sandbox"
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-2 py-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'sandbox'
                ? 'border-indigo-500 text-white bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Simulator & Tester Lilin 5M</span>
          </button>

          <button
            id="tab-education"
            onClick={() => setActiveTab('education')}
            className={`flex items-center gap-2 py-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'education'
                ? 'border-indigo-500 text-white bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Panduan & SOP Strategi</span>
          </button>
        </div>

        {/* TAB 1: DUAL TIMEFRAME GRID (4H & 5M) */}
        {activeTab === 'multichart' && (
          <MultiPanelGrid
            currentSymbol={symbol}
            onSymbolChange={setSymbol}
            onActiveSignalFound={setActiveSignal}
          />
        )}

        {/* TAB 2: MULTI-PAIR RADAR SCANNER */}
        {activeTab === 'scanner' && (
          <div className="space-y-4 animate-fade-in">
            {/* Control Bar with Category Tabs & Search */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Radar className="w-4 h-4 text-emerald-400" />
                    <span>Radar Pemindai Otomatis: Top 10, Top 100 & Binance Alpha Tokens</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Memindai Box H4 (Lilin #2 & #3), Midline 50%, dan konfirmasi candle kuat 5 menit secara real-time.
                  </p>
                </div>

                <button
                  onClick={() => runMultiPairScanner(scannerCategory)}
                  disabled={scannerLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${scannerLoading ? 'animate-spin' : ''}`} />
                  <span>{scannerLoading ? `Memindai (${scanProgress.current}/${scanProgress.total})...` : 'Pindai Kategori Ini'}</span>
                </button>
              </div>

              {/* Category Pills & Search */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setScannerCategory('xauusd')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                      scannerCategory === 'xauusd'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400/50'
                        : 'bg-slate-950 text-amber-400 hover:text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>🏆 Gold (XAU/USD)</span>
                  </button>

                  <button
                    onClick={() => setScannerCategory('top10')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                      scannerCategory === 'top10'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>⚡ Top 10 Pairs</span>
                  </button>

                  <button
                    onClick={() => setScannerCategory('top100')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                      scannerCategory === 'top100'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 text-blue-400" />
                    <span>💎 Top 100 Cryptos</span>
                  </button>

                  <button
                    onClick={() => setScannerCategory('top500')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                      scannerCategory === 'top500'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>🌐 Top 100 - 500</span>
                  </button>

                  <button
                    onClick={() => setScannerCategory('alpha')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                      scannerCategory === 'alpha'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400/50'
                        : 'bg-slate-950 text-amber-400 hover:text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    <Rocket className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                    <span>🚀 Binance Alpha</span>
                  </button>

                  <button
                    onClick={() => setScannerCategory('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                      scannerCategory === 'all'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                    <span>✨ Semua Pasar</span>
                  </button>
                </div>

                {/* Table Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari token di tabel..."
                    value={scannerSearch}
                    onChange={(e) => setScannerSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Scanner Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Token & Kategori</th>
                      <th className="py-3.5 px-4">Harga Terkini</th>
                      <th className="py-3.5 px-4">Box H4 Lilin #2</th>
                      <th className="py-3.5 px-4">Box H4 Lilin #3</th>
                      <th className="py-3.5 px-4">Kondisi Lilin 5M</th>
                      <th className="py-3.5 px-4">Status Sinyal & TP (Close H4)</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {scannerLoading && scannerData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-400 font-sans">
                          <RefreshCw className="w-7 h-7 animate-spin mx-auto text-indigo-400 mb-3" />
                          <span className="font-bold">Memindai pasangan {scannerCategory.toUpperCase()} secara real-time ({scanProgress.current}/{scanProgress.total})...</span>
                        </td>
                      </tr>
                    ) : (
                      scannerData
                        .filter((res) => {
                          if (!scannerSearch.trim()) return true;
                          return res.symbol.toLowerCase().includes(scannerSearch.toLowerCase().trim());
                        })
                        .map((res) => {
                          const sig2 = res.signalBox2;
                          const sig3 = res.signalBox3;
                          const anySig = sig2 || sig3 || res.activeSignal;
                          const l5m = res.latest5mAnalysis;
                          const lastCandle = res.fiveMinCandles[res.fiveMinCandles.length - 1];
                          const tokInfo = CRYPTO_TOKENS.find((t) => t.symbol === res.symbol);
                          const isGold = tokInfo?.category === 'xauusd' || res.symbol.includes('XAU') || res.symbol.includes('PAXG');
                          const isAlpha = tokInfo?.category === 'alpha';

                          return (
                            <tr key={res.symbol} className="hover:bg-slate-800/40 transition">
                              <td className="py-3.5 px-4 font-sans">
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[11px] ${
                                    isGold
                                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                                      : isAlpha 
                                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30' 
                                      : 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30'
                                  }`}>
                                    {isGold ? <Coins className="w-3.5 h-3.5 text-slate-950" /> : tokInfo?.rank ? `#${tokInfo.rank}` : <Rocket className="w-3.5 h-3.5 text-amber-400" />}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`font-black text-xs ${isGold ? 'text-amber-300' : 'text-slate-100'}`}>
                                        {res.symbol === 'XAUUSD' ? 'XAU/USD' : tokInfo?.base || res.symbol.replace('USDT', '')}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        {res.symbol === 'XAUUSD' ? '(Gold)' : '/USDT'}
                                      </span>
                                      {isGold && (
                                        <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-black">
                                          GOLD
                                        </span>
                                      )}
                                      {isAlpha && (
                                        <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-black">
                                          ALPHA
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                      {tokInfo?.name || res.symbol}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-slate-200 font-bold">
                                ${lastCandle ? lastCandle.close.toLocaleString() : '-'}
                              </td>

                              <td className="py-3.5 px-4">
                                {res.h4Box?.box2 ? (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 bg-indigo-950/70 border border-indigo-800/80 px-2 py-0.5 rounded text-indigo-300 font-mono font-medium text-[11px]">
                                      ${res.h4Box.box2.bottom.toFixed(1)} - ${res.h4Box.box2.top.toFixed(1)}
                                    </span>
                                    <span className="block text-[10px] text-indigo-400 font-mono">
                                      Mid: ${((res.h4Box.box2.top + res.h4Box.box2.bottom) / 2).toFixed(1)}
                                    </span>
                                  </div>
                                ) : '-'}
                              </td>

                              <td className="py-3.5 px-4">
                                {res.h4Box?.box3 ? (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 bg-purple-950/70 border border-purple-800/80 px-2 py-0.5 rounded text-purple-300 font-mono font-medium text-[11px]">
                                      ${res.h4Box.box3.bottom.toFixed(1)} - ${res.h4Box.box3.top.toFixed(1)}
                                    </span>
                                    <span className="block text-[10px] text-purple-400 font-mono">
                                      Mid: ${((res.h4Box.box3.top + res.h4Box.box3.bottom) / 2).toFixed(1)}
                                    </span>
                                  </div>
                                ) : '-'}
                              </td>

                              <td className="py-3.5 px-4 font-sans">
                                {l5m ? (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                                    l5m.isStrong ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-950 text-slate-400'
                                  }`}>
                                    {l5m.isStrong ? `🔥 ${(l5m.bodyRatio * 100).toFixed(0)}% Body` : `Wick (${(l5m.bodyRatio * 100).toFixed(0)}%)`}
                                  </span>
                                ) : '-'}
                              </td>

                              <td className="py-3.5 px-4 font-sans">
                                {anySig ? (
                                  <div className="space-y-1">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                                      anySig.type === 'BUY'
                                        ? 'bg-emerald-500 text-slate-950 animate-pulse'
                                        : 'bg-rose-500 text-white animate-pulse'
                                    }`}>
                                      ⚡ {anySig.type} (Box #{anySig.targetBoxNumber || (sig3 ? 3 : 2)})
                                    </span>
                                    <span className="block text-[10px] text-emerald-400 font-mono">
                                      TP Close H4: ${anySig.takeProfit1.toFixed(2)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-xs">
                                    Standby Pemantauan
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-right font-sans">
                                <button
                                  onClick={() => {
                                    setSymbol(res.symbol);
                                    setActiveTab('multichart');
                                  }}
                                  className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ml-auto"
                                >
                                  <span>Buka 3 Chart</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SIMULATOR & TESTER */}
        {activeTab === 'sandbox' && (
          <SimulationSandbox />
        )}

        {/* TAB 4: EDUCATIONAL PORTAL */}
        {activeTab === 'education' && (
          <EducationalPortal />
        )}

        {/* 3. AI ANALYSIS MODAL / DRAWER (If requested) */}
        {(aiLoading || aiAnalysis) && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Bot className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-black text-white font-sans">
                    Laporan Analisis Taktis Gemini AI
                  </h3>
                </div>
                <button
                  onClick={() => setAiAnalysis('')}
                  className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
                {aiLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                    <p className="font-mono text-slate-400">Gemini sedang mengevaluasi interaksi Lilin 5M & Box H4...</p>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{aiAnalysis}</div>
                )}
              </div>

              {aiAnalysis && (
                <div className="border-t border-slate-800 pt-3 flex justify-end">
                  <button
                    onClick={handleCopyAnalysis}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin Laporan'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 4. FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 px-6 text-center text-xs text-slate-500 font-sans">
        <p>
          H4 Box & 5M Strong Candle Retest System &bull; Pemindaian Otomatis Multi-Timeframe Kripto Real-Time
        </p>
      </footer>
    </div>
  );
}
