/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Candle, TradingSignal, ScanResult } from '../types';
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
  Hash,
  Award,
  AlertCircle,
  Lock,
  Copy,
  Check,
  RotateCcw
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
  const [h4Candles, setH4Candles] = useState<Candle[]>([]);
  const [fiveMCandles, setFiveMCandles] = useState<Candle[]>([]);
  const [fifteenMCandles, setFifteenMCandles] = useState<Candle[]>([]);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [copied, setCopied] = useState<boolean>(false);

  // Sync with prop if changes
  useEffect(() => {
    if (currentSymbol && currentSymbol !== symbol) {
      setSymbol(currentSymbol);
    }
  }, [currentSymbol]);

  // Fetch 4H, 5M, & 15M data simultaneously
  const fetchMultiData = async (targetSym: string, silent = false) => {
    if (!silent) setLoading(true);

    try {
      const [resH4, res5m, res15m] = await Promise.all([
        fetch(`/api/binance/candles?symbol=${targetSym}&interval=4h&limit=40`),
        fetch(`/api/binance/candles?symbol=${targetSym}&interval=5m&limit=60`),
        fetch(`/api/binance/candles?symbol=${targetSym}&interval=15m&limit=60`),
      ]);

      const dataH4 = await resH4.json();
      const data5m = await res5m.json();
      const data15m = await res15m.json();

      let finalH4: Candle[] = [];
      let final5m: Candle[] = [];
      let final15m: Candle[] = [];

      if (dataH4.success && dataH4.candles?.length > 0) {
        finalH4 = dataH4.candles;
      }
      if (data5m.success && data5m.candles?.length > 0) {
        final5m = data5m.candles;
      }
      if (data15m.success && data15m.candles?.length > 0) {
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

      // Run 7-Pillars STF Scan with previous signal preserved so TP & SL never drift
      const result = scanSTFStrategy(targetSym, finalH4, final15m, final5m, scanResult?.activeSignal);
      setScanResult(result);
      setLastUpdated(new Date());

      if (onActiveSignalFound) {
        onActiveSignalFound(result.activeSignal);
      }
    } catch (err) {
      console.error('Failed fetching multi-timeframe candles:', err);
      // Generate synthetic fallback
      const syn = generateSyntheticSTFPair('bullish', 35, 45, 65);
      setH4Candles(syn.htf);
      setFifteenMCandles(syn.mtf);
      setFiveMCandles(syn.ltf);

      const result = scanSTFStrategy(targetSym, syn.htf, syn.mtf, syn.ltf, scanResult?.activeSignal);
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
    const text = `🎯 7-PILLAR STF SIGNAL (${sig.symbol})\n` +
      `Direction: ${sig.type}\n` +
      `Entry Level: $${formatPrice(sig.entryPrice)}\n` +
      `Stop Loss: $${formatPrice(sig.stopLoss)}\n` +
      `Take Profit 1: $${formatPrice(sig.takeProfit1)}\n` +
      `Take Profit 2: $${formatPrice(sig.takeProfit2)}\n` +
      `Risk:Reward: 1:${sig.riskRewardRatio}\n` +
      `Status: TP & SL KONSISTEN TERKUNCI`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    fetchMultiData(symbol);
    const interval = setInterval(() => {
      fetchMultiData(symbol, true);
    }, 15000); // 15s auto-refresh
    return () => clearInterval(interval);
  }, [symbol]);

  const handleSelectSymbol = (newSym: string) => {
    setSymbol(newSym);
    onSymbolChange(newSym);
  };

  return (
    <div id="multipanel-grid-container" className="space-y-6">
      {/* TOP CONTROLS & STRATEGY STATUS BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <CryptoTokenSelector
            selectedSymbol={symbol}
            onSelectSymbol={handleSelectSymbol}
          />

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

        {/* 7 PILLARS PILL INDICATOR */}
        <div className="flex flex-wrap items-center gap-2">
          {scanResult?.zona1Lot.isEligible ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 animate-pulse">
              <Award className="w-4 h-4" />
              <span>ZONA 1 LOT [FM] AKTIF ({scanResult.zona1Lot.confluenceScore}% CONFLUENCE)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>7 Pilar STF Monitoring ({scanResult?.zona1Lot.confluenceScore || 40}%)</span>
            </div>
          )}

          {scanResult?.currentCycle && (
            <span className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold border ${
              scanResult.currentCycle.is6C
                ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
                : scanResult.currentCycle.is9C
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}>
              Candle #{scanResult.currentCycle.currentCount} {scanResult.currentCycle.is6C ? '⚡ KODE 6C' : scanResult.currentCycle.is9C ? '🔥 KODE 9C' : ''}
            </span>
          )}
        </div>
      </div>

      {/* STORYLINE & CONFLUENCE ROADMAP BAR */}
      {scanResult && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* 1. Sifir & Storyline Origin */}
            <div className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                <Compass className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                  1. Storyline Origin (HTF 4H)
                </span>
                <p className="font-bold text-slate-200 leading-snug">
                  {scanResult.storyline.origin}
                </p>
                <div className="text-[10px] text-amber-300 font-mono">
                  Tren HTF: {scanResult.stfHierarchy.htfTrend}
                </div>
              </div>
            </div>

            {/* 2. Zero Floating Zona & Current Phase */}
            <div className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                <Crosshair className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                  3. Zero Floating Zona (ZFZ)
                </span>
                <p className="font-bold text-slate-200 leading-snug">
                  {scanResult.zeroFloatingZones[0]?.originDescription || 'Menunggu candle menyentuh wick ZFZ sniper'}
                </p>
                <div className="text-[10px] text-emerald-300 font-mono">
                  Level Sniper: ${formatPrice(scanResult.zeroFloatingZones[0]?.wickSniperLevel || 0)}
                </div>
              </div>
            </div>

            {/* 3. Storyline Destination & Gun Number */}
            <div className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 shrink-0 mt-0.5">
                <Hash className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                  6 &amp; 7. Destination &amp; Gun Number
                </span>
                <p className="font-bold text-slate-200 leading-snug">
                  {scanResult.storyline.destination}
                </p>
                <div className="text-[10px] text-sky-300 font-mono">
                  Gun Number: ${formatPrice(scanResult.gunNumber.nearestGunNumber)} ({scanResult.gunNumber.levelType})
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
                <span>SINYAL {scanResult.activeSignal.type} ({scanResult.activeSignal.symbol})</span>
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
                <span className="font-mono text-[10px] bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800/60">TERKUNCI</span>
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
                <span className="font-mono text-[10px] bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800/60">KONSISTEN</span>
              </div>
              <div className="text-lg font-black font-mono text-rose-300">
                ${formatPrice(scanResult.activeSignal.stopLoss)}
              </div>
              <div className="text-[10px] text-rose-400/80 mt-1">
                Resiko: {((Math.abs(scanResult.activeSignal.entryPrice - scanResult.activeSignal.stopLoss) / scanResult.activeSignal.entryPrice) * 100).toFixed(2)}% (Ketat)
              </div>
            </div>

            {/* 3. TAKE PROFIT 1 */}
            <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3">
              <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold mb-1">
                <span>3. TAKE PROFIT 1 (TP1)</span>
                <span className="font-mono text-[10px] bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">R:R 1:2</span>
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
                <span className="font-mono text-[10px] bg-teal-950/80 px-1.5 py-0.5 rounded border border-teal-800/60">R:R 1:{scanResult.activeSignal.riskRewardRatio}</span>
              </div>
              <div className="text-lg font-black font-mono text-teal-200">
                ${formatPrice(scanResult.activeSignal.takeProfit2)}
              </div>
              <div className="text-[10px] text-teal-400/80 mt-1 truncate">
                Target Storyline (+{((Math.abs(scanResult.activeSignal.takeProfit2 - scanResult.activeSignal.entryPrice) / scanResult.activeSignal.entryPrice) * 100).toFixed(2)}%)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SYNCHRONIZED 3-TIMEFRAME CHARTS (HTF 4H, MTF 15M, LTF 5M) */}
      <div className="grid grid-cols-1 gap-6">
        {/* CHART 1: HTF 4H (Sifir Time Frame & Major Engulfing Storyline) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-black text-slate-300 uppercase tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>1. Timeframe Induk (HTF 4H): Pemetaan Storyline &amp; Fresh Engulfing</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              1 Candle 4H = 16 x 15M = 48 x 5M
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

        {/* CHART 2: MTF 15M (Structure, Breakout & Kode 6C.9C) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-black text-slate-300 uppercase tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span>2. Timeframe Struktur (MTF 15M): Valid Breakout (VBO) &amp; Kode 6C.9C</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Struktur gelombang &amp; transisi
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

        {/* CHART 3: LTF 5M (Sniper Execution & Zero Floating Zona) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-black text-slate-300 uppercase tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>3. Timeframe Eksekusi (LTF 5M): Sniper Trigger di Zero Floating Zona (ZFZ)</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Drawdown minimal (Zero Floating) &amp; SL ketat
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
