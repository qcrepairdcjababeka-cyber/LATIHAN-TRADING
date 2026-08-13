/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Candle, FVG, OrderBlock, MarketStructure, TradingSignal, Inducement, CISD } from '../types';
import { scanCandles, generateMockCandles } from '../utils/ictScanner';
import IctChart from './IctChart';
import { 
  LayoutGrid, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Zap, 
  Check, 
  Layers, 
  TrendingUp, 
  TrendingDown,
  Sparkles,
  Sliders,
  Link,
  Link2,
  X
} from 'lucide-react';

interface PanelConfig {
  id: number;
  symbol: string;
  timeframe: string;
}

interface PanelData {
  candles: Candle[];
  fvgs: FVG[];
  orderBlocks: OrderBlock[];
  marketStructures: MarketStructure[];
  inducements: Inducement[];
  cisds: CISD[];
  activeSignal: TradingSignal | null;
  trend: 'bullish' | 'bearish' | 'sideways';
  loading: boolean;
  lastUpdated: Date;
}

interface MultiPanelGridProps {
  currentSymbol?: string;
  onSymbolChange?: (symbol: string) => void;
  tickers: { value: string; label: string }[];
  timeframes: { value: string; label: string }[];
  onSelectPattern?: (id: string | null) => void;
  selectedPatternId?: string | null;
}

