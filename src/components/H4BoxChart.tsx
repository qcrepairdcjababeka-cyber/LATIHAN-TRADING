/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Candle, TradingSignal, ScanResult } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, Sparkles, Sliders, Layers, Target, Clock, Hash, Compass, Award } from 'lucide-react';
import { formatPrice } from '../utils/stfStrategyScanner';

interface H4BoxChartProps {
  candles: Candle[];
  activeSignal: TradingSignal | null;
  timeframe: string;
  symbol: string;
  scanData?: ScanResult | null;
  focusBox?: any;
  h4Box?: any;
  latest5mAnalysis?: any;
}

export default function H4BoxChart({
  candles,
  activeSignal,
  timeframe,
  symbol,
  scanData
}: H4BoxChartProps) {
  const [visibleCount, setVisibleCount] = useState<number>(timeframe === '4h' ? 35 : 50);
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const [hoveredCandleIdx, setHoveredCandleIdx] = useState<number | null>(null);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Countdown timer for active candle
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (candles.length === 0) {
      setTimeRemaining('');
      return;
    }

    const intervalMs = timeframe === '4h'
      ? 4 * 60 * 60 * 1000
      : timeframe === '15m'
        ? 15 * 60 * 1000
        : 5 * 60 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const currentCandleTime = candles[candles.length - 1].time;
      const nextCandleTime = currentCandleTime + intervalMs;
      const diff = Math.max(0, nextCandleTime - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}j ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [candles, timeframe]);

  // Handle Zoom and Pan
  const handleZoomIn = () => setVisibleCount((prev) => Math.max(15, prev - 8));
  const handleZoomOut = () => setVisibleCount((prev) => Math.min(candles.length, prev + 12));
  const handleReset = () => {
    setVisibleCount(timeframe === '4h' ? 35 : 50);
    setScrollOffset(0);
  };

  const handleScroll = (delta: number) => {
    setScrollOffset((prev) => {
      const maxOffset = Math.max(0, candles.length - visibleCount);
      const next = prev + delta;
      return Math.max(0, Math.min(maxOffset, next));
    });
  };

  // Slice visible candles
  const visibleRange = useMemo(() => {
    const end = candles.length - scrollOffset;
    const start = Math.max(0, end - visibleCount);
    return { start, end };
  }, [candles.length, visibleCount, scrollOffset]);

  const visibleCandles = useMemo(() => {
    return candles.slice(visibleRange.start, visibleRange.end);
  }, [candles, visibleRange]);

  // Chart dimensions
  const width = 960;
  const height = 480;
  const paddingTop = 45;
  const paddingBottom = 45;
  const paddingLeft = 15;
  const paddingRight = 95;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Price Limits
  const priceLimits = useMemo(() => {
    if (visibleCandles.length === 0) return { min: 0, max: 100 };
    let min = Infinity;
    let max = -Infinity;

    visibleCandles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });

    if (activeSignal) {
      if (activeSignal.stopLoss < min) min = activeSignal.stopLoss;
      if (activeSignal.takeProfit2 > max) max = activeSignal.takeProfit2;
    }

    // Include Gun Numbers and ZFZ in price bounds
    if (scanData?.zeroFloatingZones) {
      scanData.zeroFloatingZones.forEach((z) => {
        if (z.priceZoneLow < min) min = z.priceZoneLow;
        if (z.priceZoneHigh > max) max = z.priceZoneHigh;
      });
    }

    const margin = (max - min) * 0.12 || 10;
    return {
      min: min - margin,
      max: max + margin,
    };
  }, [visibleCandles, activeSignal, scanData]);

  const priceToY = (price: number) => {
    if (priceLimits.max === priceLimits.min) return height / 2;
    return paddingTop + (1 - (price - priceLimits.min) / (priceLimits.max - priceLimits.min)) * chartHeight;
  };

  const candleIndexToX = (indexInVisible: number) => {
    const step = chartWidth / (visibleCandles.length || 1);
    return paddingLeft + indexInVisible * step + step / 2;
  };

  const yToPrice = (y: number) => {
    const normalized = 1 - (y - paddingTop) / chartHeight;
    return priceLimits.min + normalized * (priceLimits.max - priceLimits.min);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xRatio = width / rect.width;
    const yRatio = height / rect.height;

    const svgX = (e.clientX - rect.left) * xRatio;
    const svgY = (e.clientY - rect.top) * yRatio;

    setCrosshair({ x: svgX, y: svgY });

    const step = chartWidth / (visibleCandles.length || 1);
    const relativeX = svgX - paddingLeft;
    const idx = Math.floor(relativeX / step);

    if (idx >= 0 && idx < visibleCandles.length) {
      setHoveredCandleIdx(visibleRange.start + idx);
    } else {
      setHoveredCandleIdx(null);
    }
  };

  const handleMouseLeave = () => {
    setCrosshair(null);
    setHoveredCandleIdx(null);
  };

  const hoveredCandle = hoveredCandleIdx !== null && candles[hoveredCandleIdx] ? candles[hoveredCandleIdx] : null;
  const lastCandle = candles[candles.length - 1];

  return (
    <div className="w-full flex flex-col bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-sans">
      {/* 1. TOP HEADER & METRICS BAR */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-white tracking-wide">{symbol}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
              timeframe === '4h'
                ? 'bg-amber-600 text-white shadow-sm'
                : timeframe === '15m'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-emerald-600 text-white shadow-sm'
            }`}>
              TF: {timeframe.toUpperCase()} (Sifir Time Frame)
            </span>

            {/* Zona 1 Lot [FM] Indicator Badge */}
            {scanData?.zona1Lot.isEligible && (
              <span className="px-2 py-0.5 rounded bg-gradient-to-r from-amber-500 to-red-500 text-slate-950 font-black text-[10px] animate-pulse flex items-center gap-1 shadow-md">
                <Award className="w-3 h-3" />
                <span>ZONA 1 LOT [FM]</span>
              </span>
            )}
          </div>

          {hoveredCandle ? (
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
              <span>O: <strong className="text-slate-200">${formatPrice(hoveredCandle.open)}</strong></span>
              <span>H: <strong className="text-slate-200">${formatPrice(hoveredCandle.high)}</strong></span>
              <span>L: <strong className="text-slate-200">${formatPrice(hoveredCandle.low)}</strong></span>
              <span>C: <strong className={hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-400' : 'text-rose-400'}>${formatPrice(hoveredCandle.close)}</strong></span>
            </div>
          ) : lastCandle ? (
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-slate-400">Harga Terakhir:</span>
              <span className="font-extrabold text-white text-xs">${formatPrice(lastCandle.close)}</span>
              {timeRemaining && (
                <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-amber-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Sisa: {timeRemaining}</span>
                </span>
              )}
            </div>
          ) : null}
        </div>

        {/* Zoom & Navigation Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomIn}
            title="Perbesar Chart"
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer border border-slate-700/60"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Perkecil Chart"
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer border border-slate-700/60"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReset}
            title="Reset Tampilan"
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer border border-slate-700/60"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. SVG CHART STAGE */}
      <div
        ref={containerRef}
        className="w-full relative select-none cursor-crosshair bg-slate-950"
        onWheel={(e) => {
          e.preventDefault();
          if (e.deltaY < 0) handleZoomIn();
          else handleZoomOut();
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="bullEngulfGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="bearEngulfGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="zfzGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
            const y = paddingTop + ratio * chartHeight;
            const price = yToPrice(y);
            return (
              <g key={`grid-${i}`}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={width - paddingRight + 8} y={y + 3.5} fill="#64748b" fontSize="10" fontFamily="monospace">
                  ${formatPrice(price)}
                </text>
              </g>
            );
          })}

          {/* 7. GUN NUMBER LINES (Psychological Levels) */}
          {scanData?.gunNumber?.allLevels.map((gVal, idx) => {
            const y = priceToY(gVal);
            if (y < paddingTop || y > height - paddingBottom) return null;
            return (
              <g key={`gun-${idx}`} opacity="0.7">
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
                <rect x={paddingLeft + 6} y={y - 8} width="120" height="15" rx="2" fill="#0c4a6e" />
                <text x={paddingLeft + 10} y={y + 3} fill="#7dd3fc" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  🎯 GUN NUMBER: ${formatPrice(gVal)}
                </text>
              </g>
            );
          })}

          {/* 2. VALID BREAKOUT & ENGULFING ZONES */}
          {scanData?.activeEngulfingZones?.map((eng) => {
            const topY = priceToY(eng.top);
            const botY = priceToY(eng.bottom);
            const zH = Math.max(botY - topY, 4);
            const isBull = eng.type === 'BULLISH_ENGULFING';

            return (
              <g key={eng.id}>
                <rect
                  x={paddingLeft}
                  y={topY}
                  width={chartWidth}
                  height={zH}
                  fill={isBull ? 'url(#bullEngulfGradient)' : 'url(#bearEngulfGradient)'}
                  stroke={isBull ? '#10b981' : '#f43f5e'}
                  strokeWidth="1.2"
                  strokeDasharray="5 3"
                />
                <rect x={paddingLeft + 6} y={topY + 3} width="160" height="16" rx="2" fill={isBull ? '#064e3b' : '#881337'} />
                <text x={paddingLeft + 10} y={topY + 14} fill="#ffffff" fontSize="9" fontWeight="black" fontFamily="sans-serif">
                  {isBull ? '⚡ FRESH BULLISH ENGULFING' : '⚡ FRESH BEARISH ENGULFING'}
                </text>
              </g>
            );
          })}

          {/* 3. ZERO FLOATING ZONA (ZFZ) HIGHLIGHT */}
          {scanData?.zeroFloatingZones?.map((zfz) => {
            const topY = priceToY(zfz.priceZoneHigh);
            const botY = priceToY(zfz.priceZoneLow);
            const zH = Math.max(botY - topY, 6);

            return (
              <g key={zfz.id}>
                <rect
                  x={paddingLeft}
                  y={topY}
                  width={chartWidth}
                  height={zH}
                  fill="url(#zfzGradient)"
                  stroke="#f59e0b"
                  strokeWidth="1.8"
                />
                {/* Precision Wick Sniper Line */}
                <line
                  x1={paddingLeft}
                  y1={priceToY(zfz.wickSniperLevel)}
                  x2={width - paddingRight}
                  y2={priceToY(zfz.wickSniperLevel)}
                  stroke="#fbbf24"
                  strokeWidth="2"
                  strokeDasharray="2 2"
                />
                <rect x={width - paddingRight - 180} y={topY + 3} width="175" height="18" rx="3" fill="#78350f" stroke="#fbbf24" strokeWidth="1" />
                <text x={width - paddingRight - 172} y={topY + 15} fill="#fef3c7" fontSize="9" fontWeight="black">
                  🎯 ZERO FLOATING ZONA (ZFZ)
                </text>
              </g>
            );
          })}

          {/* 4. CANDLESTICK RENDERING & KODE 6C.9C LABELS */}
          {visibleCandles.map((c, i) => {
            const x = candleIndexToX(i);
            const openY = priceToY(c.open);
            const closeY = priceToY(c.close);
            const highY = priceToY(c.high);
            const lowY = priceToY(c.low);

            const isBullish = c.close >= c.open;
            const candleBodyTop = Math.min(openY, closeY);
            const candleBodyH = Math.max(Math.abs(closeY - openY), 1.5);
            const step = chartWidth / (visibleCandles.length || 1);
            const candleW = Math.max(step * 0.72, 3);

            // Sifir 6C & 9C Cycle Marker on recent candles
            const isLastFew = i >= visibleCandles.length - 9;
            const cycleNumber = isLastFew ? 9 - (visibleCandles.length - 1 - i) : 0;
            const is6C = cycleNumber === 6;
            const is9C = cycleNumber === 9;

            return (
              <g key={`candle-${c.time}-${i}`}>
                {/* Wicks */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={isBullish ? '#34d399' : '#fb7185'}
                  strokeWidth="1.2"
                />
                {/* Body */}
                <rect
                  x={x - candleW / 2}
                  y={candleBodyTop}
                  width={candleW}
                  height={candleBodyH}
                  fill={isBullish ? '#10b981' : '#f43f5e'}
                  stroke={isBullish ? '#059669' : '#e11d48'}
                  strokeWidth="1"
                  rx="1"
                />

                {/* Kode 6C & 9C Cycle Badges */}
                {is6C && (
                  <g>
                    <circle cx={x} cy={highY - 14} r="8" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" />
                    <text x={x} y={highY - 11} fill="#ffffff" fontSize="8.5" fontWeight="black" textAnchor="middle">
                      6C
                    </text>
                  </g>
                )}
                {is9C && (
                  <g>
                    <circle cx={x} cy={highY - 16} r="9" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                    <text x={x} y={highY - 13} fill="#000000" fontSize="9" fontWeight="black" textAnchor="middle">
                      9C
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 5. ACTIVE SIGNAL TARGETS (TP1, TP2, SL) - KONSISTEN & TERKUNCI */}
          {activeSignal && (() => {
            const entryY = priceToY(activeSignal.entryPrice);
            const slY = priceToY(activeSignal.stopLoss);
            const tp1Y = priceToY(activeSignal.takeProfit1);
            const tp2Y = priceToY(activeSignal.takeProfit2);
            const isBuy = activeSignal.type === 'BUY';

            // Risk zone height
            const riskTop = Math.min(entryY, slY);
            const riskHeight = Math.max(Math.abs(entryY - slY), 2);

            // Reward zone height
            const rewardTop = Math.min(entryY, tp2Y);
            const rewardHeight = Math.max(Math.abs(entryY - tp2Y), 2);

            return (
              <g id="active-signal-group">
                {/* Visual Risk & Reward Shaded Zone */}
                <rect
                  x={paddingLeft}
                  y={riskTop}
                  width={width - paddingLeft - paddingRight}
                  height={riskHeight}
                  fill="#f43f5e"
                  fillOpacity="0.05"
                  pointerEvents="none"
                />
                <rect
                  x={paddingLeft}
                  y={rewardTop}
                  width={width - paddingLeft - paddingRight}
                  height={rewardHeight}
                  fill="#10b981"
                  fillOpacity="0.05"
                  pointerEvents="none"
                />

                {/* Entry Line (Terkunci) */}
                <line x1={paddingLeft} y1={entryY} x2={width - paddingRight} y2={entryY} stroke="#38bdf8" strokeWidth="2" strokeDasharray="5 3" />
                <rect x={width - paddingRight + 2} y={entryY - 9} width="102" height="18" rx="3" fill="#0369a1" stroke="#0284c7" strokeWidth="1" />
                <text x={width - paddingRight + 5} y={entryY + 4} fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  ENTRY: ${formatPrice(activeSignal.entryPrice)} 🔒
                </text>

                {/* TP 1 Line (Konsisten 1:2) */}
                <line x1={paddingLeft} y1={tp1Y} x2={width - paddingRight} y2={tp1Y} stroke="#10b981" strokeWidth="1.8" />
                <rect x={width - paddingRight + 2} y={tp1Y - 9} width="102" height="18" rx="3" fill="#065f46" stroke="#059669" strokeWidth="1" />
                <text x={width - paddingRight + 5} y={tp1Y + 4} fill="#a7f3d0" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  TP 1: ${formatPrice(activeSignal.takeProfit1)} 🔒
                </text>

                {/* TP 2 (Storyline Target Konsisten) */}
                <line x1={paddingLeft} y1={tp2Y} x2={width - paddingRight} y2={tp2Y} stroke="#059669" strokeWidth="2.5" />
                <rect x={width - paddingRight + 2} y={tp2Y - 9} width="102" height="18" rx="3" fill="#047857" stroke="#10b981" strokeWidth="1" />
                <text x={width - paddingRight + 5} y={tp2Y + 4} fill="#ffffff" fontSize="9" fontWeight="black" fontFamily="monospace">
                  TP 2: ${formatPrice(activeSignal.takeProfit2)} 🔒
                </text>

                {/* Stop Loss Line (Terkunci Struktur) */}
                <line x1={paddingLeft} y1={slY} x2={width - paddingRight} y2={slY} stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" />
                <rect x={width - paddingRight + 2} y={slY - 9} width="102" height="18" rx="3" fill="#881337" stroke="#e11d48" strokeWidth="1" />
                <text x={width - paddingRight + 5} y={slY + 4} fill="#fecdd3" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  SL: ${formatPrice(activeSignal.stopLoss)} 🔒
                </text>
              </g>
            );
          })()}

          {/* Crosshair on Mouse Hover */}
          {crosshair && (
            <g id="crosshair-group" pointerEvents="none">
              <line x1={paddingLeft} y1={crosshair.y} x2={width - paddingRight} y2={crosshair.y} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
              <line x1={crosshair.x} y1={paddingTop} x2={crosshair.x} y2={height - paddingBottom} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
              <rect x={width - paddingRight + 2} y={crosshair.y - 9} width="85" height="18" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />
              <text x={width - paddingRight + 6} y={crosshair.y + 4} fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="monospace">
                ${formatPrice(yToPrice(crosshair.y))}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* 3. BOTTOM LEGEND: 7 PILAR STRATEGI STF */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
            <span>Zero Floating Zona (ZFZ)</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
            <span>Bullish Engulfing (VBO)</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-rose-500"></span>
            <span>Bearish Engulfing (VBO)</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Kode 6C (Retest)</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Kode 9C (Reversal)</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-0.5 border-t border-dashed border-sky-400"></span>
            <span>Gun Number (.000, .500)</span>
          </span>
        </div>

        <div className="font-mono text-[10px] text-slate-500">
          STF System 7 Pillars v2.0
        </div>
      </div>
    </div>
  );
}
