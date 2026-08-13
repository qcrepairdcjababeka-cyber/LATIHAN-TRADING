/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Info, TrendingUp, RefreshCw, BarChart2, ShieldAlert, Sliders, Sparkles } from 'lucide-react';

export default function EducationalPortal() {
  const [activeTab, setActiveTab] = useState<'cisd' | 'fvg' | 'ifvg' | 'mss' | 'ob' | 'ote'>('cisd');
  const [mssMode, setMssMode] = useState<'bullish' | 'bearish'>('bullish');

  return (
    <div id="educational-portal" className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="text-indigo-400 w-6 h-6" />
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans tracking-tight">Portal Edukasi & Cheat Sheet ICT</h2>
            <p className="text-xs text-slate-400">Pahami rahasia algoritma institusional Inner Circle Trader (SMC)</p>
          </div>
        </div>
        
        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'cisd', label: 'Metode BSL/SSL + CISD', icon: Sparkles },
            { id: 'fvg', label: 'Fair Value Gap (FVG)', icon: BarChart2 },
            { id: 'ifvg', label: 'Inversion FVG (IFG)', icon: RefreshCw },
            { id: 'mss', label: 'Struktur Pasar (MSS/BOS)', icon: TrendingUp },
            { id: 'ob', label: 'Order Block (OB)', icon: ShieldAlert },
            { id: 'ote', label: 'Optimal Trade Entry (OTE)', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                id={`btn-tab-edu-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-semibold tracking-wide transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                    : 'bg-slate-950 text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'cisd' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3 inline-block">
              Metode Utama Institusional (SMC / ICT)
            </span>
            <h3 className="text-xl font-bold text-slate-100 mb-3">Metode BSL/SSL Swept + CISD + FVG Retrace</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Konsep murni ini menggabungkan penjemputan likuiditas (BSL/SSL), perubahan status pengiriman harga (CISD - Change in State of Delivery), dan konfirmasi retrace pada Fair Value Gap (FVG) dari konfiks multi-timeframe (HTF: D1/H4/H1 ke LTF: M15/M5).
            </p>
            <ul className="space-y-3 text-xs text-slate-300 mb-4">
              <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold shrink-0">1. Likuiditas Swept (BSL/SSL)</span>
                <span>Smart Money menjemput stop loss retail di atas Swing High (BSL) atau di bawah Swing Low (SSL).</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-amber-400 font-bold shrink-0">2. CISD (Change in State of Delivery)</span>
                <span>Terjadi ketika candle berekspansi dan menutup (body close) melewati batas open/high candle pembersih likuiditas, membalikkan alur pasar.</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-indigo-400 font-bold shrink-0">3. HTF Context & FVG Retrace Entry</span>
                <span>Trend HTF (D1/H4/H1) memberikan konfirmasi retrace. Entri dieksekusi saat harga melakukan retrace balik ke FVG aktif di M15/M5.</span>
              </li>
            </ul>
            <div className="flex items-center gap-2 bg-amber-950/20 border border-amber-500/20 rounded-sm p-3 text-xs text-amber-300/90">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Sistem scanner secara otomatis memetakan CISD Line, status SSL/BSL Swept, dan zona retrace FVG di seluruh time frame M15 & M5!</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 flex flex-col items-center">
            <h4 className="text-xs font-semibold text-amber-400 mb-3 uppercase tracking-wider">Visualisasi Alur BSL/SSL + CISD + FVG</h4>
            <svg viewBox="0 0 400 240" className="w-full max-w-[340px] h-auto">
              <line x1="30" y1="180" x2="370" y2="180" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="4,3" />
              <text x="365" y="175" fill="#f87171" fontSize="9" textAnchor="end" fontWeight="bold">SSL (Sell-Side Liquidity Swept)</text>

              <line x1="30" y1="100" x2="370" y2="100" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4,2" />
              <text x="365" y="95" fill="#34d399" fontSize="9" textAnchor="end" fontWeight="bold">⚡ CISD Line (Delivery Buy-Side)</text>

              {/* Price Path: Drop to sweep SSL -> Strong rally breaking CISD -> Retrace to FVG */}
              <polyline points="40,80 80,140 120,190 180,60 230,120 280,115 340,40" fill="none" stroke="#10b981" strokeWidth="2.5" />
              
              {/* SSL Sweep Dot */}
              <circle cx="120" cy="190" r="5" fill="#eab308" />
              <text x="120" y="210" fill="#eab308" fontSize="9" textAnchor="middle" fontWeight="bold">1. SSL Terjemput</text>

              {/* CISD Break Dot */}
              <circle cx="160" cy="100" r="4" fill="#34d399" />
              <text x="160" y="85" fill="#34d399" fontSize="9" textAnchor="middle" fontWeight="bold">2. CISD Confirmation</text>

              {/* FVG Box */}
              <rect x="210" y="105" width="80" height="25" fill="rgba(99, 102, 241, 0.25)" stroke="#6366f1" strokeWidth="1" rx="2" />
              <text x="250" y="121" fill="#818cf8" fontSize="8" textAnchor="middle" fontWeight="bold">3. FVG Retrace Entry Zone (M15/M5)</text>

              {/* Arrow */}
              <polygon points="340,40 330,48 335,55" fill="#10b981" />
            </svg>
          </div>
        </div>
      )}

      {activeTab === 'fvg' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3 inline-block">
              Dasar Algoritma
            </span>
            <h3 className="text-xl font-bold text-slate-100 mb-3">Apa itu Fair Value Gap (FVG)?</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Fair Value Gap (FVG) adalah struktur 3 candle yang terjadi ketika terdapat ketidakseimbangan (imbalance) harga yang ekstrem akibat pesanan besar dari institusi bank atau algoritma pasar.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-400 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">🟢 Bullish FVG</span>: Terjadi saat candle kedua naik dengan sangat kuat, di mana <strong>Low Candle ke-3 lebih tinggi daripada High Candle ke-1</strong>. Sisa ruang kosong di antara keduanya adalah Gap yang harus diisi kembali.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">🔴 Bearish FVG</span>: Terjadi saat candle kedua turun sangat tajam, di mana <strong>High Candle ke-3 lebih rendah daripada Low Candle ke-1</strong>.
              </li>
            </ul>
            <div className="flex items-center gap-2 bg-indigo-950/20 border border-indigo-500/10 rounded-sm p-3 text-xs text-indigo-300/90">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Institusi sering membiarkan harga turun/naik kembali ke area FVG untuk menjemput order yang tersisa sebelum melanjutkan perjalanan (fase mitigasi).</span>
            </div>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 flex flex-col items-center">
            <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Visualisasi Bullish FVG</h4>
            {/* SVG Illustration of Bullish FVG */}
            <svg viewBox="0 0 400 240" className="w-full max-w-[320px] h-auto">
              {/* Background grid */}
              <line x1="50" y1="20" x2="350" y2="20" stroke="#222" strokeDasharray="3,3" />
              <line x1="50" y1="80" x2="350" y2="80" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" /> {/* FVG Top */}
              <line x1="50" y1="160" x2="350" y2="160" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" /> {/* FVG Bottom */}
              
              {/* Shaded FVG Zone */}
              <rect x="80" y="80" width="240" height="80" fill="rgba(99, 102, 241, 0.12)" stroke="rgba(99, 102, 241, 0.3)" strokeWidth="1" />
              <text x="200" y="125" fill="#818cf8" fontSize="12" fontWeight="bold" textAnchor="middle">BULLISH FVG ZONE (GAP)</text>
              <text x="200" y="142" fill="#94a3b8" fontSize="10" textAnchor="middle">(Ketidakseimbangan Harga)</text>
 
              {/* Candle 1 (earlier, bullish) */}
              {/* wick */}
              <line x1="120" y1="140" x2="120" y2="220" stroke="#94a3b8" strokeWidth="2" />
              {/* body */}
              <rect x="105" y="150" width="30" height="40" fill="#10b981" rx="2" />
              <text x="120" y="235" fill="#94a3b8" fontSize="10" textAnchor="middle">Candle 1</text>
              {/* High line indicator */}
              <line x1="120" y1="160" x2="280" y2="160" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2,2" />
              <text x="45" y="164" fill="#ef4444" fontSize="10" fontWeight="bold">High C1</text>
 
              {/* Candle 2 (strong expansion) */}
              <line x1="200" y1="70" x2="200" y2="200" stroke="#94a3b8" strokeWidth="2" />
              <rect x="185" y="80" width="30" height="110" fill="#10b981" rx="2" />
              <text x="200" y="235" fill="#94a3b8" fontSize="10" textAnchor="middle">Candle 2</text>
 
              {/* Candle 3 (latest, bullish) */}
              <line x1="280" y1="40" x2="280" y2="120" stroke="#94a3b8" strokeWidth="2" />
              <rect x="265" y="50" width="30" height="40" fill="#10b981" rx="2" />
              <text x="280" y="235" fill="#94a3b8" fontSize="10" textAnchor="middle">Candle 3</text>
              {/* Low line indicator */}
              <line x1="280" y1="80" x2="120" y2="80" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2,2" />
              <text x="315" y="84" fill="#ef4444" fontSize="10" fontWeight="bold">Low C3</text>
            </svg>
          </div>
        </div>
      )}
 
      {activeTab === 'ifvg' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3 inline-block">
              Sinyal Institusi Terkuat
            </span>
            <h3 className="text-xl font-bold text-slate-100 mb-3">Apa itu Inversion Fair Value Gap (IFG)?</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Inversion FVG (IFG atau IFVG) terjadi ketika sebuah Fair Value Gap yang awalnya bertindak sebagai support/resistansi telah <strong>ditembus dan ditutup melaluinya oleh badan candle lain</strong>. Ketika ditembus, fungsi gap tersebut akan berbalik (flip).
            </p>
            <ul className="space-y-2.5 text-xs text-slate-400 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">🔄 Bearish FVG → Bullish IFVG</span>: Ketika Bearish FVG berhasil ditembus ke atas oleh penutupan badan candle yang impulsif, area tersebut berubah menjadi <strong>support institusional yang kuat</strong> untuk buy retest.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">🔄 Bullish FVG → Bearish IFVG</span>: Ketika Bullish FVG dijebol ke bawah oleh penutupan badan candle, area tersebut terbalik menjadi <strong>resistansi institusional yang solid</strong> untuk sell retest.
              </li>
            </ul>
            <div className="flex items-center gap-2 bg-indigo-950/20 border border-indigo-500/10 rounded-sm p-3 text-xs text-indigo-300/90">
              <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>IFVG merupakan bukti bahwa algoritma market maker telah merubah arah tujuannya (order flow shift) dan level gap lama kini dipertahankan untuk arah baru.</span>
            </div>
          </div>
 
          <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 flex flex-col items-center">
            <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Visualisasi Bearish FVG → Bullish Inversion</h4>
            {/* SVG of Inversion FVG */}
            <svg viewBox="0 0 400 240" className="w-full max-w-[320px] h-auto">
              {/* Shaded Inversion Zone */}
              <rect x="60" y="90" width="280" height="60" fill="rgba(99, 102, 241, 0.15)" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="1.5" />
              <text x="200" y="125" fill="#818cf8" fontSize="12" fontWeight="bold" textAnchor="middle">INVERSION FVG ZONE (IFG)</text>
              <text x="200" y="142" fill="#94a3b8" fontSize="10" textAnchor="middle">Awalnya Bearish FVG, kini jadi Support Buy</text>
 
              {/* Phase 1: Bearish Drop (Gap Created) */}
              <rect x="80" y="50" width="20" height="40" fill="#ef4444" opacity="0.4" /> {/* C1 bear */}
              <rect x="110" y="90" width="20" height="90" fill="#ef4444" opacity="0.4" /> {/* C2 bear */}
              <rect x="140" y="150" width="20" height="30" fill="#ef4444" opacity="0.4" /> {/* C3 bear */}
              <text x="115" y="40" fill="#94a3b8" fontSize="9" textAnchor="middle">1. Bearish FVG</text>
 
              {/* Phase 2: Violating Candle (Body Close Above FVG) */}
              <rect x="210" y="60" width="22" height="110" fill="#10b981" rx="1.5" />
              {/* Wick */}
              <line x1="221" y1="40" x2="221" y2="180" stroke="#10b981" strokeWidth="1.5" />
              <text x="221" y="30" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle">2. Tembus Ke Atas</text>
 
              {/* Phase 3: Retest of the IFG (Trigger Buy!) */}
              <line x1="290" y1="70" x2="290" y2="160" stroke="#ef4444" strokeWidth="1.5" />
              <rect x="279" y="80" width="22" height="40" fill="#ef4444" rx="1.5" /> {/* Drop to retest */}
              <polygon points="290,140 285,150 295,150" fill="#10b981" />
              <text x="290" y="175" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle">3. RETEST & PANTULAN (BUY)</text>
            </svg>
          </div>
        </div>
      )}
 
      {activeTab === 'mss' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider inline-block">
                Konfirmasi Struktur Tren
              </span>
              
              {/* Bullish vs Bearish MSS Switcher */}
              <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800">
                <button
                  id="btn-mss-sub-bull"
                  onClick={() => setMssMode('bullish')}
                  className={`px-2.5 py-1 rounded-sm text-[10px] font-bold transition-all cursor-pointer ${
                    mssMode === 'bullish'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bullish Setup
                </button>
                <button
                  id="btn-mss-sub-bear"
                  onClick={() => setMssMode('bearish')}
                  className={`px-2.5 py-1 rounded-sm text-[10px] font-bold transition-all cursor-pointer ${
                    mssMode === 'bearish'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bearish Setup
                </button>
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-100 mb-3 font-sans tracking-tight">Market Structure Shift (MSS) vs BOS</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4 font-sans">
              Mengidentifikasi arah aliran pesanan (order flow) institusional adalah hal utama. Kita menggunakan penembusan swing high/low untuk menentukan kapan tren terus berlanjut atau berbalik arah.
            </p>

            {mssMode === 'bullish' ? (
              <div className="space-y-3.5">
                <div className="p-3 bg-emerald-950/10 border border-emerald-500/10 rounded-sm">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">⚡ BULLISH MSS SETUP (Pembalikan Naik)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Terjadi di area diskon setelah harga menyapu likuiditas di bawah swing low lama (Liquidity Sweep / SSL). Harga kemudian naik secara agresif dan menembus swing high terakhir, menciptakan <strong>Market Structure Shift (MSS)</strong>.
                  </p>
                </div>
                <ul className="space-y-2 text-xs text-slate-400 font-sans">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold font-mono">1. SSL Sweep:</span> Harga turun melewati swing low lama untuk menjemput stop loss buy-side/sell-side retail.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold font-mono">2. Expansion:</span> Kenaikan tajam dengan volume institusi yang menembus swing high terdekat dengan badan candle ditutup di atasnya.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold font-mono">3. Entry Area:</span> Tunggu harga retrace kembali ke Fair Value Gap (FVG) atau Order Block (OB) yang tercipta saat ekspansi untuk melakukan <strong>BUY</strong>.
                  </li>
                </ul>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="p-3 bg-rose-950/10 border border-rose-500/10 rounded-sm">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">⚡ BEARISH MSS SETUP (Pembalikan Turun)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Terjadi di area premium setelah harga menyapu likuiditas di atas swing high lama (Liquidity Sweep / BSL). Harga kemudian turun secara agresif dan menembus swing low terakhir, menciptakan <strong>Market Structure Shift (MSS)</strong>.
                  </p>
                </div>
                <ul className="space-y-2 text-xs text-slate-400 font-sans">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold font-mono">1. BSL Sweep:</span> Harga naik melewati swing high lama untuk menjemput stop loss sell-side/buy-side retail.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold font-mono">2. Expansion:</span> Penurunan tajam dengan volume institusi yang menembus swing low terdekat dengan badan candle ditutup di bawahnya.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold font-mono">3. Entry Area:</span> Tunggu harga naik kembali (retest) ke Fair Value Gap (FVG) atau Order Block (OB) yang tercipta saat ekspansi untuk melakukan <strong>SELL</strong>.
                  </li>
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2 bg-indigo-950/20 border border-indigo-500/10 rounded-sm p-3 text-xs text-indigo-300/90 mt-4">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                {mssMode === 'bullish' 
                  ? "Selalu konfirmasi bahwa penembusan swing high menggunakan badan candle yang ditutup (body close), bukan hanya ekor candle (wick) saja."
                  : "Bearish MSS adalah setup andalan saat harga mencapai area resistansi harian/mingguan penting sebelum penurunan besar dimulai."}
              </span>
            </div>
          </div>
 
          <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 flex flex-col items-center">
            <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
              {mssMode === 'bullish' ? 'Pola MSS Bullish (Reversal Setup)' : 'Pola MSS Bearish (Reversal Setup)'}
            </h4>
            
            {mssMode === 'bullish' ? (
              <svg viewBox="0 0 400 240" className="w-full max-w-[320px] h-auto">
              {/* Lower highs and lower lows */}
              <polyline points="40,60 100,140 150,90 210,180" fill="none" stroke="#64748b" strokeWidth="2.5" />
              
              {/* Swing High */}
              <circle cx="150" cy="90" r="4" fill="#ef4444" />
              <text x="150" y="75" fill="#ef4444" fontSize="9" fontWeight="bold" textAnchor="middle">Swing High Terakhir</text>
 
              {/* Liquidity Sweep of Swing Low */}
              <circle cx="210" cy="180" r="4" fill="#eab308" />
              <line x1="100" y1="140" x2="230" y2="140" stroke="#eab308" strokeWidth="1" strokeDasharray="3,3" />
              <text x="210" y="200" fill="#eab308" fontSize="9" fontWeight="bold" textAnchor="middle">Liquidity Sweep (SSL)</text>
 
              {/* Strong Rally breaking Swing High */}
              <polyline points="210,180 280,50" fill="none" stroke="#10b981" strokeWidth="3" />
              <circle cx="250" cy="90" r="4" fill="#10b981" />
              <line x1="120" y1="90" x2="310" y2="90" stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="4,4" />
              <text x="310" y="85" fill="#818cf8" fontSize="10" fontWeight="bold" textAnchor="end">MSS Level (Broken)</text>
 
              {/* Retrace into FVG created on expansion */}
              <polyline points="280,50 310,100 350,30" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="1,1" />
              <text x="310" y="115" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle">Retest OB/FVG (Buy)</text>
            </svg>
            ) : (
              <svg viewBox="0 0 400 240" className="w-full max-w-[320px] h-auto">
                <line x1="40" y1="100" x2="360" y2="100" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="40" y1="150" x2="360" y2="150" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />

                <polyline points="40,180 100,100 150,150 210,60" fill="none" stroke="#64748b" strokeWidth="2.5" />
                
                <circle cx="150" cy="150" r="4" fill="#ef4444" />
                <text x="150" y="170" fill="#ef4444" fontSize="9" fontWeight="bold" textAnchor="middle" className="font-sans">Swing Low Terakhir</text>

                <circle cx="210" cy="60" r="4" fill="#eab308" />
                <line x1="100" y1="100" x2="230" y2="100" stroke="#eab308" strokeWidth="1" strokeDasharray="3,3" />
                <text x="210" y="45" fill="#eab308" fontSize="9" fontWeight="bold" textAnchor="middle" className="font-sans">Liquidity Sweep (BSL)</text>

                <polyline points="210,60 280,190" fill="none" stroke="#ef4444" strokeWidth="3" />
                <circle cx="250" cy="150" r="4" fill="#ef4444" />
                <line x1="120" y1="150" x2="310" y2="150" stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="4,4" />
                <text x="310" y="145" fill="#818cf8" fontSize="10" fontWeight="bold" textAnchor="end" className="font-sans">MSS Level (Broken)</text>

                <polyline points="280,190 310,140 350,210" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="1,1" />
                <text x="310" y="125" fill="#ef4444" fontSize="9" fontWeight="bold" textAnchor="middle" className="font-sans">Retest OB/FVG (Sell)</text>
              </svg>
            )}
          </div>
        </div>
      )}
 
      {activeTab === 'ob' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3 inline-block">
              Jejak Transaksi Institusi
            </span>
            <h3 className="text-xl font-bold text-slate-100 mb-3">Apa itu Order Block (OB)?</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Order Block adalah lilin (candle) tertentu di mana institusi keuangan besar telah akumulasi atau mendistribusikan volume posisi yang sangat besar. Lilin ini memicu ekspansi harga tajam berikutnya.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-400 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">🔵 Bullish Order Block</span>: Candle bearish terakhir sebelum terjadinya ekspansi kenaikan harga kuat yang menembus struktur pasar ke atas. Badan candle ini bertindak sebagai <strong>zona support institusi di masa depan</strong>.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">🔴 Bearish Order Block</span>: Candle bullish terakhir sebelum terjadinya ekspansi penurunan harga tajam ke bawah. Badan candle ini bertindak sebagai <strong>zona resistansi kuat</strong>.
              </li>
            </ul>
            <div className="flex items-center gap-2 bg-indigo-950/20 border border-indigo-500/10 rounded-sm p-3 text-xs text-indigo-300/90">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Lembaga keuangan tidak bisa masuk ke pasar sekaligus karena likuiditas yang terbatas. Mereka menyisakan sisa limit order di level Order Block untuk dieksekusi saat harga kembali menyentuh area tersebut (fase mitigasi).</span>
            </div>
          </div>
 
          <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 flex flex-col items-center">
            <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Visualisasi Bullish Order Block</h4>
            <svg viewBox="0 0 400 240" className="w-full max-w-[320px] h-auto">
              {/* Highlight OB candle area */}
              <rect x="80" y="110" width="40" height="70" fill="rgba(79, 70, 229, 0.15)" stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="3,3" />
              <text x="100" y="200" fill="#818cf8" fontSize="10" fontWeight="bold" textAnchor="middle">BULLISH OB</text>
 
              {/* Candle 1 (Bearish OB candle) */}
              <line x1="100" y1="100" x2="100" y2="190" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="85" y="110" width="30" height="60" fill="#ef4444" rx="1" /> {/* Bearish body */}
 
              {/* Candle 2 (Explosion) */}
              <line x1="160" y1="50" x2="160" y2="170" stroke="#10b981" strokeWidth="2" />
              <rect x="145" y="60" width="30" height="100" fill="#10b981" rx="1" />
 
              {/* Candle 3 (Rally) */}
              <line x1="220" y1="20" x2="220" y2="110" stroke="#10b981" strokeWidth="2" />
              <rect x="205" y="30" width="30" height="70" fill="#10b981" rx="1" />
 
              {/* Area Expansion Indicator */}
              <path d="M 100,110 L 320,110" stroke="#4f46e5" strokeWidth="1" strokeDasharray="4,4" />
              <path d="M 100,170 L 320,170" stroke="#4f46e5" strokeWidth="1" strokeDasharray="4,4" />
              <rect x="250" y="110" width="70" height="60" fill="rgba(79, 70, 229, 0.08)" />
              <text x="285" y="145" fill="#818cf8" fontSize="9" textAnchor="middle">Zona Mitigasi</text>
 
              {/* Price returning to OB years later */}
              <path d="M 220,30 L 260,80 L 290,130" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="2,2" />
              <circle cx="290" cy="130" r="4" fill="#4f46e5" />
              <text x="290" y="98" fill="#818cf8" fontSize="9" fontWeight="bold" textAnchor="middle">Kunjungan Ulang</text>
              <text x="290" y="185" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle">BOUNCE (BUY TRIGGER)</text>
            </svg>
          </div>
        </div>
      )}

      {activeTab === 'ote' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3 inline-block">
              Golden Ratio Fibonacci SMC
            </span>
            <h3 className="text-xl font-bold text-slate-100 mb-3">Apa itu Optimal Trade Entry (OTE)?</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Optimal Trade Entry (OTE) adalah rentang retracement Fibonacci yang sangat spesifik, yaitu antara level <strong>62.0%</strong>, <strong>70.5%</strong>, dan <strong>79.0%</strong>. Dalam teori ICT, ini mewakili diskon harga terdalam sebelum market maker melanjutkan tren utama.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-400 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">🔸 0.62 (62.0%)</span>: Batas atas OTE. Level retracement minimum untuk validasi setup diskon/premium.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 font-bold">🎯 0.705 (70.5%)</span>: <strong>"Sweet Spot"</strong>. Level ekuilibirium taktis terdalam, seringkali merupakan titik balik presisi tinggi.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">🔸 0.79 (79.0%)</span>: Batas bawah OTE. Penolakan di bawah level ini biasanya membatalkan setup (Stop Loss diletakkan di bawah 100% / Swing Low).
              </li>
            </ul>
            <div className="flex items-center gap-2 bg-amber-950/20 border border-amber-500/10 rounded-sm p-3 text-xs text-amber-300/90">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Gunakan OTE saat mengincar setup searah dengan trend utama yang baru saja terkonfirmasi oleh Market Structure Shift (MSS). Entri pada OTE memberikan rasio Risk-to-Reward (R:R) terbaik (biasanya melebihi 1:3).</span>
            </div>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 flex flex-col items-center">
            <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Visualisasi Fibonacci OTE (Bullish Setup)</h4>
            <svg viewBox="0 0 400 240" className="w-full max-w-[320px] h-auto">
              {/* Swing Line (Impulse move) */}
              <polyline points="50,200 150,40" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,3" />
              <circle cx="50" cy="200" r="4" fill="#3b82f6" />
              <text x="50" y="215" fill="#3b82f6" fontSize="8.5" fontWeight="bold" textAnchor="middle">Swing Low (0%)</text>
              <circle cx="150" cy="40" r="4" fill="#ef4444" />
              <text x="150" y="30" fill="#ef4444" fontSize="8.5" fontWeight="bold" textAnchor="middle">Swing High (100%)</text>

              {/* Fibonacci lines */}
              {/* 100% Level */}
              <line x1="120" y1="40" x2="350" y2="40" stroke="#ef4444" strokeWidth="0.8" opacity="0.6" />
              <text x="355" y="43" fill="#ef4444" fontSize="8" className="font-mono">1.00 (100%)</text>

              {/* OTE Highlight Zone */}
              <rect x="120" y="100" width="230" height="54" fill="rgba(245, 158, 11, 0.08)" stroke="rgba(245, 158, 11, 0.3)" strokeDasharray="2,2" />
              <text x="235" y="132" fill="#eab308" fontSize="9" fontWeight="extrabold" textAnchor="middle">ZONA OTE (DISCOUNT BUY)</text>

              {/* 62% Level */}
              <line x1="120" y1="100" x2="350" y2="100" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,2" />
              <text x="355" y="103" fill="#f59e0b" fontSize="8" className="font-mono">0.62 (62.0%)</text>

              {/* 70.5% Level */}
              <line x1="120" y1="127" x2="350" y2="127" stroke="#eab308" strokeWidth="1.2" />
              <text x="355" y="130" fill="#eab308" fontSize="8" className="font-mono">0.705 (70.5%) Sweet Spot</text>

              {/* 79% Level */}
              <line x1="120" y1="154" x2="350" y2="154" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,2" />
              <text x="355" y="157" fill="#f59e0b" fontSize="8" className="font-mono">0.79 (79.0%)</text>

              {/* 0% Level */}
              <line x1="120" y1="200" x2="350" y2="200" stroke="#3b82f6" strokeWidth="0.8" opacity="0.6" />
              <text x="355" y="203" fill="#3b82f6" fontSize="8" className="font-mono">0.00 (0%) Stop Loss</text>

              {/* Price Action Path */}
              <path d="M 150,40 L 190,90 L 230,127 L 300,60" fill="none" stroke="#10b981" strokeWidth="2.5" />
              <circle cx="230" cy="127" r="4.5" fill="#10b981" />
              <text x="230" y="118" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle">Entri di OTE</text>
            </svg>
          </div>
        </div>
      )}

      {activeTab === 'price_action' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3 inline-block">
              Trigger & Konfirmasi Lilin
            </span>
            <h3 className="text-xl font-bold text-slate-100 mb-3">Konfirmasi Price Action</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Konfirmasi Price Action (Aksi Harga) mengandalkan formasi bentuk lilin (candlestick) pada titik temu (confluence) zona penting seperti FVG, Order Block, atau OTE. Pola lilin ini menunjukkan pergolakan psikologis nyata antara pembeli dan penjual ritel melawan institusi keuangan.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-400 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">🔨 Hammer / Pinbar (Bullish Hammer)</span>: Terbentuk dari ekor bawah yang sangat panjang dan badan kecil di atas. Menandakan <strong>penolakan agresif (liquidity sweep)</strong> terhadap harga murah oleh pelaku institusi.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">⚡ Engulfing Pattern</span>: Lilin kedua sepenuhnya "memakan" atau membungkus badan lilin sebelumnya. Menunjukkan **pembalikan arah instan** yang digerakkan oleh suntikan likuiditas pasar yang masif.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">🛡️ Rejection Block</span>: Lilin dengan sumbu atas/bawah yang sangat panjang menyentuh pool likuiditas lalu berbalik arah dengan cepat. Menunjukkan penahanan level harga oleh institusi.
              </li>
            </ul>
            <div className="flex items-center gap-2 bg-slate-950/40 border border-slate-800 rounded-sm p-3 text-xs text-slate-300/90">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span><strong>Aturan Emas:</strong> Jangan pernah terburu-buru entry saat harga baru menyentuh FVG atau Order Block. Tunggu minimal sumbu penolakan (wick rejection) atau penutupan candle konfirmasi (Engulfing/Hammer) di timeframe operasional Anda.</span>
            </div>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 flex flex-col items-center">
            <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Visualisasi Pola Candle Konfirmasi</h4>
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="border border-slate-800/80 bg-slate-900/40 p-3 rounded-md text-center">
                <span className="text-[10px] text-emerald-400 font-bold block mb-2 uppercase">Bullish Hammer</span>
                <svg viewBox="0 0 100 120" className="w-16 h-16 mx-auto">
                  {/* Hammer candle */}
                  <line x1="50" y1="20" x2="50" y2="100" stroke="#10b981" strokeWidth="2" />
                  <rect x="38" y="30" width="24" height="20" fill="#10b981" rx="1" />
                  <text x="50" y="115" fill="#94a3b8" fontSize="8" textAnchor="middle">Sumbu Bawah Panjang</text>
                </svg>
              </div>

              <div className="border border-slate-800/80 bg-slate-900/40 p-3 rounded-md text-center">
                <span className="text-[10px] text-indigo-400 font-bold block mb-2 uppercase">Bullish Engulfing</span>
                <svg viewBox="0 0 100 120" className="w-16 h-16 mx-auto">
                  {/* Candle 1: Small Bearish */}
                  <line x1="30" y1="40" x2="30" y2="90" stroke="#ef4444" strokeWidth="1.5" />
                  <rect x="20" y="50" width="20" height="30" fill="#ef4444" rx="1" />
                  {/* Candle 2: Large Bullish engulfing */}
                  <line x1="70" y1="15" x2="70" y2="105" stroke="#10b981" strokeWidth="2" />
                  <rect x="60" y="25" width="20" height="70" fill="#10b981" rx="1" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
