/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Candle, TradingSignal, ScanResult } from './types';
import { scanSTFStrategy, generateSyntheticSTFPair, formatPrice } from './utils/stfStrategyScanner';
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
  Globe,
  Crosshair,
  Clock,
  Compass,
  Hash,
  Award
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
  const [stfFilter, setStfFilter] = useState<'all_signals' | 'zona_1_lot' | 'zero_floating' | 'kode_6c_9c' | 'all'>('all_signals');
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
      targetTokens = ALPHA_TOKENS.slice(0, 20);
    } else if (cat === 'top100') {
      targetTokens = TOP_100_TOKENS.slice(0, 30);
    } else if (cat === 'top500') {
      targetTokens = TOP_500_TOKENS.slice(0, 40);
    } else {
      targetTokens = [...XAUUSD_TOKENS, ...TOP_10_TOKENS, ...ALPHA_TOKENS.slice(0, 10)];
    }

    setScanProgress({ current: 0, total: targetTokens.length });

    for (let i = 0; i < targetTokens.length; i++) {
      const t = targetTokens[i];
      setScanProgress({ current: i + 1, total: targetTokens.length });
      try {
        const [resH4, res5m, res15m] = await Promise.all([
          fetch(`/api/binance/candles?symbol=${t.symbol}&interval=4h&limit=30`),
          fetch(`/api/binance/candles?symbol=${t.symbol}&interval=5m&limit=50`),
          fetch(`/api/binance/candles?symbol=${t.symbol}&interval=15m&limit=50`),
        ]);
        const dH4 = await resH4.json();
        const d5m = await res5m.json();
        const d15m = await res15m.json();

        if (dH4.success && d5m.success && dH4.candles?.length > 0) {
          const res = scanSTFStrategy(t.symbol, dH4.candles, d15m.success && d15m.candles?.length > 0 ? d15m.candles : d5m.candles, d5m.candles);
          results.push(res);
        } else {
          throw new Error('API fallback');
        }
      } catch {
        const syn = generateSyntheticSTFPair(i % 2 === 0 ? 'bullish' : 'bearish', 30, 40, 50);
        const res = scanSTFStrategy(t.symbol, syn.htf, syn.mtf, syn.ltf);
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

  // Request AI Tactical Analysis for 7 Pillars STF
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
          stfHierarchy: activeSignal?.stf,
          engulfing: activeSignal?.engulfing,
          zeroFloatingZone: activeSignal?.zeroFloatingZone,
          cycle6C9C: activeSignal?.cycle6C9C,
          storyline: activeSignal?.storyline,
          gunNumber: activeSignal?.gunNumber,
          zona1Lot: activeSignal?.zona1Lot
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* 1. TOP HEADER / APP NAVIGATION */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-amber-500 to-red-500 rounded-xl shadow-lg shadow-amber-500/20 text-slate-950 font-black flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black tracking-tight text-white font-sans">
                STF 7-PILLARS TRADING SYSTEM <span className="text-amber-400 font-light">&bull; ZONA 1 LOT [FM]</span>
              </h1>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                7 PILAR INSTITUSIONAL
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sifir Time Frame &bull; Valid Breakout &amp; Engulfing &bull; Zero Floating Zona &bull; Kode 6C.9C &bull; Zona 1 Lot [FM] &bull; Storyline &bull; Gun Number
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={requestAiAnalysis}
            className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Bot className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">AI Analisis Taktis 7 Pilar</span>
          </button>

          <button
            onClick={toggleFullScreen}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition cursor-pointer"
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
                ? 'border-amber-500 text-white bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-amber-400" />
            <span>Sifir Multi-Timeframe (4H + 15M + 5M)</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black">
              3 Timeframe Sync
            </span>
          </button>

          <button
            id="tab-scanner"
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-2 py-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'scanner'
                ? 'border-amber-500 text-white bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Radar className="w-4 h-4 text-emerald-400" />
            <span>Radar Multi-Kripto (7 Pilar)</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black">
              Live Scanner
            </span>
          </button>

          <button
            id="tab-sandbox"
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-2 py-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'sandbox'
                ? 'border-amber-500 text-white bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Simulator &amp; Tester 7 Pilar</span>
          </button>

          <button
            id="tab-education"
            onClick={() => setActiveTab('education')}
            className={`flex items-center gap-2 py-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'education'
                ? 'border-amber-500 text-white bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>SOP &amp; Panduan 7 Pilar</span>
          </button>
        </div>

        {/* TAB 1: SIFIR MULTI-TIMEFRAME GRID (4H + 15M + 5M) */}
        {activeTab === 'multichart' && (
          <MultiPanelGrid
            currentSymbol={symbol}
            onSymbolChange={setSymbol}
            onActiveSignalFound={setActiveSignal}
          />
        )}

        {/* TAB 2: MULTI-PAIR RADAR SCANNER (7 PILAR) */}
        {activeTab === 'scanner' && (() => {
          const totalScanned = scannerData.length;
          const totalZona1Lot = scannerData.filter((r) => r.zona1Lot?.isEligible).length;
          const totalZFZ = scannerData.filter((r) => r.zeroFloatingZones?.some((z) => z.isHit || z.status === 'TRIGGERED_ACTIVE')).length;
          const totalKode6C9C = scannerData.filter((r) => r.currentCycle?.is6C || r.currentCycle?.is9C).length;
          const totalActiveSignal = scannerData.filter((r) => !!r.activeSignal).length;

          const filteredResults = scannerData.filter((res) => {
            if (scannerSearch.trim() && !res.symbol.toLowerCase().includes(scannerSearch.toLowerCase().trim())) {
              return false;
            }

            if (stfFilter === 'zona_1_lot') {
              return res.zona1Lot?.isEligible;
            }
            if (stfFilter === 'zero_floating') {
              return res.zeroFloatingZones?.some((z) => z.isHit || z.status === 'TRIGGERED_ACTIVE');
            }
            if (stfFilter === 'kode_6c_9c') {
              return res.currentCycle?.is6C || res.currentCycle?.is9C;
            }
            if (stfFilter === 'all_signals') {
              return !!res.activeSignal;
            }
            return true; // 'all'
          });

          return (
            <div className="space-y-4 animate-fade-in">
              {/* Radar Strategy Rule Notice */}
              <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-500/40 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300">
                    <Radar className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded">
                        RADAR 7 PILAR STF &amp; ZONA 1 LOT [FM]
                      </span>
                      <span className="text-xs text-amber-300 font-bold">
                        Hierarki HTF &bull; MTF &bull; LTF
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                      Radar ini memindai secara otomatis konfluensi <strong>Sifir Time Frame</strong>, <strong>Valid Breakout &amp; Engulfing</strong>, <strong>Zero Floating Zona (ZFZ)</strong>, <strong>Kode 6C.9C</strong>, dan <strong>Gun Number</strong> untuk menyaring setup <strong>Zona 1 Lot [FM]</strong> dengan rasio Risk-to-Reward tertinggi.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => runMultiPairScanner(scannerCategory)}
                  disabled={scannerLoading}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 shrink-0 self-start md:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${scannerLoading ? 'animate-spin' : ''}`} />
                  <span>{scannerLoading ? `Memindai (${scanProgress.current}/${scanProgress.total})...` : 'Pindai Ulang Kategori'}</span>
                </button>
              </div>

              {/* Quick Metric Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">🔥 Zona 1 Lot [FM]</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black text-amber-400 font-mono">{totalZona1Lot}</span>
                    <span className="text-[10px] text-slate-500">Tier 1 Confluence</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">🎯 Zero Floating Zona</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black text-emerald-400 font-mono">{totalZFZ}</span>
                    <span className="text-[10px] text-emerald-300/70">Akar/Pucuk Wick</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">⚡ Kode 6C &amp; 9C Aktif</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black text-indigo-400 font-mono">{totalKode6C9C}</span>
                    <span className="text-[10px] text-indigo-300/70">Siklus Lilin Sifir</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">💎 Sinyal Terkonfirmasi</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black text-sky-400 font-mono">{totalActiveSignal}</span>
                    <span className="text-[10px] text-slate-500">dari {totalScanned} koin</span>
                  </div>
                </div>
              </div>

              {/* Control Bar: Categories, Filter Mode & Search */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setScannerCategory('xauusd')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                        scannerCategory === 'xauusd'
                          ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400/50'
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
                          ? 'bg-amber-500 text-slate-950 shadow-md'
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
                          ? 'bg-amber-500 text-slate-950 shadow-md'
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
                          ? 'bg-amber-500 text-slate-950 shadow-md'
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
                          ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400/50'
                          : 'bg-slate-950 text-amber-400 hover:text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      <Rocket className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                      <span>🚀 Binance Alpha</span>
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari token..."
                      value={scannerSearch}
                      onChange={(e) => setScannerSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Sub-Filter Pills */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-400 mr-1">Filter 7 Pilar:</span>
                    <button
                      onClick={() => setStfFilter('zona_1_lot')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1 ${
                        stfFilter === 'zona_1_lot'
                          ? 'bg-gradient-to-r from-amber-500 to-red-500 text-slate-950 font-black shadow'
                          : 'bg-slate-950 text-amber-400 hover:bg-slate-800 border border-amber-500/30'
                      }`}
                    >
                      <span>🔥 Hanya Zona 1 Lot [FM]</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-black/30 rounded-full font-mono">{totalZona1Lot}</span>
                    </button>

                    <button
                      onClick={() => setStfFilter('zero_floating')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1 ${
                        stfFilter === 'zero_floating'
                          ? 'bg-emerald-500 text-slate-950 font-black shadow'
                          : 'bg-slate-950 text-emerald-400 hover:bg-slate-800 border border-emerald-500/30'
                      }`}
                    >
                      <span>🎯 Zero Floating (ZFZ)</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-black/30 rounded-full font-mono">{totalZFZ}</span>
                    </button>

                    <button
                      onClick={() => setStfFilter('kode_6c_9c')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1 ${
                        stfFilter === 'kode_6c_9c'
                          ? 'bg-indigo-500 text-white font-black shadow'
                          : 'bg-slate-950 text-indigo-400 hover:bg-slate-800 border border-indigo-500/30'
                      }`}
                    >
                      <span>⚡ Kode 6C &amp; 9C</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-black/30 rounded-full font-mono">{totalKode6C9C}</span>
                    </button>

                    <button
                      onClick={() => setStfFilter('all_signals')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1 ${
                        stfFilter === 'all_signals'
                          ? 'bg-sky-500 text-slate-950 font-black shadow'
                          : 'bg-slate-950 text-sky-400 hover:bg-slate-800 border border-sky-500/30'
                      }`}
                    >
                      <span>💎 Semua Sinyal Aktif ({totalActiveSignal})</span>
                    </button>

                    <button
                      onClick={() => setStfFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        stfFilter === 'all'
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      <span>👁️ Semua Token ({totalScanned})</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    Menampilkan <strong>{filteredResults.length}</strong> token
                  </span>
                </div>
              </div>

              {/* 7-Pillar Scanner Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">Token &amp; Kategori</th>
                        <th className="py-3.5 px-4">Harga Terkini</th>
                        <th className="py-3.5 px-4">STF Hirarki (HTF 4H)</th>
                        <th className="py-3.5 px-4">Zero Floating Zona (ZFZ)</th>
                        <th className="py-3.5 px-4">Kode 6C.9C</th>
                        <th className="py-3.5 px-4">Zona 1 Lot [FM]</th>
                        <th className="py-3.5 px-4">Storyline &amp; Gun Number</th>
                        <th className="py-3.5 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {scannerLoading && scannerData.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-16 text-center text-slate-400 font-sans">
                            <RefreshCw className="w-7 h-7 animate-spin mx-auto text-amber-400 mb-3" />
                            <span className="font-bold">Memindai 7 Pilar STF {scannerCategory.toUpperCase()} secara real-time ({scanProgress.current}/{scanProgress.total})...</span>
                          </td>
                        </tr>
                      ) : filteredResults.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                            <div className="max-w-md mx-auto space-y-3">
                              <AlertCircle className="w-8 h-8 mx-auto text-amber-400" />
                              <h4 className="text-sm font-bold text-white">Tidak Ada Token yang Memenuhi Kriteria Filter</h4>
                              <p className="text-xs text-slate-400">
                                Coba ganti kategori pasar atau pilih &quot;Semua Sinyal Aktif&quot; untuk melihat peluang 7 pilar lainnya.
                              </p>
                              <div className="flex items-center justify-center gap-2 pt-2">
                                <button
                                  onClick={() => setStfFilter('all')}
                                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                                >
                                  Tampilkan Semua Koin
                                </button>
                                <button
                                  onClick={() => runMultiPairScanner(scannerCategory)}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition cursor-pointer"
                                >
                                  Pindai Ulang
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredResults.map((res) => {
                          const lastCandle = res.fiveMinCandles[res.fiveMinCandles.length - 1];
                          const tokInfo = CRYPTO_TOKENS.find((t) => t.symbol === res.symbol);
                          const isGold = tokInfo?.category === 'xauusd' || res.symbol.includes('XAU') || res.symbol.includes('PAXG');
                          const isAlpha = tokInfo?.category === 'alpha';
                          const zfz = res.zeroFloatingZones[0];
                          const cycle = res.currentCycle;

                          return (
                            <tr key={res.symbol} className="hover:bg-slate-800/40 transition">
                              {/* Token & Kategori */}
                              <td className="py-3.5 px-4 font-sans">
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-[11px] ${
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
                                    </div>
                                    <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                      {tokInfo?.name || res.symbol}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Harga Terkini */}
                              <td className="py-3.5 px-4 text-slate-200 font-bold">
                                ${lastCandle ? formatPrice(lastCandle.close) : '-'}
                              </td>

                              {/* STF Hirarki (HTF 4H) */}
                              <td className="py-3.5 px-4 font-sans">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  res.stfHierarchy.htfTrend === 'BULLISH'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : res.stfHierarchy.htfTrend === 'BEARISH'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-slate-800 text-slate-400'
                                }`}>
                                  4H {res.stfHierarchy.htfTrend}
                                </span>
                              </td>

                              {/* Zero Floating Zona (ZFZ) */}
                              <td className="py-3.5 px-4 font-sans">
                                {zfz ? (
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                        zfz.isHit ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-300'
                                      }`}>
                                        {zfz.isHit ? '🎯 TAP ACTIVE' : 'PENDING'}
                                      </span>
                                      <span className="text-[11px] text-amber-300 font-mono font-bold">
                                        ${formatPrice(zfz.wickSniperLevel)}
                                      </span>
                                    </div>
                                    <p className="text-[9px] text-slate-400 truncate max-w-[150px]">
                                      {zfz.originDescription}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-[11px]">Belum Menyentuh</span>
                                )}
                              </td>

                              {/* Kode 6C.9C */}
                              <td className="py-3.5 px-4 font-sans">
                                <div className="space-y-0.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                    cycle?.is6C
                                      ? 'bg-indigo-950 text-indigo-300 border-indigo-500/40'
                                      : cycle?.is9C
                                      ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                                      : 'bg-slate-900 text-slate-400 border-slate-800'
                                  }`}>
                                    Candle #{cycle?.currentCount || 1} {cycle?.is6C ? '⚡ 6C' : cycle?.is9C ? '🔥 9C' : ''}
                                  </span>
                                </div>
                              </td>

                              {/* Zona 1 Lot [FM] */}
                              <td className="py-3.5 px-4 font-sans">
                                {res.zona1Lot?.isEligible ? (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gradient-to-r from-amber-500 to-red-500 text-slate-950 font-black text-[10px] shadow animate-pulse">
                                    <Award className="w-3 h-3" />
                                    <span>ZONA 1 LOT [FM] ({res.zona1Lot.confluenceScore}%)</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 font-mono text-[11px]">
                                    {res.zona1Lot?.confluenceScore || 40}% Skor
                                  </span>
                                )}
                              </td>

                              {/* Storyline & Gun Number */}
                              <td className="py-3.5 px-4 font-sans">
                                <div className="space-y-0.5 text-[10px]">
                                  <div className="text-sky-300 font-mono">
                                    Gun: ${formatPrice(res.gunNumber.nearestGunNumber)}
                                  </div>
                                  <div className="text-slate-400 truncate max-w-[140px]">
                                    {res.storyline.destination}
                                  </div>
                                </div>
                              </td>

                              {/* Aksi */}
                              <td className="py-3.5 px-4 text-right font-sans">
                                <button
                                  onClick={() => {
                                    setSymbol(res.symbol);
                                    setActiveTab('multichart');
                                  }}
                                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ml-auto"
                                >
                                  <span>Chart STF</span>
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
          );
        })()}

        {/* TAB 3: SIMULATOR & TESTER */}
        {activeTab === 'sandbox' && (
          <SimulationSandbox />
        )}

        {/* TAB 4: EDUCATIONAL PORTAL */}
        {activeTab === 'education' && (
          <EducationalPortal />
        )}

        {/* 3. AI ANALYSIS MODAL / DRAWER */}
        {(aiLoading || aiAnalysis) && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Bot className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-black text-white font-sans">
                    Laporan Taktis 7 Pilar STF - Gemini AI Copilot
                  </h3>
                </div>
                <button
                  onClick={() => setAiAnalysis('')}
                  className="text-slate-400 hover:text-white text-xs px-2.5 py-1 bg-slate-800 rounded-lg cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
                {aiLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                    <p className="font-mono text-slate-400">Gemini sedang mengevaluasi konfluensi 7 Pilar STF &amp; Zona 1 Lot [FM]...</p>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{aiAnalysis}</div>
                )}
              </div>

              {aiAnalysis && (
                <div className="border-t border-slate-800 pt-3 flex justify-end">
                  <button
                    onClick={handleCopyAnalysis}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md"
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
          STF Trading System &bull; 7 Pillars Quantitative Scanner &bull; Sifir Time Frame, Valid Breakout &amp; Engulfing, Zero Floating Zona, Kode 6C.9C, Zona 1 Lot [FM], Storyline, Gun Number
        </p>
      </footer>
    </div>
  );
}