export default function MultiPanelGrid({
  currentSymbol,
  onSymbolChange,
  tickers,
  timeframes,
  onSelectPattern,
  selectedPatternId = null,
}: MultiPanelGridProps) {
  // Symbol synchronization state (defaults to true)
  const [syncSymbols, setSyncSymbols] = useState<boolean>(true);

  // Default 4 panel config (HTF Context: 1d, 1h -> LTF Execution: 15m, 5m)
  const initialSymbol = currentSymbol || 'BTCUSDT';
  const [panels, setPanels] = useState<PanelConfig[]>([
    { id: 0, symbol: initialSymbol, timeframe: '5m' },
    { id: 1, symbol: initialSymbol, timeframe: '15m' },
    { id: 2, symbol: initialSymbol, timeframe: '1h' },
    { id: 3, symbol: initialSymbol, timeframe: '1d' },
  ]);

  // Sync with currentSymbol if external prop changes and sync is enabled
  useEffect(() => {
    if (currentSymbol && syncSymbols) {
      setPanels((prev) => prev.map((p) => ({ ...p, symbol: currentSymbol })));
      setMtfSymbol(currentSymbol);
    }
  }, [currentSymbol, syncSymbols]);

  // Panel Data state
  const [panelDataMap, setPanelDataMap] = useState<Record<number, PanelData>>({
    0: { candles: [], fvgs: [], orderBlocks: [], marketStructures: [], inducements: [], activeSignal: null, trend: 'sideways', loading: true, lastUpdated: new Date() },
    1: { candles: [], fvgs: [], orderBlocks: [], marketStructures: [], inducements: [], activeSignal: null, trend: 'sideways', loading: true, lastUpdated: new Date() },
    2: { candles: [], fvgs: [], orderBlocks: [], marketStructures: [], inducements: [], activeSignal: null, trend: 'sideways', loading: true, lastUpdated: new Date() },
    3: { candles: [], fvgs: [], orderBlocks: [], marketStructures: [], inducements: [], activeSignal: null, trend: 'sideways', loading: true, lastUpdated: new Date() },
  });

  // Selected preset tag
  const [activePreset, setActivePreset] = useState<'mtf' | 'majors' | 'l1' | 'memes' | 'custom'>('mtf');

  // Primary symbol for MTF preset
  const [mtfSymbol, setMtfSymbol] = useState<string>('BTCUSDT');

  // Panel focus/maximize modal
  const [maximizedPanelId, setMaximizedPanelId] = useState<number | null>(null);

  // Layout mode: 2x2 (4 charts) vs 2x1 vs 1x2
  const [gridColumns, setGridColumns] = useState<'grid-cols-1 md:grid-cols-2' | 'grid-cols-1 md:grid-cols-1' | 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'>('grid-cols-1 md:grid-cols-2');

  // Fetch market data for a specific panel
  const fetchPanelData = async (panelId: number, sym: string, tf: string, silent = false) => {
    if (!silent) {
      setPanelDataMap((prev) => ({
        ...prev,
        [panelId]: { ...(prev[panelId] || {}), loading: true },
      }));
    }

    try {
      const response = await fetch(`/api/binance/candles?symbol=${sym}&interval=${tf}&limit=120`);
      const data = await response.json();

      if (data.success && data.candles && data.candles.length > 0) {
        const scanResult = scanCandles(sym, tf, data.candles);
        setPanelDataMap((prev) => ({
          ...prev,
          [panelId]: {
            candles: data.candles,
            fvgs: scanResult.fvgs,
            orderBlocks: scanResult.orderBlocks,
            marketStructures: scanResult.marketStructures,
            inducements: scanResult.inducements,
            cisds: scanResult.cisds || [],
            activeSignal: scanResult.activeSignal,
            trend: scanResult.trend,
            loading: false,
            lastUpdated: new Date(),
          },
        }));
      } else {
        throw new Error('Fallback required');
      }
    } catch {
      // Fallback generator
      const mockType = sym.includes('BTC') ? 'ifvg_bullish' : 'ifvg_bearish';
      const mock = generateMockCandles(mockType, 100);
      const scanResult = scanCandles(sym, tf, mock);

      setPanelDataMap((prev) => ({
        ...prev,
        [panelId]: {
          candles: mock,
          fvgs: scanResult.fvgs,
          orderBlocks: scanResult.orderBlocks,
          marketStructures: scanResult.marketStructures,
          inducements: scanResult.inducements,
          cisds: scanResult.cisds || [],
          activeSignal: scanResult.activeSignal,
          trend: scanResult.trend,
          loading: false,
          lastUpdated: new Date(),
        },
      }));
    }
  };

  // Sync refresh all 4 panels
  const refreshAllPanels = (silent = false) => {
    panels.forEach((p) => {
      fetchPanelData(p.id, p.symbol, p.timeframe, silent);
    });
  };

  // Initial load when panels configuration changes
  useEffect(() => {
    refreshAllPanels(false);
  }, [panels]);

  // Live polling / ticking
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAllPanels(true);
    }, 12000); // refresh silently every 12 seconds
    return () => clearInterval(interval);
  }, [panels]);

  // Handle Preset Changes
  const applyPresetMTF = (sym: string) => {
    setMtfSymbol(sym);
    setActivePreset('mtf');
    setPanels([
      { id: 0, symbol: sym, timeframe: '5m' },
      { id: 1, symbol: sym, timeframe: '15m' },
      { id: 2, symbol: sym, timeframe: '1h' },
      { id: 3, symbol: sym, timeframe: '1d' },
    ]);
  };

  const applyPresetMajors = () => {
    setActivePreset('majors');
    setPanels([
      { id: 0, symbol: 'BTCUSDT', timeframe: '15m' },
      { id: 1, symbol: 'ETHUSDT', timeframe: '15m' },
      { id: 2, symbol: 'SOLUSDT', timeframe: '15m' },
      { id: 3, symbol: 'BNBUSDT', timeframe: '15m' },
    ]);
  };

  const applyPresetL1 = () => {
    setActivePreset('l1');
    setPanels([
      { id: 0, symbol: 'SUIUSDT', timeframe: '15m' },
      { id: 1, symbol: 'NEARUSDT', timeframe: '15m' },
      { id: 2, symbol: 'AVAXUSDT', timeframe: '15m' },
      { id: 3, symbol: 'FETUSDT', timeframe: '15m' },
    ]);
  };

  const applyPresetMemes = () => {
    setActivePreset('memes');
    setPanels([
      { id: 0, symbol: 'DOGEUSDT', timeframe: '15m' },
      { id: 1, symbol: 'SHIBUSDT', timeframe: '15m' },
      { id: 2, symbol: 'PEPEUSDT', timeframe: '15m' },
      { id: 3, symbol: 'WIFUSDT', timeframe: '15m' },
    ]);
  };

  const updatePanelConfig = (panelId: number, key: 'symbol' | 'timeframe', value: string) => {
    setActivePreset('custom');
    if (key === 'symbol') {
      if (onSymbolChange) {
        onSymbolChange(value);
      }
      setMtfSymbol(value);
      if (syncSymbols || panelId === 0) {
        // Changing Chart 1 or with sync active changes ALL charts to this pair!
        setPanels((prev) => prev.map((p) => ({ ...p, symbol: value })));
        return;
      }
    }
    setPanels((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, [key]: value } : p))
    );
  };

  const changeAllTimeframes = (tf: string) => {
    setActivePreset('custom');
    setPanels((prev) => prev.map((p) => ({ ...p, timeframe: tf })));
  };

  return (
    <div id="multi-panel-container" className="w-full space-y-4 animate-fade-in">
      {/* 1. CONTROL HEADER BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2 text-indigo-400 font-bold text-xs">
            <LayoutGrid className="w-4 h-4" />
            <span>Preset Multi-Chart (4 Grid):</span>
          </div>

          <button
            onClick={() => applyPresetMTF(mtfSymbol)}
            className={`px-3 py-1.5 text-xs font-bold rounded border transition-all flex items-center gap-1.5 cursor-pointer ${
              activePreset === 'mtf'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-300" />
            <span>4 Timeframe (1 Aset)</span>
          </button>

          <button
            onClick={applyPresetMajors}
            className={`px-3 py-1.5 text-xs font-bold rounded border transition-all flex items-center gap-1.5 cursor-pointer ${
              activePreset === 'majors'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Top 4 Crypto Majors</span>
          </button>

          <button
            onClick={applyPresetL1}
            className={`px-3 py-1.5 text-xs font-bold rounded border transition-all flex items-center gap-1.5 cursor-pointer ${
              activePreset === 'l1'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Layer 1 & AI Ecosystem</span>
          </button>

          <button
            onClick={applyPresetMemes}
            className={`px-3 py-1.5 text-xs font-bold rounded border transition-all flex items-center gap-1.5 cursor-pointer ${
              activePreset === 'memes'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
            <span>Top Memecoins</span>
          </button>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Symbol Sync Toggle */}
          <button
            onClick={() => {
              const nextSync = !syncSymbols;
              setSyncSymbols(nextSync);
              if (nextSync && panels[0]) {
                const chart1Symbol = panels[0].symbol;
                setPanels((prev) => prev.map((p) => ({ ...p, symbol: chart1Symbol })));
              }
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded border transition-all flex items-center gap-1.5 cursor-pointer ${
              syncSymbols
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
            title={syncSymbols ? "Ubah Chart 1 -> Semua chart otomatis mengikuti" : "Pasangan tiap chart terpisah (Independen)"}
          >
            <Link className={`w-3.5 h-3.5 ${syncSymbols ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>{syncSymbols ? 'Sinkron Pasangan: AKTIF' : 'Sinkron Pasangan: MATI'}</span>
          </button>

          {/* Quick MTF Symbol picker if MTF preset is active */}
          {activePreset === 'mtf' && (
            <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              <label htmlFor="mtf-asset-select" className="text-[11px] text-slate-400 font-semibold">Aset Utama:</label>
              <select
                id="mtf-asset-select"
                value={mtfSymbol}
                onChange={(e) => applyPresetMTF(e.target.value)}
                className="bg-transparent text-xs font-extrabold text-indigo-300 focus:outline-none cursor-pointer"
              >
                {tickers.map((t) => (
                  <option key={t.value} value={t.value} className="bg-slate-900 text-slate-100">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Change All Timeframes */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-[11px] text-slate-400 font-semibold">Set Semua TF:</span>
            {['5m', '15m', '1h', '4h'].map((tf) => (
              <button
                key={`all-tf-${tf}`}
                onClick={() => changeAllTimeframes(tf)}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded text-slate-300 hover:bg-slate-800 hover:text-white transition"
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Refresh All */}
          <button
            onClick={() => refreshAllPanels(false)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Pindai 4 Panel</span>
          </button>
        </div>
      </div>

      {/* 2. THE 4-PANEL GRID DISPLAY (2x2) */}
      <div className={`grid ${gridColumns} gap-4`}>
        {panels.map((panelConfig) => {
          const data = panelDataMap[panelConfig.id] || {
            candles: [],
            fvgs: [],
            orderBlocks: [],
            marketStructures: [],
            inducements: [],
            activeSignal: null,
            trend: 'sideways',
            loading: true,
            lastUpdated: new Date(),
          };

          const lastCandle = data.candles[data.candles.length - 1];
          const currentPrice = lastCandle ? lastCandle.close : 0;
          const activeIFGCount = data.fvgs.filter((f) => f.isInverted).length;

          return (
            <div
              key={`panel-card-${panelConfig.id}`}
              className={`bg-slate-900 rounded-xl border transition-all duration-300 shadow-xl flex flex-col overflow-hidden relative ${
                data.activeSignal
                  ? data.activeSignal.type === 'BUY'
                    ? 'border-emerald-500/50 shadow-emerald-950/20'
                    : 'border-rose-500/50 shadow-rose-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Panel Top Control Header */}
              <div className="bg-slate-950/80 px-3.5 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                {/* Symbol & Timeframe Dropdowns */}
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded ${panelConfig.id === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                    Chart {panelConfig.id + 1}{panelConfig.id === 0 ? ' (Utama)' : ''}
                  </span>
                  <select
                    value={panelConfig.symbol}
                    onChange={(e) => updatePanelConfig(panelConfig.id, 'symbol', e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-100 rounded text-xs font-bold px-2 py-1 focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {tickers.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.value}
                      </option>
                    ))}
                  </select>

                  <select
                    value={panelConfig.timeframe}
                    onChange={(e) => updatePanelConfig(panelConfig.id, 'timeframe', e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-indigo-400 rounded text-xs font-bold px-1.5 py-1 focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {timeframes.map((tf) => (
                      <option key={tf.value} value={tf.value}>
                        {tf.value}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Live Price & Signal Indicator */}
                <div className="flex items-center gap-2">
                  {currentPrice > 0 && (
                    <span className="text-xs font-mono font-extrabold text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </span>
                  )}

                  {data.activeSignal ? (
                    <span
                      className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1 border animate-pulse ${
                        data.activeSignal.type === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {data.activeSignal.type === 'BUY' ? (
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-rose-400" />
                      )}
                      <span>{data.activeSignal.type} IFG</span>
                    </span>
                  ) : activeIFGCount > 0 ? (
                    <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {activeIFGCount} IFG
                    </span>
                  ) : null}

                  {/* Refresh individual panel */}
                  <button
                    onClick={() => fetchPanelData(panelConfig.id, panelConfig.symbol, panelConfig.timeframe)}
                    title="Refresh panel ini"
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${data.loading ? 'animate-spin text-indigo-400' : ''}`} />
                  </button>

                  {/* Maximize panel modal */}
                  <button
                    onClick={() => setMaximizedPanelId(panelConfig.id)}
                    title="Perbesar Chart Ini"
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chart Stage */}
              <div className="relative flex-1 bg-slate-950 min-h-[320px] flex items-center justify-center">
                {data.loading ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-16">
                    <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                    <span className="text-xs font-mono text-slate-400">Pindai Algoritma ICT...</span>
                  </div>
                ) : (
                  <IctChart
                    candles={data.candles}
                    fvgs={data.fvgs}
                    orderBlocks={data.orderBlocks}
                    marketStructures={data.marketStructures}
                    inducements={data.inducements}
                    cisds={data.cisds}
                    activeSignal={data.activeSignal}
                    selectedPatternId={selectedPatternId}
                    onSelectPattern={onSelectPattern || (() => {})}
                    timeframe={panelConfig.timeframe}
                  />
                )}
              </div>

              {/* Panel Footer Summary */}
              <div className="bg-slate-950/90 px-3 py-2 border-t border-slate-800/80 flex items-center justify-between text-[10.5px] font-mono text-slate-400">
                <div className="flex items-center gap-3">
                  <span>
                    IFG: <strong className="text-indigo-300">{activeIFGCount}</strong>
                  </span>
                  <span>
                    OB: <strong className="text-amber-300">{data.orderBlocks.length}</strong>
                  </span>
                  <span>
                    IDM: <strong className="text-emerald-300">{data.inducements.length}</strong>
                  </span>
                </div>

                <div className="truncate max-w-[180px] text-right font-sans text-slate-300">
                  {data.activeSignal ? (
                    <span className="font-bold text-indigo-300 truncate">
                      {data.activeSignal.setupType}
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">Netral (Memindai IFG)</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. MAXIMIZED PANEL MODAL (If user clicks zoom on any panel) */}
      {maximizedPanelId !== null && (() => {
        const pConfig = panels.find((p) => p.id === maximizedPanelId) || panels[0];
        const pData = panelDataMap[maximizedPanelId] || {
          candles: [],
          fvgs: [],
          orderBlocks: [],
          marketStructures: [],
          inducements: [],
          cisds: [],
          activeSignal: null,
          trend: 'sideways',
          loading: false,
          lastUpdated: new Date(),
        };

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 md:p-8 flex flex-col justify-center items-center animate-fade-in">
            <div className="w-full max-w-6xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 px-2.5 py-1 rounded text-xs font-bold text-white">
                    FOKUS PANEL #{maximizedPanelId + 1}
                  </div>
                  <h3 className="text-base font-bold text-slate-100 font-sans">
                    {pConfig.symbol} - Timeframe {pConfig.timeframe}
                  </h3>
                  {pData.activeSignal && (
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      {pData.activeSignal.type} ACTIVE SIGNAL
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setMaximizedPanelId(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Chart Body */}
              <div className="p-4 bg-slate-950 flex-1 overflow-auto">
                <IctChart
                  candles={pData.candles}
                  fvgs={pData.fvgs}
                  orderBlocks={pData.orderBlocks}
                  marketStructures={pData.marketStructures}
                  inducements={pData.inducements}
                  cisds={pData.cisds}
                  activeSignal={pData.activeSignal}
                  selectedPatternId={selectedPatternId}
                  onSelectPattern={onSelectPattern || (() => {})}
                  timeframe={pConfig.timeframe}
                />
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-sans">
                <div>
                  <span>Dideteksi </span>
                  <strong className="text-slate-200">{pData.fvgs.length} FVGs/IFGs</strong>,{' '}
                  <strong className="text-slate-200">{pData.orderBlocks.length} Order Blocks</strong>,{' '}
                  <strong className="text-slate-200">{pData.inducements.length} Inducements (IDM)</strong>
                </div>

                <button
                  onClick={() => setMaximizedPanelId(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded cursor-pointer"
                >
                  Tutup Mode Fokus
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
