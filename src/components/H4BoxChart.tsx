/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Candle, H4Box, TradingSignal, FiveMinCandleAnalysis } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Crosshair, Sparkles, Sliders } from 'lucide-react';
import { formatPrice } from '../utils/h4BoxScanner';

interface H4BoxChartProps {
  candles: Candle[];
  h4Box: H4Box | null;
  activeSignal: TradingSignal | null;
  latest5mAnalysis?: FiveMinCandleAnalysis | null;
  timeframe: string;
  symbol: string;
  focusBox?: 'all' | 'box2' | 'box3' | 2 | 3;
}

export default function H4BoxChart({
  candles,
  h4Box,
  activeSignal,
  timeframe,
  symbol,
  focusBox = 2,
}: H4BoxChartProps) {
  const [visibleCount, setVisibleCount] = useState<number>(timeframe === '4h' ? 35 : 55);
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const [hoveredCandleIdx, setHoveredCandleIdx] = useState<number | null>(null);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Countdown timer for active candle
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Target box based on focusBox prop
  const currentTargetBox = useMemo(() => {
    if (!h4Box) return null;
    if (focusBox === 3 || focusBox === 'box3') return h4Box.box3;
    return h4Box.box2;
  }, [h4Box, focusBox]);

  const isBox3Focused = focusBox === 3 || focusBox === 'box3';

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

    const updateCountdown = () => {
      const lastCandle = candles[candles.length - 1];
      if (!lastCandle) return;

      const now = Date.now();
      const endTime = lastCandle.time + intervalMs;
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeRemaining('00:00');
        return;
      }

      const totalSecs = Math.floor(diff / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;

      const minsStr = mins.toString().padStart(2, '0');
      const secsStr = secs.toString().padStart(2, '0');

      if (hours > 0) {
        setTimeRemaining(`${hours}:${minsStr}:${secsStr}`);
      } else {
        setTimeRemaining(`${minsStr}:${secsStr}`);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [candles, timeframe]);

  // Chart Dimensions
  const width = 1200;
  const height = 520;
  const paddingLeft = 15;
  const paddingRight = 85;
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  useEffect(() => {
    setScrollOffset(0);
  }, [candles]);

  const visibleRange = useMemo(() => {
    if (candles.length === 0) return { start: 0, end: 0, count: 0 };
    const count = Math.min(visibleCount, candles.length);
    const maxOffset = candles.length - count;
    const offset = Math.min(Math.max(0, scrollOffset), maxOffset);
    const start = candles.length - count - offset;
    const end = candles.length - offset;
    return { start, end, count };
  }, [candles, visibleCount, scrollOffset]);

  const visibleCandles = useMemo(() => {
    if (candles.length === 0) return [];
    return candles.slice(visibleRange.start, visibleRange.end);
  }, [candles, visibleRange]);

  const priceLimits = useMemo(() => {
    if (visibleCandles.length === 0) return { min: 0, max: 100 };
    let min = Infinity;
    let max = -Infinity;

    visibleCandles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });

    if (h4Box) {
      if (timeframe === '4h' || focusBox === 'all') {
        if (h4Box.box2.bottom < min) min = h4Box.box2.bottom;
        if (h4Box.box2.top > max) max = h4Box.box2.top;
        if (h4Box.box3.bottom < min) min = h4Box.box3.bottom;
        if (h4Box.box3.top > max) max = h4Box.box3.top;
      } else if (isBox3Focused) {
        if (h4Box.box3.bottom < min) min = h4Box.box3.bottom;
        if (h4Box.box3.top > max) max = h4Box.box3.top;
      } else {
        if (h4Box.box2.bottom < min) min = h4Box.box2.bottom;
        if (h4Box.box2.top > max) max = h4Box.box2.top;
      }
    }

    if (activeSignal) {
      if (activeSignal.stopLoss < min) min = activeSignal.stopLoss;
      if (activeSignal.takeProfit3 > max) max = activeSignal.takeProfit3;
    }

    const margin = (max - min) * 0.1 || 10;
    return {
      min: min - margin,
      max: max + margin,
    };
  }, [visibleCandles, h4Box, activeSignal, timeframe, focusBox, isBox3Focused]);

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

  // Calculate body ratio for hovered candle
  const hoveredBodyRatio = useMemo(() => {
    if (!hoveredCandle) return 0;
    const range = hoveredCandle.high - hoveredCandle.low;
    const body = Math.abs(hoveredCandle.close - hoveredCandle.open);
    return range > 0 ? Math.round((body / range) * 100) : 0;
  }, [hoveredCandle]);

  return (
    <div className="w-full flex flex-col bg-slate-950 rounded-xl border border-slate-800 shadow-xl overflow-hidden font-sans">
      {/* 1. TOP STATS BAR */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-100 font-sans tracking-wide">{symbol}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
              timeframe === '4h'
                ? 'bg-indigo-600 text-white'
                : timeframe === '15m'
                  ? isBox3Focused
                    ? 'bg-fuchsia-600 text-white shadow-sm'
                    : 'bg-cyan-600 text-white shadow-sm'
                  : isBox3Focused
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-emerald-600 text-white shadow-sm'
            }`}>
              {timeframe === '4h'
                ? 'TF: 4H (Box Lilin #2 & #3)'
                : timeframe === '15m'
                  ? isBox3Focused
                    ? 'TF: 15M (Target Box #3)'
                    : 'TF: 15M (Target Box #2)'
                  : isBox3Focused
                    ? 'TF: 5M (Target Box #3)'
                    : 'TF: 5M (Target Box #2)'}
            </span>
          </div>

          {hoveredCandle ? (
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
              <span>O: <strong className="text-slate-200">${formatPrice(hoveredCandle.open)}</strong></span>
              <span>H: <strong className="text-slate-200">${formatPrice(hoveredCandle.high)}</strong></span>
              <span>L: <strong className="text-slate-200">${formatPrice(hoveredCandle.low)}</strong></span>
              <span>C: <strong className={hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-400' : 'text-rose-400'}>${formatPrice(hoveredCandle.close)}</strong></span>
              <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[10px]">
                Body: <strong className={hoveredBodyRatio >= 50 ? 'text-emerald-400' : 'text-amber-400'}>{hoveredBodyRatio}% {hoveredBodyRatio >= 50 ? '(Kuat)' : '(Wick Dominan)'}</strong>
              </span>
            </div>
          ) : lastCandle ? (
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-slate-400">Harga Terkini:</span>
              <span className={`text-sm font-black ${lastCandle.close >= lastCandle.open ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${formatPrice(lastCandle.close)}
              </span>
              {timeRemaining && (
                <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                  Closing: <strong className={isBox3Focused ? 'text-purple-400' : 'text-indigo-400'}>{timeRemaining}</strong>
                </span>
              )}
            </div>
          ) : null}
        </div>

        {/* Zoom & Pan Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setVisibleCount((prev) => Math.max(15, prev - 10))}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            title="Perbesar Lilin (Zoom In)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setVisibleCount((prev) => Math.min(120, prev + 10))}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            title="Perkecil Lilin (Zoom Out)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScrollOffset((prev) => Math.min(candles.length - visibleRange.count, prev + 10))}
            disabled={scrollOffset >= candles.length - visibleRange.count}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 transition cursor-pointer"
            title="Geser ke Kiri (History)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScrollOffset((prev) => Math.max(0, prev - 10))}
            disabled={scrollOffset <= 0}
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 transition cursor-pointer"
            title="Geser ke Kanan (Live)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setVisibleCount(timeframe === '4h' ? 35 : 55);
              setScrollOffset(0);
            }}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
            title="Reset Tampilan"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. SVG CANDLESTICK & H4 BOX CANVAS */}
      <div ref={containerRef} className="relative w-full h-[460px] bg-slate-950 select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="h4BoxGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="h4Box3Gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="buySignalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="sellSignalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.2" />
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

          {/* 3. DRAW H4 BOXES (BOX LILIN #2 & BOX LILIN #3) */}
          {h4Box && (() => {
            const renderBox = (
              box: { top: number; bottom: number; candleIndex: number; candleNumber: number },
              isBox3: boolean,
              offsetX = 0
            ) => {
              const boxTopY = priceToY(box.top);
              const boxBottomY = priceToY(box.bottom);
              const boxH = Math.max(boxBottomY - boxTopY, 4);

              const midPrice = (box.top + box.bottom) / 2;
              const boxMidY = priceToY(midPrice);

              let startX = paddingLeft;
              let endX = width - paddingRight;

              if (timeframe === '4h') {
                const cIdxInVis = box.candleIndex - visibleRange.start;
                if (cIdxInVis >= 0) {
                  startX = candleIndexToX(cIdxInVis) - chartWidth / (visibleCandles.length * 2);
                }
              }

              const strokeColor = isBox3 ? '#c084fc' : '#818cf8';
              const midColor = isBox3 ? '#d8b4fe' : '#a5b4fc';
              const gradientId = isBox3 ? 'url(#h4Box3Gradient)' : 'url(#h4BoxGradient)';
              const badgeBg = isBox3 ? '#3b0764' : '#1e1b4b';
              const badgeBorder = isBox3 ? '#a855f7' : '#6366f1';
              const badgeText = isBox3 ? '📦 BOX H4 (LILIN #3)' : '📦 BOX H4 (LILIN #2)';
              const yBadge = Math.min(boxTopY + 4 + offsetX, height - paddingBottom - 24);

              return (
                <g key={`box-h4-${box.candleNumber}`} id={`h4-candle${box.candleNumber}-box-group`}>
                  {/* Box Area */}
                  <rect
                    x={startX}
                    y={boxTopY}
                    width={endX - startX}
                    height={boxH}
                    fill={gradientId}
                    stroke={strokeColor}
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    rx="3"
                  />
                  {/* Top & Bottom Boundary Lines */}
                  <line x1={startX} y1={boxTopY} x2={endX} y2={boxTopY} stroke={strokeColor} strokeWidth="1.5" />
                  <line x1={startX} y1={boxBottomY} x2={endX} y2={boxBottomY} stroke={strokeColor} strokeWidth="1.5" />

                  {/* Garis Tengah (50% Midline / Garis Hitam - Target TP 1) */}
                  {/* Outer glow/contrast background for dark theme */}
                  <line
                    x1={startX}
                    y1={boxMidY}
                    x2={endX}
                    y2={boxMidY}
                    stroke="#334155"
                    strokeWidth="3.5"
                    opacity="0.9"
                  />
                  {/* Black Midline as requested by user */}
                  <line
                    x1={startX}
                    y1={boxMidY}
                    x2={endX}
                    y2={boxMidY}
                    stroke="#000000"
                    strokeWidth="2.2"
                    strokeDasharray="6 3"
                  />

                  {/* Badge Label Box */}
                  <rect
                    x={startX + 8 + (isBox3 && timeframe === '4h' ? 170 : 0)}
                    y={yBadge}
                    width="160"
                    height="20"
                    rx="3"
                    fill={badgeBg}
                    stroke={badgeBorder}
                    strokeWidth="1"
                  />
                  <text
                    x={startX + 14 + (isBox3 && timeframe === '4h' ? 170 : 0)}
                    y={yBadge + 14}
                    fill="#f3e8ff"
                    fontSize="10.5"
                    fontWeight="black"
                    fontFamily="sans-serif"
                  >
                    {badgeText}
                  </text>

                  {/* Midline Tag Label (Garis Tengah Hitam / TP 1) */}
                  <rect
                    x={startX + (isBox3 && timeframe === '4h' ? 178 : 8)}
                    y={Math.min(Math.max(boxMidY - 10, boxTopY + 24), boxBottomY - 24)}
                    width="165"
                    height="18"
                    rx="3"
                    fill="#000000"
                    stroke="#64748b"
                    strokeWidth="1"
                  />
                  <text
                    x={startX + (isBox3 && timeframe === '4h' ? 184 : 14)}
                    y={Math.min(Math.max(boxMidY + 3, boxTopY + 37), boxBottomY - 11)}
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="black"
                    fontFamily="sans-serif"
                  >
                    ◾ GARIS TENGAH (TP 1): ${formatPrice(midPrice)}
                  </text>

                  {/* Price Tags on Y-Axis */}
                  <rect x={width - paddingRight + 2} y={boxTopY - 8} width="82" height="16" rx="2" fill={badgeBg} stroke={badgeBorder} />
                  <text x={width - paddingRight + 6} y={boxTopY + 4} fill="#f3e8ff" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                    ${formatPrice(box.top)}
                  </text>

                  {/* Midline Price Tag on Y-Axis (Black badge) */}
                  <rect x={width - paddingRight + 2} y={boxMidY - 8} width="82" height="16" rx="2" fill="#000000" stroke="#94a3b8" strokeWidth="1" />
                  <text x={width - paddingRight + 6} y={boxMidY + 4} fill="#f8fafc" fontSize="9" fontWeight="black" fontFamily="monospace">
                    MID: ${formatPrice(midPrice)}
                  </text>

                  <rect x={width - paddingRight + 2} y={boxBottomY - 8} width="82" height="16" rx="2" fill={badgeBg} stroke={badgeBorder} />
                  <text x={width - paddingRight + 6} y={boxBottomY + 4} fill="#f3e8ff" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                    ${formatPrice(box.bottom)}
                  </text>
                </g>
              );
            };

            if (timeframe === '4h' || focusBox === 'all') {
              return (
                <g id="h4-all-boxes-group">
                  {renderBox(h4Box.box3, true, 22)}
                  {renderBox(h4Box.box2, false, 0)}
                </g>
              );
            }

            if (isBox3Focused) {
              return renderBox(h4Box.box3, true, 0);
            }

            return renderBox(h4Box.box2, false, 0);
          })()}

          {/* 4. DRAW ACTIVE SIGNAL LEVELS (ENTRY, SL, TP) */}
          {activeSignal && (
            <g id="signal-execution-overlay">
              {/* Entry Line */}
              <line
                x1={paddingLeft}
                y1={priceToY(activeSignal.entryPrice)}
                x2={width - paddingRight}
                y2={priceToY(activeSignal.entryPrice)}
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="5 3"
              />
              <rect x={paddingLeft + 10} y={priceToY(activeSignal.entryPrice) - 10} width={activeSignal.isFlipped ? 270 : 160} height="20" rx="3" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" />
              <text x={paddingLeft + 16} y={priceToY(activeSignal.entryPrice) + 4} fill="#ffffff" fontSize="10" fontWeight="bold">
                {activeSignal.isFlipped 
                  ? `⚡ ENTRY (${activeSignal.type} FLIP dari ${activeSignal.flippedFrom}): $${formatPrice(activeSignal.entryPrice)}`
                  : `🎯 ENTRY (${activeSignal.type}): $${formatPrice(activeSignal.entryPrice)}`}
              </text>

              {/* Stop Loss Line */}
              <line
                x1={paddingLeft}
                y1={priceToY(activeSignal.stopLoss)}
                x2={width - paddingRight}
                y2={priceToY(activeSignal.stopLoss)}
                stroke="#f43f5e"
                strokeWidth="2"
              />
              <rect x={paddingLeft + 10} y={priceToY(activeSignal.stopLoss) - 10} width="150" height="20" rx="3" fill="#be123c" stroke="#f43f5e" strokeWidth="1" />
              <text x={paddingLeft + 16} y={priceToY(activeSignal.stopLoss) + 4} fill="#ffffff" fontSize="10" fontWeight="bold">
                🛡️ STOP LOSS: ${formatPrice(activeSignal.stopLoss)}
              </text>

              {/* Take Profit 1 (Garis Tengah Box H4 - Midline 50% Hitam) */}
              <line
                x1={paddingLeft}
                y1={priceToY(activeSignal.takeProfit1)}
                x2={width - paddingRight}
                y2={priceToY(activeSignal.takeProfit1)}
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              <rect x={paddingLeft + 10} y={priceToY(activeSignal.takeProfit1) - 10} width="220" height="20" rx="3" fill="#047857" stroke="#10b981" strokeWidth="1" />
              <text x={paddingLeft + 16} y={priceToY(activeSignal.takeProfit1) + 4} fill="#ffffff" fontSize="9.5" fontWeight="black">
                💰 TP 1 (Garis Tengah Box): ${formatPrice(activeSignal.takeProfit1)}
              </text>

              {/* Take Profit 2 (Batas Atas Box untuk BUY / Batas Bawah Box untuk SELL) */}
              <line
                x1={paddingLeft}
                y1={priceToY(activeSignal.takeProfit2)}
                x2={width - paddingRight}
                y2={priceToY(activeSignal.takeProfit2)}
                stroke="#059669"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              <rect x={paddingLeft + 10} y={priceToY(activeSignal.takeProfit2) - 10} width="220" height="20" rx="3" fill="#065f46" stroke="#34d399" strokeWidth="1" />
              <text x={paddingLeft + 16} y={priceToY(activeSignal.takeProfit2) + 4} fill="#ffffff" fontSize="9.5" fontWeight="black">
                🎯 TP 2 (Batas {activeSignal.type === 'BUY' ? 'Atas' : 'Bawah'} Box): ${formatPrice(activeSignal.takeProfit2)}
              </text>
            </g>
          )}

          {/* 5. DRAW CANDLESTICKS */}
          {visibleCandles.map((c, i) => {
            const globalIndex = visibleRange.start + i;
            const x = candleIndexToX(i);
            const openY = priceToY(c.open);
            const closeY = priceToY(c.close);
            const highY = priceToY(c.high);
            const lowY = priceToY(c.low);

            const isBullish = c.close >= c.open;
            const bodyY = isBullish ? closeY : openY;
            const bodyH = Math.max(Math.abs(closeY - openY), 1.5);
            const step = chartWidth / (visibleCandles.length || 1);
            const candleWidth = Math.max(step * 0.72, 3);

            // Highlight Candle #2 & Candle #3 on 4H chart
            const isC2 = timeframe === '4h' && h4Box && globalIndex === h4Box.candle2Index;
            const isC3 = timeframe === '4h' && h4Box && globalIndex === h4Box.candle3Index;

            // Highlight Strong 5M Trigger Candle on 5M chart
            const is5mTrigger = timeframe === '5m' && activeSignal && Math.abs(c.time - activeSignal.timestamp) < 5000;

            const isHovered = hoveredCandleIdx === globalIndex;

            return (
              <g key={`candle-${c.time}-${i}`}>
                {/* Red Bounding Box on 5M Candle entering H4 Box (as illustrated by user) */}
                {is5mTrigger && (
                  <g id="red-box-entry-marker">
                    {/* Red Outline Box around candle entering H4 Box */}
                    <rect
                      x={x - candleWidth - 8}
                      y={Math.min(highY, closeY, openY) - 14}
                      width={candleWidth * 2 + 16}
                      height={Math.max(lowY - highY + 28, 50)}
                      fill="rgba(239, 68, 68, 0.14)"
                      stroke="#ef4444"
                      strokeWidth="2.2"
                      rx="4"
                    />
                    {/* Red corner accents */}
                    <line x1={x - candleWidth - 8} y1={Math.min(highY, closeY, openY) - 14} x2={x - candleWidth} y2={Math.min(highY, closeY, openY) - 14} stroke="#ef4444" strokeWidth="3" />
                    <line x1={x - candleWidth - 8} y1={Math.min(highY, closeY, openY) - 14} x2={x - candleWidth - 8} y2={Math.min(highY, closeY, openY) - 6} stroke="#ef4444" strokeWidth="3" />
                    <line x1={x + candleWidth + 8} y1={Math.min(highY, closeY, openY) - 14} x2={x + candleWidth} y2={Math.min(highY, closeY, openY) - 14} stroke="#ef4444" strokeWidth="3" />
                    <line x1={x + candleWidth + 8} y1={Math.min(highY, closeY, openY) - 14} x2={x + candleWidth + 8} y2={Math.min(highY, closeY, openY) - 6} stroke="#ef4444" strokeWidth="3" />
                  </g>
                )}

                {/* Special Highlight Pillar for H4 Candle 2 or 3 */}
                {isC2 && (
                  <rect
                    x={x - candleWidth / 2 - 3}
                    y={paddingTop}
                    width={candleWidth + 6}
                    height={chartHeight}
                    fill="rgba(99, 102, 241, 0.18)"
                    rx="2"
                  />
                )}
                {isC3 && (
                  <rect
                    x={x - candleWidth / 2 - 3}
                    y={paddingTop}
                    width={candleWidth + 6}
                    height={chartHeight}
                    fill="rgba(168, 85, 247, 0.18)"
                    rx="2"
                  />
                )}

                {/* Wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={isBullish ? '#10b981' : '#f43f5e'}
                  strokeWidth={isHovered || is5mTrigger ? 2.5 : 1.2}
                />

                {/* Candle Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyY}
                  width={candleWidth}
                  height={bodyH}
                  fill={isBullish ? '#10b981' : '#f43f5e'}
                  stroke={isHovered ? '#ffffff' : (is5mTrigger ? '#fef08a' : 'none')}
                  strokeWidth={isHovered ? 1.5 : (is5mTrigger ? 2 : 0)}
                  rx="1"
                />

                {/* Marker for H4 Candle #2 */}
                {isC2 && (
                  <g>
                    <polygon
                      points={`${x},${highY - 8} ${x - 5},${highY - 16} ${x + 5},${highY - 16}`}
                      fill="#6366f1"
                    />
                    <rect x={x - 30} y={highY - 32} width="60" height="15" rx="2" fill="#312e81" stroke="#6366f1" strokeWidth="1" />
                    <text x={x} y={highY - 21} fill="#e0e7ff" fontSize="9" fontWeight="black" textAnchor="middle">
                      LILIN #2 H4
                    </text>
                  </g>
                )}

                {/* Marker for H4 Candle #3 */}
                {isC3 && (
                  <g>
                    <polygon
                      points={`${x},${highY - 8} ${x - 5},${highY - 16} ${x + 5},${highY - 16}`}
                      fill="#a855f7"
                    />
                    <rect x={x - 30} y={highY - 32} width="60" height="15" rx="2" fill="#3b0764" stroke="#a855f7" strokeWidth="1" />
                    <text x={x} y={highY - 21} fill="#f3e8ff" fontSize="9" fontWeight="black" textAnchor="middle">
                      LILIN #3 H4
                    </text>
                  </g>
                )}

                {/* Marker for 5M Trigger Candle entering Box with Red Box marker badge */}
                {is5mTrigger && (
                  <g>
                    <circle cx={x} cy={lowY + 16} r="6" fill="#ef4444" className="animate-ping" opacity="0.75" />
                    <rect 
                      x={x - (activeSignal?.isFlipped ? 80 : 65)} 
                      y={lowY + 10} 
                      width={activeSignal?.isFlipped ? 160 : 130} 
                      height="20" 
                      rx="3" 
                      fill={activeSignal?.isFlipped ? '#7f1d1d' : '#7f1d1d'} 
                      stroke={activeSignal?.isFlipped ? '#f97316' : '#ef4444'} 
                      strokeWidth="1.5" 
                    />
                    <text x={x} y={lowY + 24} fill="#fef2f2" fontSize="9" fontWeight="black" textAnchor="middle">
                      {activeSignal?.isFlipped 
                        ? `⚡ FLIP ${activeSignal.type} (CANCEL ${activeSignal.flippedFrom})` 
                        : '🔴 SINYAL MASUK BOX H4'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 6. CROSSHAIR & TOOLTIPS */}
          {crosshair && (
            <g id="crosshair-group">
              <line
                x1={paddingLeft}
                y1={crosshair.y}
                x2={width - paddingRight}
                y2={crosshair.y}
                stroke="#64748b"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <line
                x1={crosshair.x}
                y1={paddingTop}
                x2={crosshair.x}
                y2={height - paddingBottom}
                stroke="#64748b"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              {/* Y Axis Price Badge */}
              <rect
                x={width - paddingRight + 2}
                y={crosshair.y - 9}
                width="82"
                height="18"
                rx="2"
                fill="#0f172a"
                stroke="#64748b"
              />
              <text
                x={width - paddingRight + 6}
                y={crosshair.y + 4}
                fill="#ffffff"
                fontSize="9.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                ${formatPrice(yToPrice(crosshair.y))}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* 3. CHART FOOTER BAR */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex flex-wrap items-center gap-3">
          {h4Box ? (
            <span className="flex items-center gap-1.5 bg-indigo-950/70 border border-indigo-800/80 px-2.5 py-1 rounded text-[11px] text-indigo-300 font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span>Box H4 Lilin #2: <strong>${formatPrice(h4Box.bottom)} - ${formatPrice(h4Box.top)}</strong></span>
            </span>
          ) : (
            <span>Memuat Box H4...</span>
          )}
        </div>

        <div className="font-mono text-[11px] text-slate-300">
          {activeSignal ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ⚡ Sinyal Terkonfirmasi ({activeSignal.type} @ ${activeSignal.entryPrice.toFixed(1)}) - {activeSignal.targetBoxName}
            </span>
          ) : (
            <span>Memantau candle {timeframe.toUpperCase()} kuat (body ≥50%) di {isBox3Focused ? 'Box H4 Lilin #3' : 'Box H4 Lilin #2'}...</span>
          )}
        </div>
      </div>
    </div>
  );
}
