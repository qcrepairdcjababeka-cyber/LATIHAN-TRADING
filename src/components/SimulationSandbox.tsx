/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Layers,
  Flame,
  Crosshair,
  Clock,
  Award,
  Hash,
  Compass,
  Sliders
} from 'lucide-react';
import { formatPrice } from '../utils/stfStrategyScanner';

export default function SimulationSandbox() {
  const [preset, setPreset] = useState<'zona_1_lot' | 'zero_floating' | 'kode_6c' | 'kode_9c' | 'gun_number'>('zona_1_lot');

  // Interactive Confluence States
  const [htfAligned, setHtfAligned] = useState<boolean>(true);
  const [zfzHit, setZfzHit] = useState<boolean>(true);
  const [vboConfirmed, setVboConfirmed] = useState<boolean>(true);
  const [cycleIndex, setCycleIndex] = useState<number>(6); // 1-9
  const [isGunNumberNear, setIsGunNumberNear] = useState<boolean>(true);

  // Price Simulation parameters
  const [currentPrice, setCurrentPrice] = useState<number>(2920.0);
  const [slOffset, setSlOffset] = useState<number>(12.0); // tight SL

  const applyPreset = (type: 'zona_1_lot' | 'zero_floating' | 'kode_6c' | 'kode_9c' | 'gun_number') => {
    setPreset(type);
    if (type === 'zona_1_lot') {
      setHtfAligned(true);
      setZfzHit(true);
      setVboConfirmed(true);
      setCycleIndex(6);
      setIsGunNumberNear(true);
      setCurrentPrice(2920.0);
      setSlOffset(8.0);
    } else if (type === 'zero_floating') {
      setHtfAligned(true);
      setZfzHit(true);
      setVboConfirmed(false);
      setCycleIndex(3);
      setIsGunNumberNear(false);
      setCurrentPrice(2915.0);
      setSlOffset(6.0);
    } else if (type === 'kode_6c') {
      setHtfAligned(true);
      setZfzHit(false);
      setVboConfirmed(true);
      setCycleIndex(6);
      setIsGunNumberNear(false);
      setCurrentPrice(2925.0);
      setSlOffset(14.0);
    } else if (type === 'kode_9c') {
      setHtfAligned(false);
      setZfzHit(true);
      setVboConfirmed(false);
      setCycleIndex(9);
      setIsGunNumberNear(true);
      setCurrentPrice(2950.0);
      setSlOffset(10.0);
    } else if (type === 'gun_number') {
      setHtfAligned(true);
      setZfzHit(false);
      setVboConfirmed(true);
      setCycleIndex(4);
      setIsGunNumberNear(true);
      setCurrentPrice(3000.0);
      setSlOffset(15.0);
    }
  };

  // Confluence Calculation
  const confluenceAnalysis = useMemo(() => {
    let score = 0;
    const points: string[] = [];

    if (htfAligned) {
      score += 25;
      points.push('1. Storyline HTF Searah Aliran (Trend Alignment)');
    }
    if (zfzHit) {
      score += 25;
      points.push('3. Zero Floating Zona Terpenuhi (Sniper Wick Tap)');
    }
    if (vboConfirmed) {
      score += 20;
      points.push('2. Valid Breakout (VBO) & Fresh Engulfing');
    }
    if (cycleIndex === 6) {
      score += 15;
      points.push('4. Timing Siklus Lilin: KODE 6C (Ekspansi Lanjutan)');
    } else if (cycleIndex === 9) {
      score += 15;
      points.push('4. Timing Siklus Lilin: KODE 9C (Pembalikan Jenuh)');
    }
    if (isGunNumberNear) {
      score += 15;
      points.push('7. Rejeksi Sakral di Level Gun Number (.000 / .500)');
    }

    const is1LotEligible = score >= 65;
    const stopLoss = currentPrice - slOffset;
    const risk = slOffset;
    const tp1 = currentPrice + risk * 2.0;
    const tp2 = currentPrice + risk * 4.5;
    const rr = (tp2 - currentPrice) / risk;

    return {
      score,
      points,
      is1LotEligible,
      stopLoss,
      tp1,
      tp2,
      rr: parseFloat(rr.toFixed(2)),
      grade: score >= 85 ? 'TIER 1 - FULL MARGIN [FM]' : score >= 65 ? 'TIER 2 - HIGH CONFIRMATION' : 'SETUP STANDAR'
    };
  }, [htfAligned, zfzHit, vboConfirmed, cycleIndex, isGunNumberNear, currentPrice, slOffset]);

  return (
    <div id="simulation-sandbox-container" className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">
              Simulator Interaktif: 7 Pilar STF &amp; Zona 1 Lot [FM]
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Uji skenario pasar secara langsung, sesuaikan faktor konfluensi, dan lihat perhitungan otomatis Stop Loss, Target Profit, serta kelayakan eksekusi Full Margin.
            </p>
          </div>
        </div>

        {/* PRESET BUTTONS */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'zona_1_lot', label: '🔥 Zona 1 Lot [FM]', icon: Award },
            { id: 'zero_floating', label: '🎯 Zero Floating (ZFZ)', icon: Crosshair },
            { id: 'kode_6c', label: '⚡ Kode 6C (Ekspansi)', icon: Clock },
            { id: 'kode_9c', label: '🔄 Kode 9C (Reversal)', icon: Clock },
            { id: 'gun_number', label: '💎 Gun Number $3000', icon: Hash },
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
            <span>Konfigurasi 7 Pilar Skenario</span>
          </h3>

          {/* Toggle 1: Storyline HTF */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">1. Storyline HTF 4H</div>
              <div className="text-[11px] text-slate-400">Tren searah aliran HTF Support/Resistance</div>
            </div>
            <button
              onClick={() => setHtfAligned(!htfAligned)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                htfAligned ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {htfAligned ? 'SEARAH (+25%)' : 'BERLAWANAN'}
            </button>
          </div>

          {/* Toggle 2: Valid Breakout & Fresh Engulfing */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">2. Valid Breakout (VBO)</div>
              <div className="text-[11px] text-slate-400">Body lilin menembus tegas &amp; Fresh Base</div>
            </div>
            <button
              onClick={() => setVboConfirmed(!vboConfirmed)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                vboConfirmed ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {vboConfirmed ? 'TERKONFIRMASI (+20%)' : 'BELUM'}
            </button>
          </div>

          {/* Toggle 3: Zero Floating Zona */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">3. Zero Floating Zona (ZFZ)</div>
              <div className="text-[11px] text-slate-400">Menyentuh ujung akar/pucuk shadow wick</div>
            </div>
            <button
              onClick={() => setZfzHit(!zfzHit)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                zfzHit ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {zfzHit ? 'TER-TRIGGER (+25%)' : 'DILUAR ZONA'}
            </button>
          </div>

          {/* Slider 4: Kode 6C.9C Cycle Count */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">4. Kode Siklus Lilin (Sifir Count)</span>
              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono font-black border border-indigo-500/40">
                Candle #{cycleIndex} {cycleIndex === 6 ? '(KODE 6C +15%)' : cycleIndex === 9 ? '(KODE 9C +15%)' : ''}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="9"
              value={cycleIndex}
              onChange={(e) => setCycleIndex(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>#1 Awal</span>
              <span>#6 Ekspansi</span>
              <span>#9 Reversal</span>
            </div>
          </div>

          {/* Toggle 5: Gun Number */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">7. Gun Number Key Level</div>
              <div className="text-[11px] text-slate-400">Dekat angka psikologis bulat .000 / .500</div>
            </div>
            <button
              onClick={() => setIsGunNumberNear(!isGunNumberNear)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                isGunNumberNear ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isGunNumberNear ? 'AKTIF (+15%)' : 'NETRAL'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: REALTIME CONFLUENCE & EXECUTION CARD */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Hasil Evaluasi Sistem
                </span>
                <h4 className="text-base font-black text-white mt-0.5">
                  {confluenceAnalysis.grade}
                </h4>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-mono">Confluence Score</span>
                <div className={`text-2xl font-black font-mono ${
                  confluenceAnalysis.score >= 80 ? 'text-amber-400' : confluenceAnalysis.score >= 60 ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  {confluenceAnalysis.score}%
                </div>
              </div>
            </div>

            {/* ZONA 1 LOT BADGE BANNER */}
            {confluenceAnalysis.is1LotEligible ? (
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-red-500/20 to-amber-500/10 border border-amber-500/40 space-y-2 mb-4">
                <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                  <Award className="w-5 h-5" />
                  <span>LOLOS KLASIFIKASI ZONA 1 LOT [FM]</span>
                </div>
                <p className="text-xs text-slate-200">
                  Setup memenuhi ambang batas keakuratan tinggi institusional. Rasio Risk-to-Reward mencapai <strong>1:{confluenceAnalysis.rr}</strong> dengan potensi drawdown nol pips di Zero Floating Zona.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 mb-4">
                Konfluensi saat ini ({confluenceAnalysis.score}%) belum mencapai batas 65% untuk eksekusi Full Margin. Disarankan menunggu pilar konfirmasi berikutnya (seperti Lilin ke-6/9 atau Wick ZFZ).
              </div>
            )}

            {/* TRADE CALCULATION TILES */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Entry ZFZ</span>
                <div className="text-xs font-mono font-bold text-sky-400 mt-1">
                  ${formatPrice(currentPrice)}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Stop Loss (Ketat)</span>
                <div className="text-xs font-mono font-bold text-rose-400 mt-1">
                  ${formatPrice(confluenceAnalysis.stopLoss)}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Take Profit 1</span>
                <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
                  ${formatPrice(confluenceAnalysis.tp1)}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono">TP 2 (Storyline)</span>
                <div className="text-xs font-mono font-bold text-amber-400 mt-1">
                  ${formatPrice(confluenceAnalysis.tp2)}
                </div>
              </div>
            </div>
          </div>

          {/* CHECKLIST OF ACTIVE PILLARS */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 mt-4">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
              Daftar Pilar Terkonfirmasi ({confluenceAnalysis.points.length} / 5):
            </span>
            {confluenceAnalysis.points.map((pt, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
