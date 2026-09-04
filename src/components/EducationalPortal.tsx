/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  Flame,
  Target,
  Clock,
  Crosshair,
  Compass,
  Hash,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  TrendingUp,
  Award
} from 'lucide-react';

export default function EducationalPortal() {
  const [activeTab, setActiveTab] = useState<
    'stf' | 'vbo_engulfing' | 'zero_floating' | 'kode_6c_9c' | 'zona_1_lot' | 'storyline' | 'gun_number'
  >('stf');

  return (
    <div id="educational-portal" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl font-sans animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/30 rounded-2xl text-amber-400">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[10px] tracking-wider uppercase">
                STRATEGI SNIPER LENGKAP
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                7 Pilar Utama Strategi Trading Institusional
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Panduan terperinci SOP Sifir Time Frame, Valid Breakout &amp; Engulfing, Zero Floating Zona, Kode 6C.9C, Zona 1 Lot [FM], Storyline, dan Gun Number.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'stf', label: '1. Sifir Time Frame', icon: Layers },
            { id: 'vbo_engulfing', label: '2. Valid Breakout & Engulfing', icon: Flame },
            { id: 'zero_floating', label: '3. Zero Floating Zona', icon: Crosshair },
            { id: 'kode_6c_9c', label: '4. Kode 6C.9C', icon: Clock },
            { id: 'zona_1_lot', label: '5. Zona 1 Lot [FM]', icon: Award },
            { id: 'storyline', label: '6. Storyline', icon: Compass },
            { id: 'gun_number', label: '7. Gun Number', icon: Hash },
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
        {/* 1. SIFIR TIME FRAME */}
        {activeTab === 'stf' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-sm">
                1
              </span>
              <div>
                <h3 className="text-base font-black text-white">Sifir Time Frame (STF)</h3>
                <p className="text-xs text-slate-400">
                  Prinsip hirarki fraktal pasar: Menghubungkan waktu besar (HTF) hingga waktu eksekusi presisi (LTF).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-[11px] font-black uppercase text-amber-400">A. Timeframe Induk (HTF)</span>
                <h4 className="text-xs font-bold text-white">Daily &amp; H4 (Big Map)</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Digunakan untuk membaca <strong>Storyline</strong>, tren dominan, serta batas Support/Resistance dan Engulfing mayor.
                </p>
                <div className="text-[11px] text-slate-400 font-mono bg-slate-950 p-2 rounded border border-slate-800">
                  1 Candle Daily = 6 Candle H4 (Siklus 24 Jam)
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-[11px] font-black uppercase text-cyan-400">B. Timeframe Transisi (MTF)</span>
                <h4 className="text-xs font-bold text-white">H1 &amp; M15 (Structure)</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Melihat formasi struktur wave, konfirmasi pembalikan (Kode 6C.9C), dan pembentukan pola breakout awal.
                </p>
                <div className="text-[11px] text-slate-400 font-mono bg-slate-950 p-2 rounded border border-slate-800">
                  1 Candle H4 = 16 Candle M15
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-[11px] font-black uppercase text-emerald-400">C. Timeframe Eksekusi (LTF)</span>
                <h4 className="text-xs font-bold text-white">M5 &amp; M1 (Sniper Trigger)</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Digunakan khusus untuk eksekusi <strong>Zero Floating Zona</strong> dengan Stop Loss ultra tipis di ujung shadow (wick).
                </p>
                <div className="text-[11px] text-slate-400 font-mono bg-slate-950 p-2 rounded border border-slate-800">
                  1 Candle M15 = 3 Candle M5
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-200">
                <strong className="text-amber-400">Kaidah Utama STF:</strong> Jangan pernah entry melawan arah Storyline HTF. Jika HTF menolak Resistance Engulfing menuju Support bawah, LTF hanya mencari peluang SELL di Zero Floating Zona.
              </div>
            </div>
          </div>
        )}

        {/* 2. VALID BREAKOUT & ENGULFING */}
        {activeTab === 'vbo_engulfing' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-sm">
                2
              </span>
              <div>
                <h3 className="text-base font-black text-white">Valid Breakout &amp; Engulfing (VBO)</h3>
                <p className="text-xs text-slate-400">
                  Kekuatan badan lilin (body close) menentukan keabsahan momentum dan penciptaan zona entry baru.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Bullish Engulfing &amp; Valid Breakout
                </span>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                  <li>Lilin hijau (C2) menutup di atas High lilin merah sebelumnya (C1).</li>
                  <li><strong>Valid Breakout:</strong> Badan lilin (body) harus menembus dan menutup di atas level SnR (bukan hanya wick sumbu).</li>
                  <li>Menciptakan <strong>Fresh Buy Engulfing Zone</strong> tempat harga akan di-retest sebelum melanjutkan rally naik.</li>
                </ul>
              </div>

              <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-4 space-y-3">
                <span className="text-xs font-black uppercase text-rose-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  Bearish Engulfing &amp; Valid Breakout
                </span>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                  <li>Lilin merah (C2) menelan utuh badan lilin hijau sebelumnya (C1).</li>
                  <li><strong>Valid Breakout:</strong> Body C2 menutup tegas di bawah Low C1 secara solid.</li>
                  <li>Menciptakan <strong>Fresh Sell Engulfing Zone</strong> tempat harga akan di-retest sebelum mengalami penurunan tajam.</li>
                </ul>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-300">
              <h5 className="font-bold text-white mb-1">Ciri-Ciri Fresh Zone yang Belum Dimediasi:</h5>
              <p>
                Zona Engulfing yang masih <strong>Fresh</strong> (belum pernah disentuh kembali sejak breakout terjadi) memiliki tingkat pantulan tertinggi (akurasi &gt; 80%). Jika sudah disentuh lebih dari 2 kali, zona tersebut dianggap basi/termitigasi.
              </p>
            </div>
          </div>
        )}

        {/* 3. ZERO FLOATING ZONA */}
        {activeTab === 'zero_floating' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-sm">
                3
              </span>
              <div>
                <h3 className="text-base font-black text-white">Zero Floating Zona (ZFZ)</h3>
                <p className="text-xs text-slate-400">
                  Teknik sniper entry di akar/pucuk harga dengan potensi drawdown mendekati 0 pips/poin.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-black text-emerald-400">Zero Floating BUY (Akar Shadow)</h4>
                <p className="text-xs text-slate-300">
                  Entry ditempatkan tepat pada <strong>ujung shadow (wick bawah)</strong> lilin ibu / lilin Engulfing sebelum terjadinya lonjakan harga.
                </p>
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-[11px] text-emerald-300 font-mono">
                  Order Buy Limit / Instant saat harga menyentuh ujung akar wick. SL ditempatkan beberapa pips saja di bawah sumbu.
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-black text-rose-400">Zero Floating SELL (Pucuk Shadow)</h4>
                <p className="text-xs text-slate-300">
                  Entry ditempatkan tepat pada <strong>ujung shadow (wick atas)</strong> lilin puncak sebelum terjadinya dump harga.
                </p>
                <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-lg text-[11px] text-rose-300 font-mono">
                  Order Sell Limit / Instant saat harga menyentuh ujung pucuk wick. SL ditempatkan beberapa pips saja di atas sumbu.
                </div>
              </div>
            </div>

            <div className="p-4 bg-indigo-950/50 border border-indigo-500/30 rounded-xl text-xs text-indigo-200">
              <strong>Keunggulan ZFZ:</strong> Memberikan Risk-to-Reward luar biasa (1:3 hingga 1:10) karena risiko kerugian (SL) sangat kecil, sementara ruang gerak keuntungan sangat leluasa.
            </div>
          </div>
        )}

        {/* 4. KODE 6C.9C */}
        {activeTab === 'kode_6c_9c' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-sm">
                4
              </span>
              <div>
                <h3 className="text-base font-black text-white">Kode 6C.9C (Siklus Lilin Sifir)</h3>
                <p className="text-xs text-slate-400">
                  Hitungan matematis siklus pembentukan candle untuk menentukan timing pembalikan dan kelanjutan tren.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-indigo-400">KODE 6C</span>
                  <span className="px-2 py-0.5 bg-indigo-500/20 rounded text-[10px] text-indigo-300 font-mono">
                    Siklus 6 Lilin
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">Siklus Ekspansi &amp; Retracement</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pada lilin ke-6 (6C) sejak terjadinya swing breakout, pasar biasanya menyelesaikan fase pullback retest. Jika candle ke-6 menyentuh ZFZ, inilah momentum kelanjutan tren (trend continuation) paling akurat.
                </p>
                <div className="text-[11px] text-indigo-300 font-mono bg-slate-950 p-2 rounded border border-indigo-900/50">
                  Rule: 6 Candle H4 = 1 Siklus Harian Penuh.
                </div>
              </div>

              <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-400">KODE 9C</span>
                  <span className="px-2 py-0.5 bg-amber-500/20 rounded text-[10px] text-amber-300 font-mono">
                    Siklus 9 Lilin
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">Siklus Pembalikan / Turning Point</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pada lilin ke-9 (9C), momentum arah sebelumnya mengalami kejenuhan (exhaustion). Ketika lilin ke-9 berada di area SnR / Gun Number, pasar siap melakukan pembalikan arah tajam (reversal sniper).
                </p>
                <div className="text-[11px] text-amber-300 font-mono bg-slate-950 p-2 rounded border border-amber-900/50">
                  Rule: Lilin ke-9 menjadi sinyal puncak/dasar gelombang.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. ZONA 1 LOT [FM] */}
        {activeTab === 'zona_1_lot' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-sm">
                5
              </span>
              <div>
                <h3 className="text-base font-black text-white">Zona 1 Lot [FM] (Full Margin Confluence)</h3>
                <p className="text-xs text-slate-400">
                  Klasifikasi setup tingkat tertinggi di mana semua faktor konfluensi 7 pilar bersatu padu.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-950/60 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-black text-amber-300 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Kriteria Wajib Zona 1 Lot [FM]:</span>
              </h4>
              <ul className="text-xs text-slate-200 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>1. Storyline HTF Jelas:</strong> Mengetahui arah harga dari HTF Support menuju HTF Resistance.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>2. Zero Floating Zona (ZFZ):</strong> Harga masuk tepat ke area pucuk/akar wick fresh.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>3. Valid Breakout &amp; Engulfing:</strong> Terkonfirmasi oleh candle body utuh, bukan wick palsu.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>4. Kode 6C atau 9C Aktif:</strong> Waktu timing lilin bertepatan dengan siklus pantulan.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>5. Gun Number Key Level:</strong> Berada di angka bulat psikologis sakral.</span>
                </li>
              </ul>
              <div className="p-3 bg-black/40 rounded-lg text-xs text-amber-200/90 font-mono border border-amber-500/20">
                Setup ini dijuluki &quot;1 Lot [FM]&quot; karena trader institusional berani memaksimalkan size posisi berkat SL yang sangat rapat (&lt; 1%) dan akurasi yang terbukti tinggi.
              </div>
            </div>
          </div>
        )}

        {/* 6. STORYLINE */}
        {activeTab === 'storyline' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-sm">
                6
              </span>
              <div>
                <h3 className="text-base font-black text-white">Storyline (Alur Cerita Perjalanan Harga)</h3>
                <p className="text-xs text-slate-400">
                  Menjawab 2 pertanyaan fundamental sebelum memasang order: Dari mana harga berasal, dan ke mana tujuan harga selanjutnya?
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-[11px] font-black uppercase text-indigo-400">1. Origin (Asal Muasal)</span>
                <h4 className="text-xs font-bold text-white">Titik Pantulan Terakhir</h4>
                <p className="text-xs text-slate-300">
                  Apakah harga baru saja menolak Support Bullish Engulfing atau Resistance Bearish Engulfing pada TF H4 / Daily?
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-[11px] font-black uppercase text-amber-400">2. Current Phase (Fase Terkini)</span>
                <h4 className="text-xs font-bold text-white">Retest / Ekspansi</h4>
                <p className="text-xs text-slate-300">
                  Saat ini harga sedang berada di fase apa? Apakah sedang retest Zero Floating Zona pada LTF (M5/M15)?
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-[11px] font-black uppercase text-emerald-400">3. Destination (Tujuan TP)</span>
                <h4 className="text-xs font-bold text-white">Target Take Profit</h4>
                <p className="text-xs text-slate-300">
                  Di mana zona Fresh Engulfing berlawanan di TF H4? Itulah terminal akhir Take Profit posisi trading Anda.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 7. GUN NUMBER */}
        {activeTab === 'gun_number' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-sm">
                7
              </span>
              <div>
                <h3 className="text-base font-black text-white">Gun Number (Angka Sakral &amp; Gann Levels)</h3>
                <p className="text-xs text-slate-400">
                  Level angka psikologis bulat (Round Psychological Numbers) dan sudut matematis Gann tempat bank dan institusi memasang limit order.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Hash className="w-4 h-4 text-amber-400" />
                  <span>Level Angka Bulat Psikologis</span>
                </h4>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                  <li><strong>Triple Zero (.000):</strong> Level sakral utama institusi (misal XAU/USD $2,900, $3,000; BTC $95,000, $100,000).</li>
                  <li><strong>Midpoint (.500):</strong> Titik keseimbangan paruh harga (misal XAU/USD $2,950; BTC $96,500).</li>
                  <li><strong>Sub-levels (.200 &amp; .800):</strong> Titik akselerasi breakout momentum.</li>
                </ul>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>Kombinasi Gun Number + ZFZ</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Jika <strong>Zero Floating Zona</strong> bertepatan langsung dengan salah satu <strong>Gun Number</strong> (misal wick retest terjadi tepat di level bulat .000 atau .500), probabilitas reaksi pantulan instan meningkat hingga 95%.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
