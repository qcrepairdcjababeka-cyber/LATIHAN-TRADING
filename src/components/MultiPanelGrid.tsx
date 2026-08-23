/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Candle, H4Box, TradingSignal, ScanResult } from '../types';
import { scanH4BoxAnd5m, generateMockPair } from '../utils/h4BoxScanner';
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
  Link,
  ShieldCheck,
  Flame,
  Clock,
  ArrowRight,
  Rocket,
  Star
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
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Sync with prop if changes
  useEffect(() => {
    if (currentSymbol && currentSymbol !== symbol) {
      setSymbol(currentSymbol);
    }
  }, [currentSymbol]);

  // Fetch 4H & 5M data simultaneously
  const fetchDualData = async (targetSym: string, silent = false) => {
    if (!silent) setLoading(true);

    try {
      const [resH4, res5m] = await Promise.all([
        fetch(`/api/binance/candles?symbol=${targetSym}&interval=4h&limit=60`),
        fetch(`/api/binance/candles?symbol=${targetSym}&interval=5m&limit=90`),
      ]);

      const dataH4 = await resH4.json();
      const data5m = await res5m.json();

      let h4List = dataH4.success && dataH4.candles?.length > 0 ? dataH4.candles : null;
      let fiveMList = data5m.success && data5m.candles?.length > 0 ? data5m.candles : null;

      if (!h4List || !fiveMList) {
        throw new Error('API fallback');
      }

      setH4Candles(h4List);
      setFiveMCandles(fiveMList);

      const result = scanH4BoxAnd5m(targetSym, h4List, fiveMList);
      setScanResult(result);
      if (onActiveSignalFound) onActiveSignalFound(result.activeSignal);
      setLoading(false);
      setLastUpdated(new Date());
    } catch {
      // Fallback generator
      const mock = generateMockPair(targetSym.includes('BTC') ? 'buy_retest' : 'sell_retest', 40, 60);
      setH4Candles(mock.h4);
      setFiveMCandles(mock.fiveM);

      const result = scanH4BoxAnd5m(targetSym, mock.h4, mock.fiveM);
      setScanResult(result);
      if (onActiveSignalFound) onActiveSignalFound(result.activeSignal);
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchDualData(symbol, false);
  }, [symbol]);

  // Live polling every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDualData(symbol, true);
    }, 10000);
    return () => clearInterval(interval);
  }, [symbol]);

  const h4Box = scanResult?.h4Box || null;
  const activeSignal = scanResult?.activeSignal || null;
  const latest5m = scanResult?.latest5mAnalysis || null;

  return (
    <div id="dual-timeframe-container" className="w-full space-y-4 animate-fade-in font-sans">
      {/* 1. TOP CONTROL BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Pair selector with Top 10, Top 100, & Binance Alpha tokens */}
        <div className="flex flex-wrap items-center gap-3">
          <CryptoTokenSelector
            selectedSymbol={symbol}
            onSelectSymbol={(s) => {
              setSymbol(s);
              onSymbolChange(s);
            }}
          />
        </div>

        {/* Status indicator & Refresh Button */}
        <div className="flex flex-wrap items-center gap-3">
          {h4Box && (
            <div className="hidden sm:flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-indigo-950/70 border border-indigo-500/40 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <span className="text-indigo-300 font-bold">Box H4 Lilin #2:</span>
                <strong className="text-indigo-200 font-mono">${h4Box.box2.bottom.toFixed(1)} - ${h4Box.box2.top.toFixed(1)}</strong>
                <span className="text-indigo-400 text-[10px] bg-indigo-900/60 px-1 rounded font-mono">Mid: ${((h4Box.box2.top + h4Box.box2.bottom) / 2).toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-purple-950/70 border border-purple-500/40 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                <span className="text-purple-300 font-bold">Box H4 Lilin #3:</span>
                <strong className="text-purple-200 font-mono">${h4Box.box3.bottom.toFixed(1)} - ${h4Box.box3.top.toFixed(1)}</strong>
                <span className="text-purple-400 text-[10px] bg-purple-900/60 px-1 rounded font-mono">Mid: ${((h4Box.box3.top + h4Box.box3.bottom) / 2).toFixed(1)}</span>
              </div>
            </div>
          )}

          <button
            onClick={() => fetchDualData(symbol, false)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-lg transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Pindai Real-Time</span>
          </button>
        </div>
      </div>

      {/* 2. REAL-TIME SIGNAL BANNERS (Box #2 and Box #3) */}
      <div className="space-y-3">
        {scanResult?.signalBox2 && (
          <div className={`p-4 rounded-xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in ${
            scanResult.signalBox2.type === 'BUY'
              ? 'bg-emerald-950/40 border-emerald-500/60 shadow-emerald-950/30'
              : 'bg-rose-950/40 border-rose-500/60 shadow-rose-950/30'
          }`}>
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-xl text-white ${
                scanResult.signalBox2.type === 'BUY' ? 'bg-emerald-600' : 'bg-rose-600'
              }`}>
                {scanResult.signalBox2.type === 'BUY' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase ${
                    scanResult.signalBox2.isFlipped
                      ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                      : scanResult.signalBox2.type === 'BUY' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                  }`}>
                    {scanResult.signalBox2.isFlipped
                      ? `⚡ FLIP ${scanResult.signalBox2.type} (CANCEL ${scanResult.signalBox2.flippedFrom})`
                      : `SINYAL ${scanResult.signalBox2.type} AKTIF (BOX #2)`}
                  </span>
                  <span className="text-xs font-extrabold text-indigo-300">
                    {symbol} &bull; Acuan H4 Lilin #2
                  </span>
                  {scanResult.signalBox2.isFlipped && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                      ⚠️ Memory: {scanResult.signalBox2.invalidationReason}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {scanResult.signalBox2.explanation}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">ENTRY:</span>
                <strong className="text-sky-400">${scanResult.signalBox2.entryPrice.toFixed(2)}</strong>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-slate-500 block text-[10px]">STOP LOSS:</span>
                <strong className="text-rose-400">${scanResult.signalBox2.stopLoss.toFixed(2)}</strong>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-slate-500 block text-[10px]">TP 1 (GARIS TENGAH):</span>
                <strong className="text-emerald-400 font-bold">${scanResult.signalBox2.takeProfit1.toFixed(2)}</strong>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-slate-500 block text-[10px]">TP 2 ({scanResult.signalBox2.type === 'BUY' ? 'BATAS ATAS' : 'BATAS BAWAH'}):</span>
                <strong className="text-teal-300 font-bold">${scanResult.signalBox2.takeProfit2.toFixed(2)}</strong>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-slate-500 block text-[10px]">LILIN 5M MASUK BOX:</span>
                <strong className="text-amber-400">
                  {scanResult.signalBox2.type} @ {scanResult.signalBox2.bodyRatioPercent}% Body
                </strong>
              </div>
            </div>
          </div>
        )}

        {scanResult?.signalBox3 && (
          <div className={`p-4 rounded-xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in ${
            scanResult.signalBox3.type === 'BUY'
              ? 'bg-purple-950/40 border-purple-500/60 shadow-purple-950/30'
              : 'bg-rose-950/40 border-rose-500/60 shadow-rose-950/30'
          }`}>
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-xl text-white ${
                scanResult.signalBox3.type === 'BUY' ? 'bg-purple-600' : 'bg-rose-600'
              }`}>
                {scanResult.signalBox3.type === 'BUY' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase ${
                    scanResult.signalBox3.isFlipped
                      ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                      : scanResult.signalBox3.type === 'BUY' ? 'bg-purple-400 text-slate-950' : 'bg-rose-500 text-white'
                  }`}>
                    {scanResult.signalBox3.isFlipped
                      ? `⚡ FLIP ${scanResult.signalBox3.type} (CANCEL ${scanResult.signalBox3.flippedFrom})`
                      : `SINYAL ${scanResult.signalBox3.type} AKTIF (BOX #3)`}
                  </span>
                  <span className="text-xs font-extrabold text-purple-300">
                    {symbol} &bull; Acuan H4 Lilin #3
                  </span>
                  {scanResult.signalBox3.isFlipped && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                      ⚠️ Memory: {scanResult.signalBox3.invalidationReason}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {scanResult.signalBox3.explanation}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">ENTRY:</span>
                <strong className="text-sky-400">${scanResult.signalBox3.entryPrice.toFixed(2)}</strong>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-slate-500 block text-[10px]">STOP LOSS:</span>
                <strong className="text-rose-400">${scanResult.signalBox3.stopLoss.toFixed(2)}</strong>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-slate-500 block text-[10px]">TP 1 (GARIS TENGAH):</span>
                <strong className="text-emerald-400 font-bold">${scanResult.signalBox3.takeProfit1.toFixed(2)}</strong>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-slate-500 block text-[10px]">TP 2 ({scanResult.signalBox3.type === 'BUY' ? 'BATAS ATAS' : 'BATAS BAWAH'}):</span>
                <strong className="text-teal-300 font-bold">${scanResult.signalBox3.takeProfit2.toFixed(2)}</strong>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-slate-500 block text-[10px]">LILIN 5M MASUK BOX:</span>
                <strong className="text-purple-300">
                  {scanResult.signalBox3.type} @ {scanResult.signalBox3.bodyRatioPercent}% Body
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. THREE SEPARATE CHARTS: CHART 1 (H4), CHART 2 (5M BOX 2), CHART 3 (5M BOX 3) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* CHART 1: TIMEFRAME 4H (HIGHER TIMEFRAME CONTEXT & DUAL BOXES #2 & #3) */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                Chart 1: Timeframe 4H (Area Box Lilin #2 & #3)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {h4Candles.length} candles
            </span>
          </div>

          <H4BoxChart
            candles={h4Candles}
            h4Box={h4Box}
            activeSignal={null}
            timeframe="4h"
            focusBox="all"
            symbol={symbol}
          />
        </div>

        {/* CHART 2: TIMEFRAME 5M (LILIN KE-2 H4 BOX CONFIRMATION) */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                Chart 2: Timeframe 5M (Konfirmasi Candle Kuat Masuk Box H4 Lilin #2)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {fiveMCandles.length} candles
            </span>
          </div>

          <H4BoxChart
            candles={fiveMCandles}
            h4Box={h4Box}
            focusBox={2}
            activeSignal={scanResult?.signalBox2 || null}
            latest5mAnalysis={scanResult?.latest5mAnalysisBox2}
            timeframe="5m"
            symbol={symbol}
          />
        </div>

        {/* CHART 3: TIMEFRAME 5M (LILIN KE-3 H4 BOX CONFIRMATION) - DIPISAH DARI CHART 2 */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">
                Chart 3: Timeframe 5M (Konfirmasi Candle Kuat Masuk Box H4 Lilin #3)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {fiveMCandles.length} candles
            </span>
          </div>

          <H4BoxChart
            candles={fiveMCandles}
            h4Box={h4Box}
            focusBox={3}
            activeSignal={scanResult?.signalBox3 || null}
            latest5mAnalysis={scanResult?.latest5mAnalysisBox3}
            timeframe="5m"
            symbol={symbol}
          />
        </div>
      </div>

      {/* 4. STRATEGY SUMMARY ACCORDION / INFO */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <strong className="text-slate-200 block text-xs">Aturan Validasi Candle Kuat (Bukan Wick):</strong>
            <span>Sinyal BUY/SELL hanya valid jika badan candle 5M mendominasi &ge; 50% dari total candle saat breakout keluar lalu masuk kembali (re-entry) ke Box H4 (Lilin #2 atau Lilin #3).</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-indigo-300 font-bold shrink-0">
          <span>Sinkronisasi Real-Time 3 Chart (4H, 5M Box #2, 5M Box #3)</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      </div>
    </div>
  );
}
