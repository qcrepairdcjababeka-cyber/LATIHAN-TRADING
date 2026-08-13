/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Candle, ScanResult } from '../types';
import { scanCandles, generateMockCandles } from '../utils/ictScanner';
import { Play, Settings, Edit, HelpCircle, Sparkles, TrendingUp, RefreshCw, Layers } from 'lucide-react';

interface SimulationSandboxProps {
  onLoadSimulatedCandles: (candles: Candle[], label: string) => void;
}

export default function SimulationSandbox({ onLoadSimulatedCandles }: SimulationSandboxProps) {
  const [selectedPreset, setSelectedPreset] = useState<'ifvg_bullish' | 'ifvg_bearish'>('ifvg_bullish');
  const [candles, setCandles] = useState<Candle[]>(() => generateMockCandles('ifvg_bullish', 18));
  const [selectedCandleIdx, setSelectedCandleIdx] = useState<number>(13); // Default pick the retest candle

  // Rescan custom candles in real-time
  const scanResult = useMemo(() => {
    return scanCandles('SANDBOX', '15m', candles);
  }, [candles]);

  const activeCandle = candles[selectedCandleIdx];

  // Adjust OHLC values of selected candle
  const updateCandleValue = (field: 'open' | 'high' | 'low' | 'close', value: number) => {
    setCandles((prev) => {
      const next = [...prev];
      const target = { ...next[selectedCandleIdx] };
      
      target[field] = Number(value);

      // Enforce candle rules (High must be maximum, Low must be minimum)
      if (field === 'high') {
        target.open = Math.min(target.open, target.high);
        target.close = Math.min(target.close, target.high);
      } else if (field === 'low') {
        target.open = Math.max(target.open, target.low);
        target.close = Math.max(target.close, target.low);
      } else {
        // adjusting open or close, ensure they stay within high/low boundaries
        target.high = Math.max(target.high, target.open, target.close);
        target.low = Math.min(target.low, target.open, target.close);
      }

      next[selectedCandleIdx] = target;
      return next;
    });
  };

  // Preset loaders
  const loadPreset = (type: 'ifvg_bullish' | 'ifvg_bearish') => {
    setSelectedPreset(type);
    const mock = generateMockCandles(type, 18);
    setCandles(mock);
    setSelectedCandleIdx(type === 'ifvg_bullish' ? 13 : 13);
  };

  const sendToMainChart = () => {
    const label = selectedPreset === 'ifvg_bullish' ? 'SIMULATION: IFVG Bullish Setup' : 'SIMULATION: IFVG Bearish Setup';
    onLoadSimulatedCandles(candles, label);
  };

  return (
    <div id="simulation-sandbox" className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <Layers className="text-indigo-400 w-5.5 h-5.5" />
          <div>
            <h3 className="text-sm font-bold text-slate-200">Sandbox Simulasi Algoritma</h3>
            <p className="text-[11px] text-slate-400">Modifikasi harga lilin secara real-time untuk melihat interaksi indikator</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-preset-ifvg-bull"
            onClick={() => loadPreset('ifvg_bullish')}
            className={`px-2.5 py-1 rounded-sm text-[11px] font-semibold tracking-wide transition ${
              selectedPreset === 'ifvg_bullish'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            IFVG Naik (Bullish)
          </button>
          <button
            id="btn-preset-ifvg-bear"
            onClick={() => loadPreset('ifvg_bearish')}
            className={`px-2.5 py-1 rounded-sm text-[11px] font-semibold tracking-wide transition ${
              selectedPreset === 'ifvg_bearish'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            IFVG Turun (Bearish)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Candle List Picker */}
        <div className="lg:col-span-4 flex flex-col gap-2 border-r border-slate-800/40 pr-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <Edit className="w-3 h-3 text-indigo-400" /> Pilih Lilin Untuk Diedit
          </span>
          <div className="grid grid-cols-6 lg:grid-cols-3 gap-1.5 max-h-[190px] overflow-y-auto pr-1">
            {candles.map((candle, idx) => {
              const isSelected = selectedCandleIdx === idx;
              const isBullish = candle.close >= candle.open;
              return (
                <button
                  key={`sim-pick-${idx}`}
                  id={`btn-sim-pick-candle-${idx}`}
                  onClick={() => setSelectedCandleIdx(idx)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-sm border text-center transition-all ${
                    isSelected
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-200 font-bold'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <span className="text-[9px] font-mono opacity-60">Lilin {idx + 1}</span>
                  <div className={`w-2.5 h-4 my-1 rounded-sm ${isBullish ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className="text-[8px] font-mono text-slate-400">{(candle.close).toFixed(0)}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Push Button */}
          <button
            id="btn-push-to-chart"
            onClick={sendToMainChart}
            className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            Muat ke Grafik Utama Scanner
          </button>
        </div>

        {/* OHLC Sliders */}
        <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800 p-3.5 rounded-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-xs font-bold text-slate-300">
                Kontrol Nilai Lilin <span className="text-indigo-400 font-mono">#{selectedCandleIdx + 1}</span>
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-sm font-bold font-mono ${
                activeCandle.close >= activeCandle.open ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
                {activeCandle.close >= activeCandle.open ? 'BULLISH' : 'BEARISH'}
              </span>
            </div>

            {/* Slider Controls */}
            <div className="space-y-3.5">
              {[
                { field: 'high', label: 'High (Tertinggi)', color: 'text-emerald-400' },
                { field: 'open', label: 'Open (Buka)', color: 'text-slate-300' },
                { field: 'close', label: 'Close (Tutup)', color: 'text-slate-300' },
                { field: 'low', label: 'Low (Terendah)', color: 'text-rose-400' },
              ].map(({ field, label, color }) => {
                const val = activeCandle[field as 'open' | 'high' | 'low' | 'close'];
                const min = activeCandle.low - 500;
                const max = activeCandle.high + 500;
                
                return (
                  <div key={field} className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-medium">{label}</span>
                      <span className={`${color} font-mono font-bold`}>{val.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        id={`btn-sim-dec-${field}`}
                        onClick={() => updateCandleValue(field as any, val - 25)}
                        className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-[10px] rounded-sm font-mono font-bold hover:bg-slate-850"
                      >
                        -
                      </button>
                      <input
                        id={`input-sim-slider-${field}`}
                        type="range"
                        min={val - 300}
                        max={val + 300}
                        step={5}
                        value={val}
                        onChange={(e) => updateCandleValue(field as any, e.target.valueAsNumber)}
                        className="flex-1 accent-indigo-500 h-1 rounded-lg cursor-pointer bg-slate-800"
                      />
                      <button
                        id={`btn-sim-inc-${field}`}
                        onClick={() => updateCandleValue(field as any, val + 25)}
                        className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-[10px] rounded-sm font-mono font-bold hover:bg-slate-850"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 text-[10px] text-slate-400/90 leading-relaxed bg-indigo-950/15 border border-indigo-500/10 p-2.5 rounded-sm flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <span>TIPS: Ubah <strong>High</strong> Lilin {selectedPreset === 'ifvg_bullish' ? '3 (Lilin 3)' : '3'} atau <strong>Low</strong> Lilin 1 untuk membuat celah (FVG) lebih lebar atau sempit!</span>
          </div>
        </div>

        {/* Real-Time Scanner Monitor */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-lg flex-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-indigo-400" /> Hasil Deteksi Sandbox
            </span>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-850">
                <span className="text-[10px] text-slate-400">Total FVG</span>
                <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">
                  {scanResult.fvgs.filter(f => !f.isInverted).length}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-850">
                <span className="text-[10px] text-slate-400">Inverted FVG (IFG)</span>
                <span className="text-xs font-bold font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-sm">
                  {scanResult.fvgs.filter(f => f.isInverted).length}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-850">
                <span className="text-[10px] text-slate-400">Order Blocks (OB)</span>
                <span className="text-xs font-bold font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-sm">
                  {scanResult.orderBlocks.length}
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-850">
                <span className="text-[10px] text-slate-400">Struktur MSS/BOS</span>
                <span className="text-xs font-bold font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-sm">
                  {scanResult.marketStructures.length}
                </span>
              </div>
            </div>
          </div>

          <div className={`p-3 rounded-lg border text-center ${
            scanResult.activeSignal
              ? scanResult.activeSignal.type === 'BUY'
                ? 'bg-emerald-950/25 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-950/25 border-rose-500/20 text-rose-400'
              : 'bg-slate-900/50 border-slate-800 text-slate-400'
          }`}>
            <span className="text-[9px] uppercase font-bold tracking-wider opacity-60">Status Sinyal Sandbox</span>
            <div className="text-xs font-bold mt-1 uppercase flex items-center justify-center gap-1.5">
              {scanResult.activeSignal ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5" />
                  {scanResult.activeSignal.type} @ {scanResult.activeSignal.setupType}
                </>
              ) : (
                'Menunggu Setup Matang'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
