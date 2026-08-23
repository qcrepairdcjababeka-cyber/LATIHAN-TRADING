/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Candle, H4Box } from '../types';
import { analyze5mCandle } from '../utils/h4BoxScanner';
import { Sparkles, TrendingUp, TrendingDown, CheckCircle2, XCircle, Layers, Flame } from 'lucide-react';

export default function SimulationSandbox() {
  const [preset, setPreset] = useState<'buy_2c' | 'sell_2c' | 'weak_buy_flip' | 'bull_bear_flip' | 'bear_bull_flip'>('buy_2c');
  const [activeCandleTab, setActiveCandleTab] = useState<1 | 2>(2);

  // Base H4 Box for sandbox (Box Lilin #2 and #3)
  const c2Candle = { time: 1, timeString: 'H4-2', open: 66800, high: 67200, low: 66500, close: 67150, volume: 500 };
  const c3Candle = { time: 2, timeString: 'H4-3', open: 67150, high: 67400, low: 66700, close: 67300, volume: 480 };

  const h4Box: H4Box = {
    id: 'sandbox-h4-box',
    candle2Index: 38,
    candle2: c2Candle,
    candle3Index: 37,
    candle3: c3Candle,
    box2: {
      candleNumber: 2,
      candleIndex: 38,
      candle: c2Candle,
      top: 67200,
      bottom: 66500,
      bodyTop: 67150,
      bodyBottom: 66800,
      isBullish: true,
    },
    box3: {
      candleNumber: 3,
      candleIndex: 37,
      candle: c3Candle,
      top: 67400,
      bottom: 66700,
      bodyTop: 67300,
      bodyBottom: 67150,
      isBullish: true,
    },
    top: 67200,
    bottom: 66500,
    bodyTop: 67150,
    bodyBottom: 66800,
    type: 'bullish',
    timeframe: '4h',
  };

  // Candle 1 (5M)
  const [c1Open, setC1Open] = useState<number>(66420);
  const [c1Close, setC1Close] = useState<number>(66680);
  const [c1High, setC1High] = useState<number>(66720);
  const [c1Low, setC1Low] = useState<number>(66380);

  // Candle 2 (5M - Trigger)
  const [c2Open, setC2Open] = useState<number>(66680);
  const [c2Close, setC2Close] = useState<number>(67050);
  const [c2High, setC2High] = useState<number>(67100);
  const [c2Low, setC2Low] = useState<number>(66650);

  const applyPreset = (type: 'buy_2c' | 'sell_2c' | 'weak_buy_flip' | 'bull_bear_flip' | 'bear_bull_flip') => {
    setPreset(type);
    if (type === 'buy_2c') {
      // 2 Consecutive Strong Bullish candles entering Box
      setC1Open(66420);
      setC1Close(66680);
      setC1High(66720);
      setC1Low(66380);

      setC2Open(66680);
      setC2Close(67050);
      setC2High(67100);
      setC2Low(66650);
    } else if (type === 'sell_2c') {
      // 2 Consecutive Strong Bearish candles entering Box
      setC1Open(67280);
      setC1Close(67020);
      setC1High(67320);
      setC1Low(66980);

      setC2Open(67020);
      setC2Close(66650);
      setC2High(67050);
      setC2Low(66600);
    } else if (type === 'weak_buy_flip') {
      // Candle masuk box WEAK (sumbu panjang / body < 50%) -> Cancel BUY & Berubah SELL
      setC1Open(66420);
      setC1Close(66540);
      setC1High(66850);
      setC1Low(66400);

      setC2Open(66540);
      setC2Close(66570);
      setC2High(66900);
      setC2Low(66510);
    } else if (type === 'bull_bear_flip') {
      // Candle 1 Bullish masuk box, tapi dibarengi Candle 2 Bearish -> Cancel BUY & Berubah SELL
      setC1Open(66420);
      setC1Close(66780);
      setC1High(66800);
      setC1Low(66400);

      setC2Open(66780);
      setC2Close(66480);
      setC2High(66820);
      setC2Low(66450);
    } else if (type === 'bear_bull_flip') {
      // Candle 1 Bearish masuk box, tapi dibarengi Candle 2 Bullish -> Cancel SELL & Berubah BUY
      setC1Open(67280);
      setC1Close(66950);
      setC1High(67300);
      setC1Low(66920);

      setC2Open(66950);
      setC2Close(67240);
      setC2High(67260);
      setC2Low(66930);
    }
  };

  const candle1_5m: Candle = useMemo(() => ({
    time: Date.now() - 300000,
    timeString: '04:55',
    open: c1Open,
    high: Math.max(c1High, c1Open, c1Close),
    low: Math.min(c1Low, c1Open, c1Close),
    close: c1Close,
    volume: 340,
  }), [c1Open, c1Close, c1High, c1Low]);

  const candle2_5m: Candle = useMemo(() => ({
    time: Date.now(),
    timeString: '05:00',
    open: c2Open,
    high: Math.max(c2High, c2Open, c2Close),
    low: Math.min(c2Low, c2Open, c2Close),
    close: c2Close,
    volume: 520,
  }), [c2Open, c2Close, c2High, c2Low]);

  const mockHistory = useMemo(() => [candle1_5m, candle2_5m], [candle1_5m, candle2_5m]);

  const analysis1 = useMemo(() => {
    return analyze5mCandle(candle1_5m, 0, h4Box.box2, mockHistory);
  }, [candle1_5m, h4Box, mockHistory]);

  const analysis2 = useMemo(() => {
    return analyze5mCandle(candle2_5m, 1, h4Box.box2, mockHistory);
  }, [candle2_5m, h4Box, mockHistory]);

  const bodyPct1 = Math.round(analysis1.bodyRatio * 100);
  const bodyPct2 = Math.round(analysis2.bodyRatio * 100);

  // Verification of minimal 2 consecutive strong closing candles rule
  const isBothStrong = analysis1.isStrong && analysis2.isStrong;
  const isSameDirection = analysis1.direction === analysis2.direction && analysis1.direction !== 'doji';
  const isInsideOrReentry = analysis2.isInsideBox || analysis2.isBreakoutReentry;

  // Evaluasi Rule Pembalikan Sinyal (Memory Flip)
  const isAttemptingBuy = c1Open < h4Box.box2.bottom || c2Open < h4Box.box2.bottom || c1Close >= h4Box.box2.bottom;
  const isAttemptingSell = c1Open > h4Box.box2.top || c2Open > h4Box.box2.top || c1Close <= h4Box.box2.top;

  const isWeakEntry = !analysis2.isStrong || analysis2.bodyRatio < 0.50 || analysis2.direction === 'doji';
  const isBullishPairedWithBearish = 
    (analysis1.direction === 'bullish' && (analysis2.direction === 'bearish' || c2Close < c2Open)) ||
    (c2Close > c2Open && c2Close < c1Close);
  const isBearishPairedWithBullish = 
    (analysis1.direction === 'bearish' && (analysis2.direction === 'bullish' || c2Close > c2Open)) ||
    (c2Close < c2Open && c2Close > c1Close);

  // Verdict state:
  const isFlippedToSell = (isAttemptingBuy && isWeakEntry) || isBullishPairedWithBearish;
  const isFlippedToBuy = (isAttemptingSell && isWeakEntry) || isBearishPairedWithBullish;
  const isNormalValidBuy = isBothStrong && analysis1.direction === 'bullish' && analysis2.direction === 'bullish' && !isBullishPairedWithBearish;
  const isNormalValidSell = isBothStrong && analysis1.direction === 'bearish' && analysis2.direction === 'bearish' && !isBearishPairedWithBullish;

  const midPrice = (h4Box.box2.top + h4Box.box2.bottom) / 2;

  return (
    <div id="simulation-sandbox" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6 font-sans animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-100 font-sans tracking-tight">
              Simulator & Tester Memory Lilin 5M Masuk Box H4
            </h2>
            <p className="text-xs text-slate-400">
              Uji aturan memory: Jika candle masuk box <strong>weak (lemah)</strong> atau <strong>bullish dibarengi bearish</strong> ➔ Signal BUY <strong>CANCEL & BERUBAH SELL</strong> (dan sebaliknya).
            </p>
          </div>
        </div>

        {/* Preset Selector Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyPreset('buy_2c')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              preset === 'buy_2c'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>2x Bullish Kuat (BUY Valid)</span>
          </button>

          <button
            onClick={() => applyPreset('sell_2c')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              preset === 'sell_2c'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>2x Bearish Kuat (SELL Valid)</span>
          </button>

          <button
            onClick={() => applyPreset('weak_buy_flip')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              preset === 'weak_buy_flip'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Masuk Lemah (Cancel BUY ➔ SELL)</span>
          </button>

          <button
            onClick={() => applyPreset('bull_bear_flip')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              preset === 'bull_bear_flip'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Bullish + Bearish (Cancel BUY ➔ SELL)</span>
          </button>

          <button
            onClick={() => applyPreset('bear_bull_flip')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              preset === 'bear_bull_flip'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Bearish + Bullish (Cancel SELL ➔ BUY)</span>
          </button>
        </div>
      </div>

      {/* Interactive Controls & Live Validation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Candle Selector Tabs & Sliders */}
        <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pengaturan 2 Lilin 5 Menit (OHLC)
            </h3>
            <div className="flex gap-1.5">
              <button
                onClick={() => setActiveCandleTab(1)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                  activeCandleTab === 1
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Lilin Konfirmasi #1
              </button>
              <button
                onClick={() => setActiveCandleTab(2)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                  activeCandleTab === 2
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Lilin Konfirmasi #2 (Trigger)
              </button>
            </div>
          </div>

          {activeCandleTab === 1 ? (
            <div className="space-y-3 font-mono text-xs animate-fade-in">
              <span className="text-[11px] font-bold text-indigo-400 block mb-2">
                ⚙️ Parameter Lilin 5M Ke-1 ({analysis1.direction.toUpperCase()} - {bodyPct1}% Body)
              </span>
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Harga Open (C1):</span>
                  <strong className="text-white">${c1Open}</strong>
                </div>
                <input
                  type="range"
                  min="66000"
                  max="67500"
                  step="10"
                  value={c1Open}
                  onChange={(e) => setC1Open(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Harga Close (C1):</span>
                  <strong className={c1Close >= c1Open ? 'text-emerald-400' : 'text-rose-400'}>${c1Close}</strong>
                </div>
                <input
                  type="range"
                  min="66000"
                  max="67500"
                  step="10"
                  value={c1Close}
                  onChange={(e) => setC1Close(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Harga High (C1):</span>
                  <strong className="text-white">${Math.max(c1High, c1Open, c1Close)}</strong>
                </div>
                <input
                  type="range"
                  min="66000"
                  max="67600"
                  step="10"
                  value={c1High}
                  onChange={(e) => setC1High(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Harga Low (C1):</span>
                  <strong className="text-white">${Math.min(c1Low, c1Open, c1Close)}</strong>
                </div>
                <input
                  type="range"
                  min="65900"
                  max="67500"
                  step="10"
                  value={c1Low}
                  onChange={(e) => setC1Low(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs animate-fade-in">
              <span className="text-[11px] font-bold text-indigo-400 block mb-2">
                ⚙️ Parameter Lilin 5M Ke-2 / Trigger ({analysis2.direction.toUpperCase()} - {bodyPct2}% Body)
              </span>
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Harga Open (C2):</span>
                  <strong className="text-white">${c2Open}</strong>
                </div>
                <input
                  type="range"
                  min="66000"
                  max="67500"
                  step="10"
                  value={c2Open}
                  onChange={(e) => setC2Open(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Harga Close (C2):</span>
                  <strong className={c2Close >= c2Open ? 'text-emerald-400' : 'text-rose-400'}>${c2Close}</strong>
                </div>
                <input
                  type="range"
                  min="66000"
                  max="67500"
                  step="10"
                  value={c2Close}
                  onChange={(e) => setC2Close(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Harga High (C2):</span>
                  <strong className="text-white">${Math.max(c2High, c2Open, c2Close)}</strong>
                </div>
                <input
                  type="range"
                  min="66000"
                  max="67600"
                  step="10"
                  value={c2High}
                  onChange={(e) => setC2High(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Harga Low (C2):</span>
                  <strong className="text-white">${Math.min(c2Low, c2Open, c2Close)}</strong>
                </div>
                <input
                  type="range"
                  min="65900"
                  max="67500"
                  step="10"
                  value={c2Low}
                  onChange={(e) => setC2Low(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Area Box H4 Lilin #2:</span>
            <strong className="text-indigo-300 font-mono">${h4Box.box2.bottom} - ${h4Box.box2.top}</strong>
          </div>
        </div>

        {/* Right Column: Live Validation Verdict for 2 Consecutive Strong Candles */}
        <div className="flex flex-col justify-between space-y-4">
          <div className={`p-5 rounded-2xl border ${
            isFlippedToSell || isFlippedToBuy
              ? 'bg-amber-950/40 border-amber-500/60'
              : (isNormalValidBuy || isNormalValidSell)
              ? 'bg-emerald-950/30 border-emerald-500/50'
              : 'bg-rose-950/30 border-rose-500/50'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              {isFlippedToSell || isFlippedToBuy ? (
                <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm animate-pulse">⚡</div>
              ) : isNormalValidBuy || isNormalValidSell ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              ) : (
                <XCircle className="w-7 h-7 text-rose-400" />
              )}
              <div>
                <h4 className={`text-base font-black ${
                  isFlippedToSell || isFlippedToBuy
                    ? 'text-amber-300'
                    : isNormalValidBuy || isNormalValidSell
                    ? 'text-emerald-300'
                    : 'text-rose-300'
                }`}>
                  {isFlippedToSell
                    ? '⚠️ SINYAL BUY DIBATALKAN ➔ BERUBAH MENJADI SELL'
                    : isFlippedToBuy
                    ? '⚠️ SINYAL SELL DIBATALKAN ➔ BERUBAH MENJADI BUY'
                    : isNormalValidBuy
                    ? 'SINYAL BUY VALID (2x CANDLE BULLISH KUAT)'
                    : isNormalValidSell
                    ? 'SINYAL SELL VALID (2x CANDLE BEARISH KUAT)'
                    : 'KONDISI NETRAL / BELUM MEMENUHI SYARAT'}
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  {isFlippedToSell
                    ? `Candle masuk box lemah (<50% body) atau candle bullish langsung dibarengi candle bearish penolakan. Sinyal BUY otomatis dibatalkan dan dieksekusi SELL menuju Garis Tengah ($${midPrice}) & Batas Bawah Box ($${h4Box.box2.bottom}).`
                    : isFlippedToBuy
                    ? `Candle masuk box lemah (<50% body) atau candle bearish langsung dibarengi candle bullish penolakan. Sinyal SELL otomatis dibatalkan dan dieksekusi BUY menuju Garis Tengah ($${midPrice}) & Batas Atas Box ($${h4Box.box2.top}).`
                    : isNormalValidBuy
                    ? `Candle Bullish kuat masuk ke Box H4. Target TP 1: Garis Tengah ($${midPrice}), TP 2: Batas Atas Box ($${h4Box.box2.top}).`
                    : isNormalValidSell
                    ? `Candle Bearish kuat masuk ke Box H4. Target TP 1: Garis Tengah ($${midPrice}), TP 2: Batas Bawah Box ($${h4Box.box2.bottom}).`
                    : 'Uji variasi candle di sebelah kiri atau pilih preset untuk melihat simulasi.'}
                </p>
              </div>
            </div>

            {/* Diagnostic Table comparing Candle 1 and Candle 2 */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <div className="space-y-1 border-r border-slate-800 pr-2">
                <span className="text-indigo-300 font-bold block text-[11px]">LILIN 5M KE-1:</span>
                <div className="text-slate-300">Arah: <strong className={analysis1.direction === 'bullish' ? 'text-emerald-400' : 'text-rose-400'}>{analysis1.direction.toUpperCase()}</strong></div>
                <div className="text-slate-300">Body Ratio: <strong className={analysis1.isStrong ? 'text-emerald-400' : 'text-rose-400'}>{bodyPct1}% {analysis1.isStrong ? '(Kuat)' : '(Weak/Sumbu)'}</strong></div>
                <div className="text-slate-300">Status: <strong className={analysis1.isStrong ? 'text-emerald-400' : 'text-rose-400'}>{analysis1.isStrong ? 'VALID' : 'LEMAH'}</strong></div>
              </div>

              <div className="space-y-1 pl-2">
                <span className="text-indigo-300 font-bold block text-[11px]">LILIN 5M KE-2 (TRIGGER):</span>
                <div className="text-slate-300">Arah: <strong className={analysis2.direction === 'bullish' ? 'text-emerald-400' : 'text-rose-400'}>{analysis2.direction.toUpperCase()}</strong></div>
                <div className="text-slate-300">Body Ratio: <strong className={analysis2.isStrong ? 'text-emerald-400' : 'text-rose-400'}>{bodyPct2}% {analysis2.isStrong ? '(Kuat)' : '(Weak/Sumbu)'}</strong></div>
                <div className="text-slate-300">Status: <strong className={analysis2.isStrong ? 'text-emerald-400' : 'text-rose-400'}>{analysis2.isStrong ? 'VALID' : 'LEMAH'}</strong></div>
              </div>
            </div>
          </div>

          {/* Visual Dual Candle Preview */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-around h-36">
            <div className="text-center">
              <span className="text-[10px] text-slate-500 block mb-1">Lilin Konfirmasi #1</span>
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-3 bg-slate-400"></div>
                <div className={`w-8 rounded-sm flex items-center justify-center text-[10px] font-black ${
                  c1Close >= c1Open ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                }`} style={{ height: `${Math.max(bodyPct1 * 0.6, 12)}px` }}>
                  {bodyPct1}%
                </div>
                <div className="w-0.5 h-3 bg-slate-400"></div>
              </div>
            </div>

            <div className="text-center">
              <span className="text-[10px] text-slate-500 block mb-1">Lilin Konfirmasi #2</span>
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-3 bg-slate-400"></div>
                <div className={`w-8 rounded-sm flex items-center justify-center text-[10px] font-black ${
                  c2Close >= c2Open ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                }`} style={{ height: `${Math.max(bodyPct2 * 0.6, 12)}px` }}>
                  {bodyPct2}%
                </div>
                <div className="w-0.5 h-3 bg-slate-400"></div>
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <div>Status: <strong className={isNormalValidBuy || isNormalValidSell ? 'text-emerald-400' : isFlippedToSell || isFlippedToBuy ? 'text-amber-400' : 'text-slate-400'}>
                {isFlippedToSell ? '⚠️ Cancel BUY ➔ Flip SELL' : isFlippedToBuy ? '⚠️ Cancel SELL ➔ Flip BUY' : isNormalValidBuy ? 'Sinyal BUY Valid' : isNormalValidSell ? 'Sinyal SELL Valid' : 'Menunggu Konfirmasi'}
              </strong></div>
              <div>Eksekusi: <strong className="text-white">Close Lilin #2 (${c2Close})</strong></div>
              <div>TP 1 (Garis Tengah): <strong className="text-emerald-400">${midPrice}</strong></div>
              <div>TP 2 (Batas Box): <strong className="text-teal-300">${isFlippedToSell || isNormalValidSell ? h4Box.box2.bottom : h4Box.box2.top}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
