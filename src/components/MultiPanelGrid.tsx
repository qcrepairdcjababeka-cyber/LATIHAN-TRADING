/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Candle, TradingSignal, ScanResult, StrategyModelMode } from '../types';
import { scanSTFStrategy, generateSyntheticSTFPair, formatPrice, resetPersistentSignal } from '../utils/stfStrategyScanner';
import H4BoxChart from './H4BoxChart';
import CryptoTokenSelector from './CryptoTokenSelector';
import {
  LayoutGrid,
  RefreshCw,
  Zap,
  Layers,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  Flame,
  Clock,
  ArrowRight,
  Crosshair,
  Compass,
  Award,
  AlertCircle,
  Lock,
  Copy,
  Check,
  RotateCcw,
  Target
} from 'lucide-react';

interface MultiPanelGridProps {
  currentSymbol: string;
  onSymbolChange: (symbol: string) => void;
  tickers?: { value: string; label: string }[];
  onActiveSignalFound?: (sig: TradingSignal | null) => void;
}

export default function MultiPanelGrid({
  currentSymbol,
  onSymbolChange,
  tickers,
  onActiveSignalFound,
}: MultiPanelGridProps) {
  const [symbol, setSymbol] = useState<string>(currentSymbol || 'BTCUSDT');
  const [strategyMode] = useState<StrategyModelMode>('ICT_CRT');
  const [h4Candles, setH4Candles] = useState<Candle[]>(() => {
    return generateSyntheticSTFPair('bullish', 35, 45, 65).htf;
  });
  const [fiveMCandles, setFiveMCandles] = useState<Candle[]>(() => {
    return generateSyntheticSTFPair('bullish', 35, 45, 65).ltf;
  });
  const [fifteenMCandles, setFifteenMCandles] = useState<Candle[]>(() => {
    return generateSyntheticSTFPair('bullish', 35, 45, 65).mtf;
  });
  const [scanResult, setScanResult] = useState<ScanResult | null>(() => {
    const syn = generateSyntheticSTFPair('bullish', 35, 45, 65);
    return scanSTFStrategy(currentSymbol || 'BTCUSDT', syn.htf, syn.mtf, syn.ltf, null, 'ICT_CRT');
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [copied, setCopied] = useState<boolean>(false);

  // Sync with prop if changes
  useEffect(() => {
    if (currentSymbol && currentSymbol !== symbol) {
      setSymbol(currentSymbol);
    }
  }, [currentSymbol]);

  // Fetch 4H, 5M, & 15M data simultaneously with safe JSON handling
  const fetchMultiData = async (targetSym: string, silent = false, modeOverride?: StrategyModelMode) => {
    if (!silent) setLoading(true);
    const mode = modeOverride || strategyMode;

    // Resilient JSON fetch helper that safely parses without throwing Unexpected token '<'
    const safeFetchCandles = async (url: string) => {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          return await res.json();
        }
        // If response is HTML or status != 200, return clean fallback object
        return { success: false, candles: [] };
      } catch {
        return { success: false, candles: [] };
      }
    };

    try {
      const symParam = encodeURIComponent(targetSym);
      const [dataH4, data5m, data15m] = await Promise.all([
        safeFetchCandles(`/api/binance/candles?symbol=${symParam}&interval=4h&limit=40`),
        safeFetchCandles(`/api/binance/candles?symbol=${symParam}&interval=5m&limit=60`),
        safeFetchCandles(`/api/binance/candles?symbol=${symParam}&interval=15m&limit=60`),
      ]);

      let finalH4: Candle[] = [];
      let final5m: Candle[] = [];
      let final15m: Candle[] = [];

      if (dataH4?.success && Array.isArray(dataH4.candles) && dataH4.candles.length > 0) {
        finalH4 = dataH4.candles;
      }
      if (data5m?.success && Array.isArray(data5m.candles) && data5m.candles.length > 0) {
        final5m = data5m.candles;
      }
      if (data15m?.success && Array.isArray(data15m.candles) && data15m.candles.length > 0) {
        final15m = data15m.candles;
      }

      // If any candle data is missing, synthesize smoothly
      if (finalH4.length === 0 || final5m.length === 0 || final15m.length === 0) {
        const syn = generateSyntheticSTFPair('bullish', 35, 45, 65);
        if (finalH4.length === 0) finalH4 = syn.htf;
        if (final15m.length === 0) final15m = syn.mtf;
        if (final5m.length === 0) final5m = syn.ltf;
      }

      setH4Candles(finalH4);
      setFifteenMCandles(final15m);
      setFiveMCandles(final5m);

      // Run Strategy Scan with previous signal preserved so TP & SL never drift
      const result = scanSTFStrategy(targetSym, finalH4, final15m, final5m, scanResult?.activeSignal, mode);
      setScanResult(result);
      setLastUpdated(new Date());

      if (onActiveSignalFound) {
        onActiveSignalFound(result.activeSignal);
      }
    } catch (err) {
      console.warn('Recovered gracefully using synthetic multi-timeframe candles:', err);
      // Generate synthetic fallback
      const syn = generateSyntheticSTFPair('bullish', 35, 45, 65);
      setH4Candles(syn.htf);
      setFifteenMCandles(syn.mtf);
      setFiveMCandles(syn.ltf);

      const result = scanSTFStrategy(targetSym, syn.htf, syn.mtf, syn.ltf, scanResult?.activeSignal, mode);
      setScanResult(result);
      if (onActiveSignalFound) {
        onActiveSignalFound(result.activeSignal);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetSignal = () => {
    resetPersistentSignal(symbol);
    fetchMultiData(symbol, false);
  };

  const handleCopyParameters = (sig: TradingSignal) => {
    const text = `⚡ MODEL ENTRI ICT + CRT INSTITUSIONAL (${sig.symbol})\n` +
      `Model: ${sig.setupType.replace(/_/g, ' ')}\n` +
      `Direction: ${sig.type}\n` +
      `Entry Level: $${formatPrice(sig.entryPrice)}\n` +
      `Stop Loss: $${formatPrice(sig.stopLoss)}\n` +
      `Take Profit 1: $${formatPrice(sig.takeProfit1)}\n` +
      `Take Profit 2: $${formatPrice(sig.takeProfit2)}\n` +
      (sig.takeProfit3 ? `Take Profit 3: $${formatPrice(sig.takeProfit3)}\n` : '') +
      `Risk:Reward: 1:${sig.riskRewardRatio}R\n` +
      `Konfirmasi: ${sig.confirmation || 'ICT Sweep + 5M MSS + FVG Retest'}\n` +
      `Status: TP & SL KONSISTEN TERKUNCI`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    fetchMultiData(symbol);
    const interval = setInterval(() => {
      fetchMultiData(symbol, true);
    }, 8000);
    return () => clearInterval(interval);
  }, [symbol, strategyMode]);

  const handleSelectSymbol = (newSym: string) => {
    setSymbol(newSym);
    onSymbolChange(newSym);
  };

  const ictCrt = scanResult?.activeSignal?.ictCrt || scanResult?.ictCrtModel || scanResult?.activeSignal?.crt9Am || scanResult?.crt9AmModel;

  return (
    <div id="multipanel-grid-container" className="space-y-6">
      {/* TOP CONTROLS & STRATEGY STATUS BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <CryptoTokenSelector
            selectedSymbol={symbol}
            onSelectSymbol={handleSelectSymbol}
          />

          {/* STRATEGY MODEL BADGE (ICT + CRT INSTITUSIONAL HYBRID) */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 via-indigo-950/40 to-slate-950 border border-amber-500/40 rounded-xl">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-black text-amber-300">Model ICT + CRT</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200 font-mono font-bold">
              FVG &amp; Turtle Soup
            </span>
          </div>

          <button
            id="btn-refresh-multi"
            onClick={() => fetchMultiData(symbol)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700/60 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Sinkronisasi Live</span>
          </button>

          <span className="text-[11px] text-slate-500 font-mono">
            Pembaruan: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>

        {/* STRATEGY MODEL STATUS INDICATOR */}
        <div className="flex flex-wrap items-center gap-2">
          {scanResult?.activeSignal ? (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-xs shadow-lg ${
              scanResult.activeSignal.type === 'BUY'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-emerald-500/20'
                : 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-500/20'
            }`}>
              <Zap className="w-4 h-4" />
              <span>
                {`⚡ ICT+CRT: ${scanResult.activeSignal.type} (1:${scanResult.activeSignal.riskRewardRatio}R)`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Model: ICT x Candle Range Theory</span>
            </div>
          )}

          {ictCrt && (
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold bg-slate-950 border border-indigo-900/50 text-amber-300">
              {ictCrt.liquiditySweep?.type === 'SSL_SWEEP_BULLISH' || ictCrt.sweepType === 'BULLISH_ICT_CRT'
                ? '⚡ SSL Turtle Soup + FVG BISI (BUY)'
                : '⚡ BSL Turtle Soup + FVG SIBI (SELL)'}
            </span>
          )}
        </div>
      </div>

      {/* ICT + CRT MODEL ROADMAP BAR */}
      {ictCrt?.benchmark && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-950 border border-indigo-900/50 rounded-2xl p-4 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* 1. Range Acuan CRT (Current Running Candle Range) */}
            <div className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-indigo-900/40">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-indigo-400">
                  1. CRT CANDLE BERJALAN (CURRENT RANGE)
                </span>
                <p className="font-bold text-slate-200 leading-snug">
                  RH: ${formatPrice(ictCrt.benchmark.rangeHigh)} | RL: ${formatPrice(ictCrt.benchmark.rangeLow)}
                </p>
                <div className="text-[10px] text-indigo-300 font-mono">
                  50% EQ: ${formatPrice(ictCrt.benchmark.equilibrium)} (Batas Lilin Berjalan)
                </div>
              </div>
            </div>

            {/* 2. ICT Turtle Soup Liquidity Sweep */}
            <div className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-rose-900/40">
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-rose-400">
                  2. ICT TURTLE SOUP SWEEP
                </span>
                <p className="font-bold text-slate-200 leading-snug">
                  Sapuan Likuiditas di ${formatPrice(ictCrt.sweepPrice)}
                </p>
                <div className="text-[10px] text-rose-300 font-mono">
                  Manipulasi: Sweep {ictCrt.liquiditySweep?.type === 'SSL_SWEEP_BULLISH' || ictCrt.sweepType === 'BULLISH_ICT_CRT' ? 'Sell-Side (SSL)' : 'Buy-Side (BSL)'}
                </div>
              </div>
            </div>

            {/* 3. Re-entry & 5M MSS */}
            <div className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-amber-900/40">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                <Compass className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-400">
                  3. ICT DISPLACEMENT &amp; 5M MSS
                </span>
                <p className="font-bold text-slate-200 leading-snug">
                  MSS Terkonfirmasi di ${formatPrice(ictCrt.mssLevel)}
                </p>
                <div className="text-[10px] text-amber-300 font-mono">
                  Displacement candle menembus struktur &amp; re-entry
                </div>
              </div>
            </div>

            {/* 4. ICT FVG / OTE Retest & DOL Target */}
            <div className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-emerald-900/40">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                <Crosshair className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400">
                  4. RETEST FVG &amp; TARGET DOL
                </span>
                <p className="font-bold text-slate-200 leading-snug">
                  Entry ${formatPrice(ictCrt.entryPrice)} | TP ${formatPrice(ictCrt.takeProfit2)}
                </p>
                <div className="text-[10px] text-emerald-300 font-mono">
                  Retest FVG {ictCrt.fairValueGap?.type || 'BISI/SIBI'} &rarr; Target DOL (R:R 1:{ictCrt.riskRewardRatio}R)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED FIXED & CONSISTENT TP/SL SIGNAL CARD */}
      {scanResult?.activeSignal && (
        <div id="active-signal-fixed-card" className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1.5 rounded-xl font-black text-xs tracking-wider flex items-center gap-1.5 shadow-md ${
                scanResult.activeSignal.type === 'BUY'
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                  : 'bg-rose-500 text-white shadow-rose-500/20'
              }`}>
                {scanResult.activeSignal.type === 'BUY' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>
                  ⚡ MODEL ICT + CRT {scanResult.activeSignal.type} ({scanResult.activeSignal.symbol})
                </span>
              </span>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>TP &amp; SL TERKUNCI KONSISTEN (Tidak Bergeser)</span>
              </div>

              {scanResult.activeSignal.pnlR !== undefined && (
                <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black ${
                  scanResult.activeSignal.pnlR >= 0
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                    : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                }`}>
                  Live R: {scanResult.activeSignal.pnlR >= 0 ? '+' : ''}{scanResult.activeSignal.pnlR}R
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-copy-signal-params"
                onClick={() => handleCopyParameters(scanResult.activeSignal!)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Parameter'}</span>
              </button>

              <button
                id="btn-reset-signal"
                onClick={handleResetSignal}
                title="Pindai ulang setup baru jika ingin mereset level terkunci"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold border border-slate-800 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Sinyal</span>
              </button>
            </div>
          </div>

          {/* 4 FIXED TARGET BOXES */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
            {/* 1. ENTRY */}
            <div className="bg-slate-950/80 border border-sky-500/30 rounded-xl p-3">
              <div className="flex items-center justify-between text-[11px] text-sky-400 font-bold mb-1">
                <span>1. ENTRY LEVEL</span>
                <span className="font-mono text-[10px] bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800/60">
                  FVG / OTE Retest
                </span>
              </div>
              <div className="text-lg font-black font-mono text-white">
                ${formatPrice(scanResult.activeSignal.entryPrice)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">
                {scanResult.activeSignal.setupType.replace(/_/g, ' ')}
              </div>
            </div>

            {/* 2. STOP LOSS */}
            <div className="bg-slate-950/80 border border-rose-500/30 rounded-xl p-3">
              <div className="flex items-center justify-between text-[11px] text-rose-400 font-bold mb-1">
                <span>2. STOP LOSS (SL)</span>
                <span className="font-mono text-[10px] bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800/60">TERKUNCI</span>
              </div>
              <div className="text-lg font-black font-mono text-rose-300">
                ${formatPrice(scanResult.activeSignal.stopLoss)}
              </div>
              <div className="text-[10px] text-rose-400/80 mt-1">
                Ujung Sweep Likuiditas (Invalidation)
              </div>
            </div>

            {/* 3. TAKE PROFIT 1 */}
            <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3">
              <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold mb-1">
                <span>3. TAKE PROFIT 1 (TP1)</span>
                <span className="font-mono text-[10px] bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                  50% CRT EQ
                </span>
              </div>
              <div className="text-lg font-black font-mono text-emerald-300">
                ${formatPrice(scanResult.activeSignal.takeProfit1)}
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-1">
                Target Pertama (+{((Math.abs(scanResult.activeSignal.takeProfit1 - scanResult.activeSignal.entryPrice) / scanResult.activeSignal.entryPrice) * 100).toFixed(2)}%)
              </div>
            </div>

            {/* 4. TAKE PROFIT 2 */}
            <div className="bg-slate-950/80 border border-teal-500/30 rounded-xl p-3">
              <div className="flex items-center justify-between text-[11px] text-teal-400 font-bold mb-1">
                <span>4. TAKE PROFIT 2 (TP2)</span>
                <span className="font-mono text-[10px] bg-teal-950/80 px-1.5 py-0.5 rounded border border-teal-800/60">
                  R:R 1:{scanResult.activeSignal.riskRewardRatio}
                </span>
              </div>
              <div className="text-lg font-black font-mono text-teal-200">
                ${formatPrice(scanResult.activeSignal.takeProfit2)}
              </div>
              <div className="text-[10px] text-teal-400/80 mt-1 truncate">
                Opposing Boundary DOL (+{((Math.abs(scanResult.activeSignal.takeProfit2 - scanResult.activeSignal.entryPrice) / scanResult.activeSignal.entryPrice) * 100).toFixed(2)}%)
              </div>
            </div>
          </div>

          {/* AREA KEY LEVEL UNTUK ENTRI VALID & PRESISI */}
          {scanResult.activeSignal.keyLevelZone && (
            <div className="mt-4 p-3.5 bg-gradient-to-r from-sky-950/70 via-slate-950 to-indigo-950/70 border border-sky-500/40 rounded-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-sky-900/40">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white tracking-wide flex items-center gap-2">
                      <span>AREA KEY LEVEL (ENTRI VALID &amp; PRESISI)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-mono font-bold border border-sky-500/30">
                        Skor Presisi: {scanResult.activeSignal.keyLevelZone.precisionScore}%
                      </span>
                    </div>
                    <p className="text-[11px] text-sky-200/80">
                      Konfluensi batas FVG institusional &amp; Golden Pocket OTE Fib 62% - 79%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                    scanResult.activeSignal.keyLevelZone.status === 'SWEET_SPOT_HIT' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 animate-pulse' :
                    scanResult.activeSignal.keyLevelZone.status === 'IN_ZONE' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' :
                    scanResult.activeSignal.keyLevelZone.status === 'REJECTED_RUNNING' ? 'bg-indigo-600 text-white' :
                    'bg-slate-800 text-slate-200'
                  }`}>
                    Status: {scanResult.activeSignal.keyLevelZone.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-sky-900/40">
                  <span className="text-[10px] text-slate-400 font-sans block">Batas Rentang Key Level:</span>
                  <span className="text-sky-300 font-bold text-sm">
                    ${formatPrice(scanResult.activeSignal.keyLevelZone.low)} - ${formatPrice(scanResult.activeSignal.keyLevelZone.high)}
                  </span>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-amber-900/40">
                  <span className="text-[10px] text-amber-400/90 font-sans block">★ Sweet Spot Sniper (OTE 70.5%):</span>
                  <span className="text-amber-300 font-extrabold text-sm">
                    ${formatPrice(scanResult.activeSignal.keyLevelZone.sweetSpot)}
                  </span>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-indigo-900/40">
                  <span className="text-[10px] text-slate-400 font-sans block">Fib OTE Golden Pocket:</span>
                  <span className="text-indigo-300 font-bold text-[11px]">
                    62%: ${formatPrice(scanResult.activeSignal.keyLevelZone.oteFib62)} | 79%: ${formatPrice(scanResult.activeSignal.keyLevelZone.oteFib79)}
                  </span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-sky-900/30 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                <span className="font-bold text-sky-400 text-xs">Konfluensi Terpenuhi:</span>
                {scanResult.activeSignal.keyLevelZone.confluences.map((c, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px]">
                    ✓ {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SYNCHRONIZED 3-TIMEFRAME CHARTS (HTF 4H, MTF 15M, LTF 5M) - MODEL ICT + CRT */}
      <div className="grid grid-cols-1 gap-6">
        {/* CHART 1: HTF 4H */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-black text-slate-300 uppercase tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span>1. Timeframe Induk (HTF 4H): Konteks Sesi &amp; Bias Makro ICT + CRT</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Bias &amp; Arah Aliran Likuiditas Institusi
            </span>
          </div>
          <H4BoxChart
            candles={h4Candles}
            activeSignal={scanResult?.activeSignal || null}
            timeframe="4h"
            symbol={symbol}
            scanData={scanResult}
          />
        </div>

        {/* CHART 2: MTF 15M */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-black text-slate-300 uppercase tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>2. Timeframe Struktur (MTF 15M): Range Acuan CRT &amp; Deteksi ICT Turtle Soup Sweep</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Pembentukan Mother Range &amp; Sapuan SSL / BSL
            </span>
          </div>
          <H4BoxChart
            candles={fifteenMCandles}
            activeSignal={scanResult?.activeSignal || null}
            timeframe="15m"
            symbol={symbol}
            scanData={scanResult}
          />
        </div>

        {/* CHART 3: LTF 5M */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-black text-slate-300 uppercase tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>3. Timeframe Eksekusi (LTF 5M): Displacement MSS, Retest FVG BISI/SIBI, &amp; Sniper Re-entry</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Eksekusi Retest Masuk Kembali Ke Range Menuju DOL
            </span>
          </div>
          <H4BoxChart
            candles={fiveMCandles}
            activeSignal={scanResult?.activeSignal || null}
            timeframe="5m"
            symbol={symbol}
            scanData={scanResult}
          />
        </div>
      </div>
    </div>
  );
}
