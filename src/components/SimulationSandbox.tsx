/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Layers,
  Flame,
  Crosshair,
  Clock,
  Lock,
  Zap,
  Sparkles,
  Compass
} from 'lucide-react';
import { formatPrice } from '../utils/stfStrategyScanner';

export default function SimulationSandbox() {
  const [preset, setPreset] = useState<'bullish_crt' | 'bearish_crt' | 'deep_soup' | 'eq_scalp'>('bullish_crt');

  // Interactive 9 AM CRT Model States
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [rangeWidth, setRangeWidth] = useState<number>(20.0); // 8-9 AM range size in $
  const [sweepClearance, setSweepClearance] = useState<number>(8.0); // 9 AM manipulation wick past RH/RL
  const [reEntryConfirmed, setReEntryConfirmed] = useState<boolean>(true); // Candle closed back inside 8 AM range
  const [mssConfirmed, setMssConfirmed] = useState<boolean>(true); // 5M Market Structure Shift
  const [retestActive, setRetestActive] = useState<boolean>(true); // Retest at boundary / FVG
  const [currentPrice, setCurrentPrice] = useState<number>(2920.0);

  const applyPreset = (type: 'bullish_crt' | 'bearish_crt' | 'deep_soup' | 'eq_scalp') => {
    setPreset(type);
    if (type === 'bullish_crt') {
      setDirection('BUY');
      setCurrentPrice(2920.0);
      setRangeWidth(22.0);
      setSweepClearance(7.5);
      setReEntryConfirmed(true);
      setMssConfirmed(true);
      setRetestActive(true);
    } else if (type === 'bearish_crt') {
      setDirection('SELL');
      setCurrentPrice(2980.0);
      setRangeWidth(25.0);
      setSweepClearance(9.0);
      setReEntryConfirmed(true);
      setMssConfirmed(true);
      setRetestActive(true);
    } else if (type === 'deep_soup') {
      setDirection('BUY');
      setCurrentPrice(2890.0);
      setRangeWidth(30.0);
      setSweepClearance(18.0);
      setReEntryConfirmed(true);
      setMssConfirmed(true);
      setRetestActive(true);
    } else if (type === 'eq_scalp') {
      setDirection('BUY');
      setCurrentPrice(2935.0);
      setRangeWidth(16.0);
      setSweepClearance(5.0);
      setReEntryConfirmed(true);
      setMssConfirmed(true);
      setRetestActive(true);
    }
  };

  // 9 AM CRT Simulation Calculation
  const simulationResult = useMemo(() => {
    const isBuy = direction === 'BUY';
    let score = 0;
    const stages: { label: string; valid: boolean; note: string }[] = [];

    // Benchmark Range parameters
    const rangeLow = isBuy ? currentPrice : currentPrice - rangeWidth;
    const rangeHigh = isBuy ? currentPrice + rangeWidth : currentPrice;
    const equilibrium = (rangeHigh + rangeLow) / 2;

    // Stage 1: Current Running Candle Range (Rentang Lilin Berjalan)
    score += 25;
    stages.push({
      label: '1. Rentang Lilin Berjalan (Current Candle)',
      valid: true,
      note: `Rentang acuan lilin berjalan $${rangeLow.toFixed(1)} - $${rangeHigh.toFixed(1)} (Lebar: $${rangeWidth.toFixed(1)}, EQ: $${equilibrium.toFixed(1)}).`
    });

    // Stage 2: ICT Turtle Soup Sweep on Current Running Candle
    const sweepPrice = isBuy ? rangeLow - sweepClearance : rangeHigh + sweepClearance;
    score += 25;
    stages.push({
      label: `2. ICT Turtle Soup Sweep (${isBuy ? 'SSL' : 'BSL'})`,
      valid: true,
      note: `Harga menyapu likuiditas sedalam $${sweepClearance.toFixed(1)} di luar rentang lilin berjalan.`
    });

    // Stage 3: Re-Entry Confirmed
    if (reEntryConfirmed) {
      score += 25;
      stages.push({
        label: '3. Re-Entry Body Lilin Berjalan',
        valid: true,
        note: 'Candle ditutup kembali ke dalam rentang lilin yang sedang berjalan, memvalidasi fakeout manipulasi institusi.'
      });
    } else {
      stages.push({
        label: '3. Re-Entry Body Lilin Berjalan',
        valid: false,
        note: 'Harga masih berada di luar rentang, belum ada konfirmasi re-entry.'
      });
    }

    // Stage 4: 5M MSS & Retest
    if (mssConfirmed && retestActive) {
      score += 25;
      stages.push({
        label: '4. 5M MSS & Retest Entry',
        valid: true,
        note: 'Perpindahan struktur internal 5M terkonfirmasi & retest titik entri aktif.'
      });
    } else {
      stages.push({
        label: '4. 5M MSS & Retest Entry',
        valid: false,
        note: 'Menunggu konfirmasi perpindahan struktur atau retest batas rentang.'
      });
    }

    // Target Calculations
    const entryPrice = isBuy ? rangeLow : rangeHigh;
    const stopLoss = isBuy ? (sweepPrice - 1.5) : (sweepPrice + 1.5);
    const risk = Math.abs(entryPrice - stopLoss);
    const tp1 = equilibrium;
    const tp2 = isBuy ? rangeHigh : rangeLow;
    const reward = Math.abs(tp2 - entryPrice);
    const rr = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : 3.5;

    const isExecutionReady = score >= 85 && reEntryConfirmed && retestActive;

    return {
      score,
      stages,
      isExecutionReady,
      rangeHigh,
      rangeLow,
      equilibrium,
      sweepPrice,
      entryPrice,
      stopLoss,
      tp1,
      tp2,
      rr,
      setupName: isBuy ? 'ICT + CRT BULLISH (SSL SWEEP & BISI)' : 'ICT + CRT BEARISH (BSL SWEEP & SIBI)',
      statusLabel: isExecutionReady ? '★ ICT + CRT ENTRY SIAP DIEKSEKUSI' : 'MENUNGGU KONFIRMASI LENGKAP'
    };
  }, [direction, rangeWidth, sweepClearance, reEntryConfirmed, mssConfirmed, retestActive, currentPrice]);

  return (
    <div id="simulation-sandbox-container" className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] tracking-wider uppercase">
                SIMULATOR EKSKLUSIF
              </span>
              <h2 className="text-lg font-black text-white tracking-tight">
                Simulator Model Entri ICT + CRT (Candle Range Theory &amp; ICT)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Uji skenario Model Entri ICT + CRT pada Candle yang Berjalan Saat Ini (Current Running Candle), manipulasi ICT Turtle Soup Sweep (SSL / BSL), konfirmasi re-entry body lilin, 5M Displacement MSS, retest Fair Value Gap (FVG BISI/SIBI), serta target konsisten (50% EQ &amp; DOL).
            </p>
          </div>
        </div>

        {/* PRESET BUTTONS */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'bullish_crt', label: '🟢 Bullish ICT + CRT', icon: TrendingUp },
            { id: 'bearish_crt', label: '🔴 Bearish ICT + CRT', icon: TrendingDown },
            { id: 'deep_soup', label: '⚡ ICT Turtle Soup', icon: Zap },
            { id: 'eq_scalp', label: '🎯 50% EQ Scalp', icon: Target },
          ].map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                id={`btn-preset-${p.id}`}
                onClick={() => applyPreset(p.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  preset === p.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: INTERACTIVE CONTROLS */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Konfigurasi Parameter Model ICT + CRT</span>
          </h3>

          {/* Toggle 1: Direction Buy vs Sell */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">1. Arah Manipulasi Lilin Berjalan</div>
              <div className="text-[11px] text-slate-400">Pilih jenis ICT Turtle Soup (SSL vs BSL)</div>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setDirection('BUY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                  direction === 'BUY' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                SSL (BUY)
              </button>
              <button
                onClick={() => setDirection('SELL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                  direction === 'SELL' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                BSL (SELL)
              </button>
            </div>
          </div>

          {/* Slider 2: Mother Candle Range Width */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">2. Lebar Rentang Lilin Berjalan</span>
              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono font-black border border-indigo-500/40">
                ${rangeWidth.toFixed(1)} Poin
              </span>
            </div>
            <input
              type="range"
              min="8"
              max="60"
              value={rangeWidth}
              onChange={(e) => setRangeWidth(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Sempit ($8.0)</span>
              <span>Normal ($25.0)</span>
              <span>Lebar ($60.0)</span>
            </div>
          </div>

          {/* Slider 3: Sweep Clearance Depth */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">3. Kedalaman Sapuan Likuiditas ICT (Turtle Soup)</span>
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono font-black border border-amber-500/40">
                ${sweepClearance.toFixed(1)} Poin
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="30"
              value={sweepClearance}
              onChange={(e) => setSweepClearance(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Tipis ($2.0)</span>
              <span>Ideal ($8.0)</span>
              <span>Deep Hunt ($30.0)</span>
            </div>
          </div>

          {/* Toggle 4: Re-Entry Confirmed */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">4. Re-Entry ke Dalam Rentang CRT</div>
              <div className="text-[11px] text-slate-400">Candle close kembali ke dalam body lilin berjalan</div>
            </div>
            <button
              onClick={() => setReEntryConfirmed(!reEntryConfirmed)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                reEntryConfirmed ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {reEntryConfirmed ? 'VALID (+25%)' : 'BELUM'}
            </button>
          </div>

          {/* Toggle 5: 5M Market Structure Shift (MSS) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">5. 5M Displacement MSS</div>
              <div className="text-[11px] text-slate-400">Penembusan swing internal 5M dengan displacement</div>
            </div>
            <button
              onClick={() => setMssConfirmed(!mssConfirmed)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                mssConfirmed ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {mssConfirmed ? 'MSS SHIFT (+25%)' : 'BELUM'}
            </button>
          </div>

          {/* Toggle 6: Retest Active */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">6. Retest Zona FVG / Boundary</div>
              <div className="text-[11px] text-slate-400">Pullback menyentuh Fair Value Gap atau boundary</div>
            </div>
            <button
              onClick={() => setRetestActive(!retestActive)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                retestActive ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {retestActive ? 'ZONA RETEST (+25%)' : 'MENUNGGU'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: REAL-TIME SIMULATOR RESULTS & VISUAL DIAGRAM */}
        <div className="lg:col-span-7 space-y-5">
          {/* Status & Score Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                simulationResult.isExecutionReady
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {simulationResult.statusLabel}
              </span>
              <h3 className="text-base font-black text-white mt-1.5">
                {simulationResult.setupName}
              </h3>
              <p className="text-xs text-slate-400">
                Kesesuaian Aturan Anatomi ICT + CRT: <strong className="text-amber-400">{simulationResult.score}%</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Risk-Reward</div>
                <div className="text-xl font-black text-emerald-400 font-mono">
                  1:{simulationResult.rr}R
                </div>
              </div>
            </div>
          </div>

          {/* Interactive SVG Diagram representing ICT + CRT */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-inner space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Simulasi Visual Anatomi ICT + CRT</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Current Running Candle</span>
            </div>

            <div className="relative h-56 w-full bg-slate-900/50 rounded-xl overflow-hidden flex items-center justify-center p-4">
              <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                {/* Current Running Candle Range Box */}
                <rect
                  x="80"
                  y="40"
                  width="180"
                  height="120"
                  fill="rgba(99, 102, 241, 0.08)"
                  stroke="rgba(99, 102, 241, 0.4)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  rx="4"
                />

                {/* Range High Line */}
                <line x1="60" y1="40" x2="560" y2="40" stroke="#818cf8" strokeWidth="1.5" />
                <text x="65" y="32" fill="#818cf8" fontSize="10" fontWeight="bold">RH: ${simulationResult.rangeHigh.toFixed(1)}</text>

                {/* 50% Equilibrium Line */}
                <line x1="60" y1="100" x2="560" y2="100" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                <text x="65" y="94" fill="#cbd5e1" fontSize="10" fontWeight="bold">50% EQ (TP1): ${simulationResult.equilibrium.toFixed(1)}</text>

                {/* Range Low Line */}
                <line x1="60" y1="160" x2="560" y2="160" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="65" y="176" fill="#f59e0b" fontSize="10" fontWeight="bold">RL: ${simulationResult.rangeLow.toFixed(1)}</text>

                {/* Running Candle Body */}
                <rect x="140" y="55" width="40" height="90" fill="#334155" rx="2" />
                <line x1="160" y1="40" x2="160" y2="160" stroke="#64748b" strokeWidth="1.5" />
                <text x="110" y="195" fill="#64748b" fontSize="9" fontWeight="bold">Lilin Berjalan (CRT Range)</text>

                {/* Manipulation Candle */}
                {direction === 'BUY' ? (
                  // Bullish Turtle Soup: Sweeps below RL then closes back up
                  <g>
                    {/* Wick extending down past RL */}
                    <line x1="280" y1="60" x2="280" y2="188" stroke="#f43f5e" strokeWidth="2" />
                    {/* Candle Body closed inside range */}
                    <rect x="265" y="70" width="30" height="80" fill="#10b981" rx="2" />
                    {/* Sweep highlight circle */}
                    <circle cx="280" cy="188" r="4" fill="#f43f5e" />
                    <text x="290" y="192" fill="#f43f5e" fontSize="9" fontWeight="bold">Turtle Soup Sweep: ${simulationResult.sweepPrice.toFixed(1)}</text>
                    <text x="240" y="25" fill="#10b981" fontSize="9" fontWeight="bold">Sweep &amp; Re-Entry</text>

                    {/* Subsequent 5M impulse to 50% EQ & RH */}
                    <path
                      d="M 320 150 Q 380 120 440 100 T 520 45"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />
                    <circle cx="440" cy="100" r="4" fill="#e2e8f0" />
                    <circle cx="520" cy="45" r="5" fill="#10b981" />
                    <text x="530" y="50" fill="#10b981" fontSize="10" fontWeight="bold">TP2 (RH)</text>
                  </g>
                ) : (
                  // Bearish Turtle Soup: Sweeps above RH then closes back down
                  <g>
                    {/* Wick extending up past RH */}
                    <line x1="280" y1="12" x2="280" y2="140" stroke="#f43f5e" strokeWidth="2" />
                    {/* Candle Body closed inside range */}
                    <rect x="265" y="50" width="30" height="80" fill="#f43f5e" rx="2" />
                    {/* Sweep highlight circle */}
                    <circle cx="280" cy="12" r="4" fill="#f43f5e" />
                    <text x="290" y="16" fill="#f43f5e" fontSize="9" fontWeight="bold">Turtle Soup Sweep: ${simulationResult.sweepPrice.toFixed(1)}</text>
                    <text x="240" y="195" fill="#f43f5e" fontSize="9" fontWeight="bold">Sweep &amp; Re-Entry</text>

                    {/* Subsequent 5M impulse to 50% EQ & RL */}
                    <path
                      d="M 320 60 Q 380 90 440 100 T 520 155"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />
                    <circle cx="440" cy="100" r="4" fill="#e2e8f0" />
                    <circle cx="520" cy="155" r="5" fill="#f43f5e" />
                    <text x="530" y="160" fill="#f43f5e" fontSize="10" fontWeight="bold">TP2 (RL)</text>
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Target Terkunci Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Titik Entri Retest</div>
              <div className="text-sm font-black text-amber-300 font-mono mt-1">
                ${simulationResult.entryPrice.toFixed(1)}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Stop Loss (SL)</div>
              <div className="text-sm font-black text-rose-400 font-mono mt-1">
                ${simulationResult.stopLoss.toFixed(1)}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-bold uppercase">TP1 (50% EQ)</div>
              <div className="text-sm font-black text-slate-200 font-mono mt-1">
                ${simulationResult.tp1.toFixed(1)}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-bold uppercase">TP2 (Opposing Boundary)</div>
              <div className="text-sm font-black text-emerald-400 font-mono mt-1">
                ${simulationResult.tp2.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Validation Checklist Steps */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Checklist Kepatuhan SOP Model ICT + CRT
            </h4>
            <div className="space-y-2.5">
              {simulationResult.stages.map((stg, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  {stg.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className={`font-bold ${stg.valid ? 'text-white' : 'text-slate-400'}`}>
                      {stg.label}
                    </span>
                    <p className="text-[11px] text-slate-400">{stg.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
