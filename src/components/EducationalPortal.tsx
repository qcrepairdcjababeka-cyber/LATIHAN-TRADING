/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BookOpen, 
  Layers, 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Target, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Zap
} from 'lucide-react';

export default function EducationalPortal() {
  const [activeTab, setActiveTab] = useState<'h4_box' | 'strong_candle' | 'buy_rules' | 'sell_rules' | 'memory_flip' | 'risk_mgmt'>('h4_box');

  return (
    <div id="educational-portal" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl font-sans animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-100 font-sans tracking-tight">
              Panduan Metode Box H4 (Lilin Ke-2 & #3) + 5M Candle Kuat + Memory Flip
            </h2>
            <p className="text-xs text-slate-400">
              SOP lengkap strategi multi-timeframe: Menentukan Key Zone Box H4 dari Lilin Ke-2/Ke-3, konfirmasi eksekusi di Timeframe 5M, dan aturan otomatis Memory Inget Reversal.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'h4_box', label: '1. Area Box H4 (#2 & #3)', icon: Layers },
            { id: 'strong_candle', label: '2. Candle 5M Kuat (Bukan Wick)', icon: Flame },
            { id: 'buy_rules', label: '3. Setup BUY', icon: TrendingUp },
            { id: 'sell_rules', label: '4. Setup SELL', icon: TrendingDown },
            { id: 'memory_flip', label: '5. Aturan Memory (Cancel & Flip)', icon: Zap },
            { id: 'risk_mgmt', label: '6. Manajemen Risiko & TP', icon: Target },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                id={`btn-tab-edu-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: CARA MEMBENTUK BOX H4 (LILIN KE-2) */}
      {activeTab === 'h4_box' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-black uppercase tracking-wider inline-block">
              Higher Timeframe (H4) Key Zone
            </span>
            <h3 className="text-xl font-black text-slate-100">
              Menentukan Area Box pada Lilin H4 Real-Time Ke-2
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Di timeframe 4 Jam (H4), kita mengunci <strong>Lilin ke-2</strong> (lilin tertutup tepat sebelum lilin yang sedang running) sebagai area referensi tunggal. High dan Low dari lilin ke-2 inilah yang menjadi <strong>Box H4</strong>.
            </p>

            <div className="space-y-2.5 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-indigo-300">Batas Atas Box (High Lilin #2):</strong> Titik harga tertinggi dari lilin H4 ke-2.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-indigo-300">Batas Bawah Box (Low Lilin #2):</strong> Titik harga terendah dari lilin H4 ke-2.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Proyeksi Otomatis ke Chart 5M:</strong> Box ini diproyeksikan secara real-time ke grafik 5 Menit sebagai zona pemicu entri trading presisi.
                </div>
              </div>
            </div>
          </div>

          {/* Diagram Box H4 Lilin 2 */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center">
            <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Visualisasi Box H4 (Lilin #2)</h4>
            <div className="w-full max-w-sm h-64 relative border border-slate-800 rounded-xl bg-slate-900/50 p-4 flex items-center justify-around">
              {/* Box 2 Overlay */}
              <div className="absolute left-16 right-16 top-10 bottom-6 bg-indigo-600/20 border-2 border-dashed border-indigo-400/80 rounded-lg flex items-start justify-center p-1.5 pointer-events-none">
                <span className="text-[10px] font-extrabold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-500/50">
                  BOX H4 (LILIN #2)
                </span>
              </div>

              {/* Candle 2 (Acuan Box) */}
              <div className="flex flex-col items-center z-10">
                <div className="w-0.5 h-10 bg-slate-400"></div>
                <div className="w-10 h-28 bg-indigo-500 rounded-sm flex items-center justify-center text-xs font-black text-white shadow-lg border border-indigo-300">
                  #2
                </div>
                <div className="w-0.5 h-6 bg-slate-400"></div>
                <span className="text-xs font-black text-indigo-300 mt-1">Lilin #2 (Acuan)</span>
              </div>

              {/* Candle 1 (Running) */}
              <div className="flex flex-col items-center z-10 opacity-70">
                <div className="w-0.5 h-6 bg-slate-400"></div>
                <div className="w-10 h-16 bg-slate-700 border border-slate-400 border-dashed rounded-sm flex items-center justify-center text-xs font-bold text-white">
                  #1
                </div>
                <div className="w-0.5 h-6 bg-slate-400"></div>
                <span className="text-xs font-bold text-slate-400 mt-1">Lilin #1 (Live)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CANDLE 5M KUAT VS WICK TIPIS */}
      {activeTab === 'strong_candle' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 text-xs font-black uppercase tracking-wider inline-block">
              Lower Timeframe (5M) Rule
            </span>
            <h3 className="text-xl font-black text-slate-100">
              Aturan Ketat: "Candle 5M Kuat, Bukan Wick / Sumbu"
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Banyak false signal terjadi ketika harga hanya menyentuh zona dengan sumbu panjang (wick) lalu berbalik seketika. Strategi ini <strong>mewajibkan badan candle (body) mendominasi minimal 50%</strong> dari total rentang lilin 5 Menit.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-emerald-950/30 border border-emerald-500/40 p-3.5 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs mb-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>VALID (CANDLE KUAT)</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc pl-4">
                  <li>Body &ge; 50% dari total High-Low</li>
                  <li>Momentum tegas saat masuk ke Box</li>
                  <li>Volume mendukung pergerakan</li>
                </ul>
              </div>

              <div className="bg-rose-950/30 border border-rose-500/40 p-3.5 rounded-xl">
                <div className="flex items-center gap-2 text-rose-400 font-black text-xs mb-1.5">
                  <XCircle className="w-4 h-4" />
                  <span>TIDAK VALID (HANYA WICK)</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc pl-4">
                  <li>Body &lt; 50% (didominasi sumbu/ekor)</li>
                  <li>Bentuk Doji, Spinning Top, Shooting Star</li>
                  <li>Penolakan instan tanpa volume badan</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Perbandingan Visual Candle Kuat vs Wick */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center">
            <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Perbandingan Body vs Wick</h4>
            <div className="w-full max-w-sm grid grid-cols-2 gap-4 h-56 items-center">
              {/* Strong Candle */}
              <div className="bg-slate-900 p-4 rounded-xl border border-emerald-500/40 flex flex-col items-center">
                <span className="text-[10px] font-bold text-emerald-400 mb-2">CANDLE KUAT (&ge; 80% Body)</span>
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-3 bg-emerald-400"></div>
                  <div className="w-8 h-28 bg-emerald-500 rounded-sm flex items-center justify-center text-[10px] font-black text-slate-950">
                    80%
                  </div>
                  <div className="w-0.5 h-3 bg-emerald-400"></div>
                </div>
                <span className="text-[9.5px] font-bold text-emerald-300 mt-2 bg-emerald-950 px-2 py-0.5 rounded">SINYAL VALID</span>
              </div>

              {/* Weak Wick Candle */}
              <div className="bg-slate-900 p-4 rounded-xl border border-rose-500/40 flex flex-col items-center">
                <span className="text-[10px] font-bold text-rose-400 mb-2">WICK TIPIS (&lt; 25% Body)</span>
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-16 bg-slate-400"></div>
                  <div className="w-8 h-4 bg-rose-500 rounded-sm flex items-center justify-center text-[8px] font-black text-white">
                    20%
                  </div>
                  <div className="w-0.5 h-16 bg-slate-400"></div>
                </div>
                <span className="text-[9.5px] font-bold text-rose-400 mt-2 bg-rose-950 px-2 py-0.5 rounded">DIABAIKAN (FALSE)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SETUP BUY */}
      {activeTab === 'buy_rules' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-100">SOP Lengkap Sinyal BUY (Breakout Bawah ➔ Masuk Kembali)</h3>
              <p className="text-xs text-slate-400">Syarat lengkap eksekusi posisi Buy saat harga 5M keluar di bawah Box H4 lalu masuk kembali dengan candle kuat</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">1</div>
              <h4 className="text-sm font-bold text-white">Breakout Bawah Kotak H4</h4>
              <p className="text-xs text-slate-400">Harga pada timeframe 5 Menit sempat menembus/keluar di bawah batas bawah Box H4 (Low Lilin #2).</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">2</div>
              <h4 className="text-sm font-bold text-white">Masuk Kembali (Candle Kuat Bullish)</h4>
              <p className="text-xs text-slate-400">Candle 5 Menit berikutnya berhasil <strong>masuk kembali ke dalam Box H4</strong> dengan badan candle Bullish tebal &ge; 50% (bukan wick tipis).</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">3</div>
              <h4 className="text-sm font-bold text-white">Titik Entry, SL & TP</h4>
              <p className="text-xs text-slate-400">
                • <strong>Entry:</strong> Saat candle 5M masuk kembali ke dalam Box H4 (ditandai kotak merah)<br />
                • <strong>SL:</strong> Di bawah titik terendah breakout (Swing Low)<br />
                • <strong>TP 1:</strong> Garis Tengah Box H4 (Midline 50% warna hitam)<br />
                • <strong>TP 2:</strong> Batas Atas Box H4 (High Lilin acuan H4)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SETUP SELL */}
      {activeTab === 'sell_rules' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-100">SOP Lengkap Sinyal SELL (Breakout Atas ➔ Masuk Kembali)</h3>
              <p className="text-xs text-slate-400">Syarat lengkap eksekusi posisi Sell saat harga 5M keluar di atas Box H4 lalu masuk kembali dengan candle kuat</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded-full bg-rose-600 text-white font-black text-xs flex items-center justify-center">1</div>
              <h4 className="text-sm font-bold text-white">Breakout Atas Kotak H4</h4>
              <p className="text-xs text-slate-400">Harga pada timeframe 5 Menit sempat menembus/keluar di atas batas atas Box H4 (High Lilin #2).</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded-full bg-rose-600 text-white font-black text-xs flex items-center justify-center">2</div>
              <h4 className="text-sm font-bold text-white">Masuk Kembali (Candle Kuat Bearish)</h4>
              <p className="text-xs text-slate-400">Candle 5 Menit berikutnya berhasil <strong>masuk kembali ke dalam Box H4</strong> dengan badan candle Bearish tebal &ge; 50% (bukan wick tipis).</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded-full bg-rose-600 text-white font-black text-xs flex items-center justify-center">3</div>
              <h4 className="text-sm font-bold text-white">Titik Entry, SL & TP</h4>
              <p className="text-xs text-slate-400">
                • <strong>Entry:</strong> Saat candle 5M masuk kembali ke dalam Box H4 (ditandai kotak merah)<br />
                • <strong>SL:</strong> Di atas titik tertinggi breakout (Swing High)<br />
                • <strong>TP 1:</strong> Garis Tengah Box H4 (Midline 50% warna hitam)<br />
                • <strong>TP 2:</strong> Batas Bawah Box H4 (Low Lilin acuan H4)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MEMORY FLIP & PEMBALIKAN SINYAL */}
      {activeTab === 'memory_flip' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-100">Aturan Memory: Inget Sinyal Lemah / Berpasangan (Cancel & Flip)</h3>
              <p className="text-xs text-slate-400">Aturan khusus pengingat pembalikan arah saat candle yang masuk box tidak bertenaga atau langsung dibalas oleh candle berlawanan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box Skenario 1 */}
            <div className="bg-slate-950 p-5 rounded-xl border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-black bg-amber-500 text-slate-950 uppercase">
                  Skenario BUY ➔ Cancel & Berubah SELL
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Jika candle 5M mencoba masuk kembali ke Box H4 dari bawah untuk sinyal BUY, namun:
              </p>
              <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
                <li><strong className="text-amber-300">Candle Weak (Lemah):</strong> Badan candle &lt; 50% atau didominasi sumbu/doji.</li>
                <li><strong className="text-amber-300">Bullish Dibarengi Bearish:</strong> Candle Bullish masuk box langsung disusul/dibalas oleh Candle Bearish penolakan.</li>
              </ul>
              <div className="p-3 bg-rose-950/40 rounded-lg border border-rose-500/40 text-xs text-rose-200">
                ⚡ <strong>Keputusan Sistem:</strong> Sinyal BUY otomatis <strong>DIBATALKAN (CANCEL)</strong> dan sistem langsung mengeksekusi <strong>SELL</strong> dengan target:
                <br />• <strong>TP 1:</strong> Garis Tengah Box H4 (Midline 50% warna hitam)
                <br />• <strong>TP 2:</strong> Batas Bawah Box H4
              </div>
            </div>

            {/* Box Skenario 2 */}
            <div className="bg-slate-950 p-5 rounded-xl border border-teal-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-xs font-black bg-teal-500 text-slate-950 uppercase">
                  Skenario SELL ➔ Cancel & Berubah BUY
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Jika candle 5M mencoba masuk kembali ke Box H4 dari atas untuk sinyal SELL, namun:
              </p>
              <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
                <li><strong className="text-teal-300">Candle Weak (Lemah):</strong> Badan candle &lt; 50% atau didominasi sumbu/doji.</li>
                <li><strong className="text-teal-300">Bearish Dibarengi Bullish:</strong> Candle Bearish masuk box langsung disusul/dibalas oleh Candle Bullish penolakan.</li>
              </ul>
              <div className="p-3 bg-emerald-950/40 rounded-lg border border-emerald-500/40 text-xs text-emerald-200">
                ⚡ <strong>Keputusan Sistem:</strong> Sinyal SELL otomatis <strong>DIBATALKAN (CANCEL)</strong> dan sistem langsung mengeksekusi <strong>BUY</strong> dengan target:
                <br />• <strong>TP 1:</strong> Garis Tengah Box H4 (Midline 50% warna hitam)
                <br />• <strong>TP 2:</strong> Batas Atas Box H4
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: RISK MANAGEMENT */}
      {activeTab === 'risk_mgmt' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-100">Prinsip Manajemen Risiko & Disiplin Eksekusi</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Kunci utama konsistensi pada metode ini adalah <strong>Risk-to-Reward (RR) minimal 1:2</strong>. Jangan memaksakan entri jika jarak ke Stop Loss terlalu lebar dibanding potensi target.
            </p>

            <div className="space-y-2.5">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                <strong className="text-indigo-400 block mb-1">Maksimal Risiko per Posisi:</strong>
                <span className="text-slate-300">Gunakan risiko 1% - 2% dari total modal trading Anda pada setiap setup sinyal.</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                <strong className="text-emerald-400 block mb-1">Partial Take Profit (TP1, TP2, TP3):</strong>
                <span className="text-slate-300">Tutup 50% posisi saat mencapai TP1 (1:1.5 RR), lalu geser Stop Loss ke Titik Impas (BEP) untuk melindungi modal.</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Matriks Keberhasilan Target</h4>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 rounded bg-emerald-950/30 border border-emerald-500/30">
                <span className="text-emerald-400 font-bold">Target 1 (TP 1)</span>
                <span className="text-white font-black">RR 1 : 1.5</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-emerald-950/40 border border-emerald-500/40">
                <span className="text-emerald-400 font-bold">Target 2 (TP 2)</span>
                <span className="text-white font-black">RR 1 : 2.5</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-emerald-950/60 border border-emerald-500/60">
                <span className="text-emerald-400 font-bold">Target 3 (TP 3)</span>
                <span className="text-white font-black">RR 1 : 3.5</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
