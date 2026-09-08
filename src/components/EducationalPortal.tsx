/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Target,
  Layers,
  Flame,
  Clock,
  Crosshair,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  TrendingUp,
  Award,
  Lock,
  ArrowRight,
  Compass,
  Check
} from 'lucide-react';

export default function EducationalPortal() {
  const [activeTab, setActiveTab] = useState<
    'crt_overview' | 'tahap1_benchmark' | 'tahap2_sweep' | 'tahap3_reentry' | 'tahap4_mss' | 'tahap5_targets'
  >('crt_overview');

  return (
    <div id="educational-portal" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl font-sans animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 via-rose-500/20 to-indigo-500/20 border border-amber-500/30 rounded-2xl text-amber-400">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] tracking-wider uppercase">
                MODEL ENTRI EKSKLUSIF
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                Model Entri ICT + CRT (Candle Range Theory &bull; Inner Circle Trader)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Satu-satunya model entri yang digunakan dalam sistem: Analisis Rentang Lilin yang Sedang Berjalan Saat Ini (Current Running Candle CRT Range), ICT Liquidity Sweep (Turtle Soup SSL/BSL), konfirmasi Re-entry ke dalam body lilin berjalan, perpindahan struktur 5M Displacement MSS, mitigasi Fair Value Gap (FVG BISI/SIBI), dan target terkunci konsisten (50% Equilibrium &amp; Draw on Liquidity DOL).
            </p>
          </div>
        </div>

        {/* Tab Navigation for ICT + CRT Sequence */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'crt_overview', label: '★ Ringkasan Anatomi', icon: Target },
            { id: 'tahap1_benchmark', label: '1. Range Lilin Berjalan', icon: Compass },
            { id: 'tahap2_sweep', label: '2. ICT Turtle Soup', icon: Flame },
            { id: 'tahap3_reentry', label: '3. Re-Entry Body Lilin', icon: Layers },
            { id: 'tahap4_mss', label: '4. 5M MSS & FVG', icon: Crosshair },
            { id: 'tahap5_targets', label: '5. SL & TP Terkunci', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                id={`btn-tab-edu-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'crt_overview' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-black text-white">Anatomi Lengkap Model Entri ICT + CRT (Candle yang Berjalan Saat Ini)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Integrasi presisi antara <strong>Candle Range Theory (CRT)</strong> dan <strong>Inner Circle Trader (ICT)</strong> berbasis candle yang sedang berjalan saat ini (Current Running Candle): Menentukan batas Range High (RH), Range Low (RL), dan 50% Equilibrium (EQ) dari lilin berjalan, mendeteksi sapuan likuiditas manipulasi (ICT Turtle Soup SSL/BSL), konfirmasi penutupan kembali ke dalam rentang (re-entry), pergeseran struktur harga agresif (5M Displacement MSS), retest zona Fair Value Gap (FVG BISI/SIBI), serta target matematis Draw on Liquidity (DOL).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Step 1: Benchmark Mother Candle */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xs">
                  1
                </div>
                <h4 className="text-xs font-bold text-white">Range Lilin Berjalan (CRT)</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tentukan Range High (RH), Range Low (RL), dan 50% Equilibrium (EQ) dari lilin yang sedang berjalan secara dinamis dan real-time.
                </p>
              </div>

              {/* Step 2: ICT Liquidity Sweep */}
              <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
                  2
                </div>
                <h4 className="text-xs font-bold text-white">ICT Turtle Soup Sweep</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Harga menembus keluar batas RH (BSL) atau RL (SSL) candle berjalan hanya dengan shadow wick untuk menyerap pool likuiditas.
                </p>
              </div>

              {/* Step 3: Re-Entry */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                  3
                </div>
                <h4 className="text-xs font-bold text-white">Re-Entry Body Lilin</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Candle segera ditutup kembali ke dalam wilayah rentang lilin berjalan, membuktikan penembusan sebelumnya adalah manipulasi likuiditas institusi (fakeout).
                </p>
              </div>

              {/* Step 4: 5M MSS & FVG Mitigation */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-xs">
                  4
                </div>
                <h4 className="text-xs font-bold text-white">5M MSS &amp; FVG Mitigation</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Struktur 5M mengalami perpindahan (Market Structure Shift) dengan displacement impulsif, menyisakan zona FVG (BISI/SIBI) untuk entri sniper saat retest.
                </p>
              </div>

              {/* Step 5: Locked Targets */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-xs">
                  5
                </div>
                <h4 className="text-xs font-bold text-white">SL &amp; Target Terkunci (DOL)</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  SL di luar wick sweep lilin berjalan. TP1 terkunci di 50% Equilibrium lilin berjalan, dan TP2 di Opposing Range Boundary / Draw on Liquidity (R:R 1:3 - 1:6+).
                </p>
              </div>
            </div>

            {/* Visual SOP Summary */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Aturan Emas: Konsistensi Tanpa Indikator Tertinggal (Lagging)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Model ICT + CRT murni menganalisis candle yang berjalan saat ini, sapuan likuiditas ICT Turtle Soup, displacement MSS &amp; FVG, serta target matematis objektif.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('tahap1_benchmark')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
              >
                <span>Pelajari Tahap 1</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAHAP 1: BENCHMARK */}
        {activeTab === 'tahap1_benchmark' && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Tahap 1: Rentang Lilin yang Sedang Berjalan (Current Running Candle CRT)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Alih-alih terikat pada jam tertentu (bukan model 9 AM), sistem murni menganalisis batas pembentukan candle yang sedang aktif berjalan saat ini secara real-time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-black uppercase text-indigo-400">1. Range High (RH)</span>
                <h4 className="text-sm font-bold text-white">Batas Atas Rentang Lilin Berjalan</h4>
                <p className="text-xs text-slate-400">
                  Titik tertinggi candle berjalan. Di atas level ini bertengger likuiditas beli (Buy-Side Liquidity / BSL) dari breakout traders dan stop loss seller.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400">2. 50% Equilibrium (EQ)</span>
                <h4 className="text-sm font-bold text-white">Titik Keseimbangan Nilai Fair Value</h4>
                <p className="text-xs text-slate-400">
                  Nilai tengah matematis (RH + RL) / 2 dari lilin berjalan. Level ini adalah magnet likuiditas utama dan menjadi target konservatif Take Profit 1 (TP1).
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-400">3. Range Low (RL)</span>
                <h4 className="text-sm font-bold text-white">Batas Bawah Rentang Lilin Berjalan</h4>
                <p className="text-xs text-slate-400">
                  Titik terendah candle berjalan. Di bawah level ini bertengger likuiditas jual (Sell-Side Liquidity / SSL) dari panic seller dan stop loss buyer.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAHAP 2: TURTLE SOUP */}
        {activeTab === 'tahap2_sweep' && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Tahap 2: ICT Liquidity Sweep (Turtle Soup) pada Lilin Berjalan</h3>
              <p className="text-xs text-slate-400 mt-1">
                Institusi menggerakkan harga menembus batas rentang lilin yang sedang berjalan untuk menyerap likuiditas sebelum membalikkan arah secara drastis.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-black uppercase text-emerald-400">🟢 Setup BUY (SSL Turtle Soup)</span>
                <h4 className="text-sm font-bold text-white">Sapuan Likuiditas Bawah (Sell-Side Liquidity)</h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                  <li>Harga turun menembus Range Low (RL) lilin berjalan.</li>
                  <li>Penembusan hanya berupa jarum ekor tajam (wick) atau rejeksi cepat.</li>
                  <li>Institusi membeli kontrak murah dari retail yang terkena Stop-Loss di bawah RL.</li>
                </ul>
              </div>

              <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-black uppercase text-rose-400">🔴 Setup SELL (BSL Turtle Soup)</span>
                <h4 className="text-sm font-bold text-white">Sapuan Likuiditas Atas (Buy-Side Liquidity)</h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                  <li>Harga naik menembus Range High (RH) lilin berjalan.</li>
                  <li>Penembusan meninggalkan wick panjang di atas RH.</li>
                  <li>Institusi menyerap order beli retail yang terjebak breakout buy, lalu bersiap membanting harga ke bawah.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAHAP 3: RE-ENTRY */}
        {activeTab === 'tahap3_reentry' && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Tahap 3: Re-Entry ke Dalam Body Lilin Berjalan</h3>
              <p className="text-xs text-slate-400 mt-1">
                Konfirmasi terpenting CRT: Candle harus ditutup kembali ke dalam wilayah rentang lilin yang sedang berjalan.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-amber-300">Validitas Filter Re-Entry</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Jika harga terus melanjutkan penembusan dengan body candle solid tanpa pernah kembali ke dalam rentang, maka itu adalah ekspansi tren sejati dan sinyal CRT dibatalkan. Namun jika harga segera ditutup kembali ke dalam rentang lilin berjalan, ini adalah konfirmasi mutlak bahwa pergerakan tadi adalah <strong>manipulasi likuiditas institusi (fake breakout)</strong>.
              </p>
            </div>
          </div>
        )}

        {/* TAHAP 4: 5M MSS & RETEST */}
        {activeTab === 'tahap4_mss' && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Tahap 4: 5M Market Structure Shift (MSS) &amp; Retest Entry</h3>
              <p className="text-xs text-slate-400 mt-1">
                Pada timeframe 5 Menit (5M), struktur swing high/low internal berbalik arah, menciptakan zona FVG atau retest batas rentang untuk titik entri sniper.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-black uppercase text-sky-400">Konfirmasi MSS 5M</span>
                <h4 className="text-sm font-bold text-white">Pergeseran Struktur Pasar Cepat</h4>
                <p className="text-xs text-slate-300">
                  Untuk BUY, swing high minor 5M berhasil ditembus ke atas. Untuk SELL, swing low minor 5M ditembus ke bawah.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-400">Titik Entri Sniper</span>
                <h4 className="text-sm font-bold text-white">Retest Batas Rentang / FVG</h4>
                <p className="text-xs text-slate-300">
                  Eksekusi order saat harga melakukan pullback kecil menyentuh kembali level Range Low (untuk BUY) atau Range High (untuk SELL).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAHAP 5: TARGETS */}
        {activeTab === 'tahap5_targets' && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Tahap 5: Manajemen Risiko &amp; Target Terkunci Konsisten</h3>
              <p className="text-xs text-slate-400 mt-1">
                Level Stop Loss dan Take Profit ditentukan secara matematis dan objektif tanpa spekulasi emosional.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-black uppercase text-rose-400">Proteksi Ketat</span>
                <h4 className="text-sm font-bold text-white">Stop Loss (SL)</h4>
                <p className="text-xs text-slate-300">
                  Diletakkan tepat di luar ujung wick manipulasi sweep lilin berjalan. Risiko sangat minim karena jarak titik entri ke SL sangat dekat.
                </p>
              </div>

              <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-400">Target 1 (Konservatif)</span>
                <h4 className="text-sm font-bold text-white">Take Profit 1: 50% EQ</h4>
                <p className="text-xs text-slate-300">
                  Level 50% Equilibrium adalah magnet likuiditas utama di mana 50% posisi dapat diamankan (partial take profit) dan SL digeser ke Breakeven (BEP).
                </p>
              </div>

              <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-black uppercase text-emerald-400">Target 2 (Maksimal)</span>
                <h4 className="text-sm font-bold text-white">Take Profit 2: Opposing Boundary</h4>
                <p className="text-xs text-slate-300">
                  Target akhir pada batas rentang yang berlawanan (Range High untuk BUY, Range Low untuk SELL) atau External Draw on Liquidity dengan rasio 1:3 hingga 1:6+ R:R.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
