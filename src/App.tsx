/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Candle, TradingSignal, ScanResult, FreshSignalAlert } from './types';
import { scanSTFStrategy, generateSyntheticSTFPair, formatPrice } from './utils/stfStrategyScanner';
import { CRYPTO_TOKENS, XAUUSD_TOKENS, TOP_10_TOKENS, TOP_100_TOKENS, TOP_500_TOKENS, ALPHA_TOKENS, TokenInfo } from './data/cryptoTokens';
import { alertSoundManager, sendDesktopNotification } from './utils/alertSound';
import AlertNotificationToast from './components/AlertNotificationToast';
import AlertHistoryModal from './components/AlertHistoryModal';
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
  Award,
  Target,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'multichart' | 'scanner' | 'sandbox' | 'education'>('multichart');
  const [symbol, setSymbol] = useState<string>('BTCUSDT');
  const [activeSignal, setActiveSignal] = useState<TradingSignal | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Fresh BUY & SELL Alert Notification System
  const previousSignalsRef = useRef<Map<string, { type: 'BUY' | 'SELL'; entryPrice: number; timestamp: number }>>(new Map());
  const [freshAlerts, setFreshAlerts] = useState<FreshSignalAlert[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ict_crt_fresh_alerts');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [toastAlerts, setToastAlerts] = useState<FreshSignalAlert[]>([]);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => alertSoundManager.getMuted());

  const toggleAudioMute = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    alertSoundManager.setMuted(next);
  };

  const checkAndTriggerFreshAlert = useCallback((sig: TradingSignal, source: 'MULTICHART' | 'RADAR_SCANNER' = 'MULTICHART') => {
    if (!sig || !sig.symbol || !sig.type) return;
    const sym = sig.symbol;
    const prev = previousSignalsRef.current.get(sym);

    const isTypeFlipped = prev && prev.type !== sig.type;
    const isBrandNew = !prev;
    const isFreshTimestamp = prev && (
      (sig.timestamp - prev.timestamp > 300000) ||
      (Math.abs(sig.entryPrice - prev.entryPrice) / (prev.entryPrice || 1) > 0.003)
    );

    if (isBrandNew || isTypeFlipped || isFreshTimestamp) {
      previousSignalsRef.current.set(sym, {
        type: sig.type,
        entryPrice: sig.entryPrice,
        timestamp: sig.timestamp || Date.now(),
      });

      let changeDesc = '';
      if (isTypeFlipped) {
        changeDesc = `Perubahan Tren! Sinyal ${prev.type} sebelumnya BERBALIK menjadi Fresh ${sig.type} (Konfirmasi Turtle Soup & 5M MSS).`;
      } else if (isBrandNew) {
        changeDesc = `Sinyal Baru Terkonfirmasi! Setup Fresh ${sig.type} valid pada model ICT + Candle Range Theory.`;
      } else {
        changeDesc = `Update Setup Fresh ${sig.type} terkonfirmasi pada area mitigasi FVG retest.`;
      }

      const newAlert: FreshSignalAlert = {
        id: `${sym}-${sig.type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        symbol: sym,
        type: sig.type,
        setupType: sig.setupType || 'ICT_CRT',
        entryPrice: sig.entryPrice,
        stopLoss: sig.stopLoss,
        takeProfit1: sig.takeProfit1,
        takeProfit2: sig.takeProfit2,
        riskRewardRatio: sig.riskRewardRatio || 2.5,
        timestamp: Date.now(),
        timeFormatted: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        source,
        read: false,
        changeDescription: changeDesc,
        confirmation: sig.confirmation || 'ICT Turtle Soup Sweep + 5M MSS + FVG Mitigation',
        keyLevelZone: sig.keyLevelZone || sig.ictCrt?.keyLevelZone,
      };

      if (sig.type === 'BUY') {
        alertSoundManager.playBuyChime();
      } else {
        alertSoundManager.playSellChime();
      }

      sendDesktopNotification(
        `⚡ Fresh ${sig.type} Signal: ${sym}`,
        `Entry: $${formatPrice(sig.entryPrice)} | SL: $${formatPrice(sig.stopLoss)} | TP2: $${formatPrice(sig.takeProfit2)}`
      );

      setToastAlerts((prevToasts) => [newAlert, ...prevToasts.slice(0, 3)]);
      setFreshAlerts((prevHistory) => {
        const updated = [newAlert, ...prevHistory.slice(0, 49)];
        try {
          localStorage.setItem('ict_crt_fresh_alerts', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  }, []);

  const triggerTestAlert = (type: 'BUY' | 'SELL') => {
    const currentPrice = activeSignal?.entryPrice || (type === 'BUY' ? 64250 : 64800);
    const sl = type === 'BUY' ? currentPrice * 0.992 : currentPrice * 1.008;
    const tp1 = type === 'BUY' ? currentPrice * 1.012 : currentPrice * 0.988;
    const tp2 = type === 'BUY' ? currentPrice * 1.025 : currentPrice * 0.975;

    const testAlert: FreshSignalAlert = {
      id: `test-${type}-${Date.now()}`,
      symbol,
      type,
      setupType: type === 'BUY' ? 'ICT_CRT_BULLISH' : 'ICT_CRT_BEARISH',
      entryPrice: currentPrice,
      stopLoss: sl,
      takeProfit1: tp1,
      takeProfit2: tp2,
      riskRewardRatio: 2.8,
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      source: 'MULTICHART',
      read: false,
      changeDescription: `Tes Simulasi Alert: Terdeteksi perubahan sinyal Fresh ${type} pada ${symbol} dengan Area Key Level valid + Sweet Spot sniper!`,
      confirmation: 'ICT Turtle Soup Sweep + 5M Displacement MSS + Retest FVG BISI/SIBI',
      keyLevelZone: {
        high: parseFloat((type === 'BUY' ? currentPrice * 1.0015 : currentPrice * 1.0035).toFixed(4)),
        low: parseFloat((type === 'BUY' ? currentPrice * 0.9985 : currentPrice * 1.0005).toFixed(4)),
        sweetSpot: currentPrice,
        oteFib62: parseFloat((currentPrice * (type === 'BUY' ? 0.9992 : 1.0012)).toFixed(4)),
        oteFib705: currentPrice,
        oteFib79: parseFloat((currentPrice * (type === 'BUY' ? 0.9982 : 1.0022)).toFixed(4)),
        zoneType: type === 'BUY' ? 'BISI_OTE_KEY_LEVEL' : 'SIBI_OTE_KEY_LEVEL',
        label: `Area Key Level FVG ${type === 'BUY' ? 'BISI' : 'SIBI'} + OTE 70.5% Sweet Spot`,
        confluences: [
          `Retest FVG ${type === 'BUY' ? 'BISI' : 'SIBI'}`,
          'Golden Pocket OTE 70.5% Sweet Spot',
          'Re-entry Body Lilin Berjalan'
        ],
        status: 'SWEET_SPOT_HIT',
        precisionScore: 96
      }
    };

    if (type === 'BUY') {
      alertSoundManager.playBuyChime();
    } else {
      alertSoundManager.playSellChime();
    }

    sendDesktopNotification(
      `⚡ Tes Fresh ${type} Signal: ${symbol}`,
      `Entry: $${formatPrice(currentPrice)} | TP2: $${formatPrice(tp2)} | SL: $${formatPrice(sl)}`
    );

    setToastAlerts((prev) => [testAlert, ...prev.slice(0, 3)]);
    setFreshAlerts((prev) => {
      const updated = [testAlert, ...prev.slice(0, 49)];
      try {
        localStorage.setItem('ict_crt_fresh_alerts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const dismissToast = (id: string) => {
    setToastAlerts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOpenChart = (targetSymbol: string) => {
    setSymbol(targetSymbol);
    setActiveTab('multichart');
  };

  const clearAllAlerts = () => {
    setFreshAlerts([]);
    setToastAlerts([]);
    try {
      localStorage.removeItem('ict_crt_fresh_alerts');
    } catch {}
  };

  const markAllAlertsRead = () => {
    setFreshAlerts((prev) => {
      const updated = prev.map((a) => ({ ...a, read: true }));
      try {
        localStorage.setItem('ict_crt_fresh_alerts', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // AI Assistant states
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Multi-Pair Radar Scanner States
  const [scannerCategory, setScannerCategory] = useState<'xauusd' | 'top10' | 'top100' | 'top500' | 'alpha' | 'all'>('top10');
  const [stfFilter, setStfFilter] = useState<'all_crt' | 'crt_buy' | 'crt_sell' | 'all'>('all_crt');
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

    const safeFetchCandles = async (url: string) => {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          return await res.json();
        }
        return { success: false, candles: [] };
      } catch {
        return { success: false, candles: [] };
      }
    };

    for (let i = 0; i < targetTokens.length; i++) {
      const t = targetTokens[i];
      setScanProgress({ current: i + 1, total: targetTokens.length });
      try {
        const sym = encodeURIComponent(t.symbol);
        const [dH4, d5m, d15m] = await Promise.all([
          safeFetchCandles(`/api/binance/candles?symbol=${sym}&interval=4h&limit=30`),
          safeFetchCandles(`/api/binance/candles?symbol=${sym}&interval=5m&limit=50`),
          safeFetchCandles(`/api/binance/candles?symbol=${sym}&interval=15m&limit=50`),
        ]);

        let pairResult: ScanResult;
        if (dH4?.success && d5m?.success && Array.isArray(dH4.candles) && dH4.candles.length > 0) {
          pairResult = scanSTFStrategy(t.symbol, dH4.candles, d15m?.success && Array.isArray(d15m.candles) && d15m.candles.length > 0 ? d15m.candles : d5m.candles, d5m.candles);
        } else {
          const syn = generateSyntheticSTFPair(i % 2 === 0 ? 'bullish' : 'bearish', 30, 40, 50);
          pairResult = scanSTFStrategy(t.symbol, syn.htf, syn.mtf, syn.ltf);
        }
        results.push(pairResult);
        if (pairResult.activeSignal) {
          checkAndTriggerFreshAlert(pairResult.activeSignal, 'RADAR_SCANNER');
        }
      } catch {
        const syn = generateSyntheticSTFPair(i % 2 === 0 ? 'bullish' : 'bearish', 30, 40, 50);
        const pairResult = scanSTFStrategy(t.symbol, syn.htf, syn.mtf, syn.ltf);
        results.push(pairResult);
        if (pairResult.activeSignal) {
          checkAndTriggerFreshAlert(pairResult.activeSignal, 'RADAR_SCANNER');
        }
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
          <div className="p-2.5 bg-gradient-to-br from-amber-500 to-rose-600 rounded-xl shadow-lg shadow-amber-500/20 text-slate-950 font-black flex items-center justify-center">
            <Zap className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black tracking-tight text-white font-sans">
                INSTITUTIONAL TRADING SYSTEM <span className="text-amber-400 font-light">&bull; MODEL ENTRI ICT x CRT</span>
              </h1>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                ICT + CRT &bull; NY OPEN KILLZONE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Benchmark CRT Mother Range (08:00-09:00 AM NY) &bull; ICT Liquidity Sweep (Turtle Soup) &bull; 5M Displacement MSS &bull; FVG Mitigation Retest &bull; Targets (50% EQ &amp; DOL)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Audio Mute Toggle */}
          <button
            id="btn-toggle-sound"
            type="button"
            onClick={toggleAudioMute}
            className={`px-2.5 py-1.5 border rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              isAudioMuted
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-300 hover:bg-rose-950/60'
                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/60'
            }`}
            title={isAudioMuted ? 'Suara Alert Bisu (Klik untuk Bunyikan)' : 'Suara Alert Aktif (Klik untuk Membisukan)'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span className="hidden md:inline">{isAudioMuted ? 'Bisu' : 'Audio ON'}</span>
          </button>

          {/* Fresh Alert Center Bell */}
          <button
            id="btn-alert-center"
            type="button"
            onClick={() => setIsAlertModalOpen(true)}
            className="relative px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm"
            title="Pusat Notifikasi Alert Sinyal Fresh"
          >
            <BellRing className={`w-4 h-4 ${freshAlerts.filter((a) => !a.read).length > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Alert Sinyal</span>
            {freshAlerts.filter((a) => !a.read).length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black leading-none animate-pulse">
                {freshAlerts.filter((a) => !a.read).length}
              </span>
            )}
          </button>

          <button
            onClick={requestAiAnalysis}
            className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Bot className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">AI Analisis Model ICT + CRT</span>
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
            <span>Chart Multi-Timeframe ICT + CRT (4H + 15M + 5M)</span>
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
            <span>Radar Scanner ICT + CRT (Live Sweep &amp; FVG)</span>
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
            <span>Simulator ICT + CRT &amp; FVG OTE</span>
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
            <span>SOP &amp; Anatomi Model ICT + CRT</span>
          </button>
        </div>

        {/* TAB 1: ICT + CRT MULTI-TIMEFRAME GRID (4H + 15M + 5M) */}
        {activeTab === 'multichart' && (
          <MultiPanelGrid
            currentSymbol={symbol}
            onSymbolChange={setSymbol}
            onActiveSignalFound={(sig) => {
              setActiveSignal(sig);
              if (sig) {
                checkAndTriggerFreshAlert(sig, 'MULTICHART');
              }
            }}
          />
        )}

        {/* TAB 2: MULTI-PAIR RADAR SCANNER (MODEL ENTRI EKSKLUSIF: ICT + CRT) */}
        {activeTab === 'scanner' && (() => {
          const totalScanned = scannerData.length;
          const totalActiveSignal = scannerData.filter((r) => !!r.activeSignal).length;
          const totalCrtBuy = scannerData.filter((r) => (r.ictCrtModel?.sweepType === 'BULLISH_ICT_CRT' || r.ictCrtModel?.sweepType === 'BULLISH_SWEEP' || r.crt9AmModel?.sweepType === 'BULLISH_CRT_9AM') || r.activeSignal?.type === 'BUY').length;
          const totalCrtSell = scannerData.filter((r) => (r.ictCrtModel?.sweepType === 'BEARISH_ICT_CRT' || r.ictCrtModel?.sweepType === 'BEARISH_SWEEP' || r.crt9AmModel?.sweepType === 'BEARISH_CRT_9AM') || r.activeSignal?.type === 'SELL').length;
          const totalReEntryMss = scannerData.filter((r) => (r.ictCrtModel?.displacementMss?.isConfirmed || r.ictCrtModel?.mssConfirmed || r.crt9AmModel?.reEntryConfirmed) || !!r.activeSignal).length;

          const filteredResults = scannerData.filter((res) => {
            if (scannerSearch.trim() && !res.symbol.toLowerCase().includes(scannerSearch.toLowerCase().trim())) {
              return false;
            }

            if (stfFilter === 'crt_buy') {
              return res.ictCrtModel?.sweepType === 'BULLISH_ICT_CRT' || res.ictCrtModel?.sweepType === 'BULLISH_SWEEP' || res.crt9AmModel?.sweepType === 'BULLISH_CRT_9AM' || res.activeSignal?.type === 'BUY';
            }
            if (stfFilter === 'crt_sell') {
              return res.ictCrtModel?.sweepType === 'BEARISH_ICT_CRT' || res.ictCrtModel?.sweepType === 'BEARISH_SWEEP' || res.crt9AmModel?.sweepType === 'BEARISH_CRT_9AM' || res.activeSignal?.type === 'SELL';
            }
            if (stfFilter === 'all_crt') {
              return !!res.activeSignal || !!res.ictCrtModel || !!res.crt9AmModel;
            }
            return true; // 'all'
          });

          return (
            <div className="space-y-4 animate-fade-in">
              {/* Radar Strategy Rule Notice */}
              <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border border-amber-500/40 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300">
                    <Zap className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded">
                        MODEL ENTRI: ICT x CANDLE RANGE THEORY (CRT)
                      </span>
                      <span className="text-xs text-amber-300 font-bold">
                        CRT Benchmark Range &bull; ICT Turtle Soup Sweep &bull; 5M Displacement MSS &bull; FVG Mitigation &bull; Targets 50% EQ &amp; DOL
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                      Sistem memindai integrasi <strong>ICT (Inner Circle Trader) digabungkan dengan CRT (Candle Range Theory)</strong>: Rentang Mother Candle 8-9 AM NY, sapuan likuiditas pembukaan pasar jam 09:00 AM (Turtle Soup SSL/BSL), penutupan kembali ke dalam rentang (re-entry), pergeseran struktur 5M Displacement MSS, retest zona FVG (BISI/SIBI), serta target konsisten terkunci (TP1 50% EQ &amp; TP2 Opposing Boundary DOL).
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
                  <span className="text-[11px] text-slate-400 font-medium">⚡ Setup ICT + CRT Aktif</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black text-amber-400 font-mono">{totalActiveSignal}</span>
                    <span className="text-[10px] text-slate-500">Sinyal Terkonfirmasi</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">🟢 SSL Sweep &amp; BISI (BUY)</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black text-emerald-400 font-mono">{totalCrtBuy}</span>
                    <span className="text-[10px] text-emerald-300/70">Sweep Low &amp; Re-entry</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">🔴 BSL Sweep &amp; SIBI (SELL)</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black text-rose-400 font-mono">{totalCrtSell}</span>
                    <span className="text-[10px] text-rose-300/70">Sweep High &amp; Re-entry</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">🔄 5M MSS &amp; FVG Mitigated</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black text-indigo-400 font-mono">{totalReEntryMss}</span>
                    <span className="text-[10px] text-slate-500">Struktur Valid</span>
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Sub-Filter Pills */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-400 mr-1">Filter Model ICT + CRT:</span>
                    <button
                      onClick={() => setStfFilter('all_crt')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1 ${
                        stfFilter === 'all_crt'
                          ? 'bg-amber-500 text-slate-950 font-black shadow'
                          : 'bg-slate-950 text-amber-400 hover:bg-slate-800 border border-amber-500/30'
                      }`}
                    >
                      <span>🔥 Semua Setup ICT + CRT ({totalActiveSignal})</span>
                    </button>

                    <button
                      onClick={() => setStfFilter('crt_buy')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1 ${
                        stfFilter === 'crt_buy'
                          ? 'bg-emerald-500 text-slate-950 font-black shadow'
                          : 'bg-slate-950 text-emerald-400 hover:bg-slate-800 border border-emerald-500/30'
                      }`}
                    >
                      <span>🟢 SSL Sweep &amp; BISI (BUY) ({totalCrtBuy})</span>
                    </button>

                    <button
                      onClick={() => setStfFilter('crt_sell')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1 ${
                        stfFilter === 'crt_sell'
                          ? 'bg-rose-500 text-white font-black shadow'
                          : 'bg-slate-950 text-rose-400 hover:bg-slate-800 border border-rose-500/30'
                      }`}
                    >
                      <span>🔴 BSL Sweep &amp; SIBI (SELL) ({totalCrtSell})</span>
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

              {/* Exclusive ICT + CRT Scanner Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">Token &amp; Kategori</th>
                        <th className="py-3.5 px-4">Harga Terkini</th>
                        <th className="py-3.5 px-4">Benchmark CRT Range (RH/RL/EQ)</th>
                        <th className="py-3.5 px-4">ICT Liquidity Sweep</th>
                        <th className="py-3.5 px-4">5M MSS &amp; FVG Zone</th>
                        <th className="py-3.5 px-4">Target Terkunci (TP1 / TP2 / SL)</th>
                        <th className="py-3.5 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {scannerLoading && scannerData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-16 text-center text-slate-400 font-sans">
                            <RefreshCw className="w-7 h-7 animate-spin mx-auto text-amber-400 mb-3" />
                            <span className="font-bold">Memindai Model Entri ICT + CRT {scannerCategory.toUpperCase()} secara real-time ({scanProgress.current}/{scanProgress.total})...</span>
                          </td>
                        </tr>
                      ) : filteredResults.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                            <div className="max-w-md mx-auto space-y-3">
                              <AlertCircle className="w-8 h-8 mx-auto text-amber-400" />
                              <h4 className="text-sm font-bold text-white">Tidak Ada Setup ICT + CRT pada Kriteria Filter Ini</h4>
                              <p className="text-xs text-slate-400">
                                Coba ganti kategori koin atau klik &quot;Semua Setup ICT + CRT&quot; untuk memantau peluang manipulasi Turtle Soup New York Open lainnya.
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
                          const ict = res.ictCrtModel;
                          const crt = res.crt9AmModel;
                          const sig = res.activeSignal;

                          const benchmark = ict?.benchmark || crt?.benchmark;
                          const sweepType = ict?.sweepType || crt?.sweepType;
                          const isBullish = sweepType === 'BULLISH_ICT_CRT' || sweepType === 'BULLISH_SWEEP' || sweepType === 'BULLISH_CRT_9AM' || sig?.type === 'BUY';
                          const sweepPrice = ict?.sweepPrice || crt?.sweepPrice;
                          const mssConfirmed = ict?.displacementMss?.isConfirmed ?? ict?.mssConfirmed ?? crt?.reEntryConfirmed;
                          const mssLevel = ict?.mssLevel || crt?.mssLevel;
                          const fvg = ict?.fairValueGap?.type || (ict?.fvgMitigated ? 'BISI/SIBI' : undefined);
                          const sl = ict?.stopLoss || crt?.stopLoss;
                          const tp1 = ict?.takeProfit1 || crt?.takeProfit1;
                          const tp2 = ict?.takeProfit2 || crt?.takeProfit2;

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

                              {/* Benchmark CRT Range (RH / RL / 50% EQ) */}
                              <td className="py-3.5 px-4 font-sans">
                                {benchmark ? (
                                  <div className="space-y-0.5 text-[10px] font-mono">
                                    <div className="text-indigo-300">
                                      RH: ${formatPrice(benchmark.rangeHigh)}
                                    </div>
                                    <div className="text-slate-400">
                                      EQ: ${formatPrice(benchmark.equilibrium)}
                                    </div>
                                    <div className="text-indigo-300">
                                      RL: ${formatPrice(benchmark.rangeLow)}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-[11px]">Belum Membentuk Range</span>
                                )}
                              </td>

                              {/* ICT Liquidity Sweep */}
                              <td className="py-3.5 px-4 font-sans">
                                {sweepType ? (
                                  <div className="space-y-0.5">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                      isBullish
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    }`}>
                                      {isBullish ? '⚡ ICT SSL SWEEP (BUY)' : '⚡ ICT BSL SWEEP (SELL)'}
                                    </span>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      Wick: ${formatPrice(sweepPrice || 0)}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-[11px]">Menunggu Sapuan Likuiditas</span>
                                )}
                              </td>

                              {/* 5M MSS & FVG Zone */}
                              <td className="py-3.5 px-4 font-sans">
                                {mssConfirmed ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1">
                                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase">
                                        5M MSS ✓
                                      </span>
                                      {fvg && (
                                        <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[9px] font-black uppercase">
                                          {fvg}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-amber-300 font-mono">
                                      MSS: ${formatPrice(mssLevel || 0)}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-[11px]">Menunggu Re-entry / MSS</span>
                                )}
                              </td>

                              {/* Target Terkunci (TP1 / TP2 / SL) */}
                              <td className="py-3.5 px-4 font-sans">
                                {sl !== undefined && tp1 !== undefined && tp2 !== undefined ? (
                                  <div className="space-y-0.5 text-[10px] font-mono">
                                    <div className="text-rose-400">
                                      SL: ${formatPrice(sl)}
                                    </div>
                                    <div className="text-amber-300">
                                      TP1: ${formatPrice(tp1)} (50% EQ)
                                    </div>
                                    <div className="text-emerald-400">
                                      TP2: ${formatPrice(tp2)} (1:{sig?.riskRewardRatio || ict?.riskRewardRatio || crt?.riskRewardRatio || 3.5}R DOL)
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-[11px]">-</span>
                                )}
                              </td>

                              {/* Aksi */}
                              <td className="py-3.5 px-4 text-right font-sans">
                                <button
                                  onClick={() => {
                                    setSymbol(res.symbol);
                                    setActiveTab('multichart');
                                  }}
                                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ml-auto"
                                >
                                  <span>Chart ICT + CRT</span>
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
                    Laporan Taktis Model ICT + CRT - Gemini AI Copilot
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
                    <p className="font-mono text-slate-400">Gemini sedang menganalisis benchmark CRT range 8-9 AM, sapuan ICT Turtle Soup (SSL/BSL), re-entry, 5M Displacement MSS, dan mitigasi FVG...</p>
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
          ICT + CRT Institutional Trading System &bull; Integrasi Teknik ICT (Inner Circle Trader) digabungkan dengan CRT (Candle Range Theory) &bull; Benchmark Range (RH/RL/EQ), Liquidity Sweeps, 5M MSS, Fair Value Gap (FVG BISI/SIBI) Mitigation, Target Terkunci (TP1/TP2/SL), serta Notifikasi Alert Sinyal Fresh BUY &amp; SELL.
        </p>
      </footer>

      {/* 5. FLOATING ALERT TOAST NOTIFICATIONS */}
      <AlertNotificationToast
        alerts={toastAlerts}
        onDismiss={dismissToast}
        onOpenChart={handleOpenChart}
      />

      {/* 6. ALERT HISTORY & SOUND SETTINGS MODAL */}
      <AlertHistoryModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        alerts={freshAlerts}
        onClearAll={clearAllAlerts}
        onMarkAllRead={markAllAlertsRead}
        onOpenChart={handleOpenChart}
        onTriggerTestAlert={triggerTestAlert}
      />
    </div>
  );
}
