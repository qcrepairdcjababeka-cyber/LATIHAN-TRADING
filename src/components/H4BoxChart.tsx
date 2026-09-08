/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Candle, TradingSignal, ScanResult } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, Sparkles, Clock, MoveVertical, Target } from 'lucide-react';
import { formatPrice } from '../utils/stfStrategyScanner';

interface H4BoxChartProps {
  candles: Candle[];
  activeSignal: TradingSignal | null;
  timeframe: string;
  symbol: string;
  scanData?: ScanResult | null;
  defaultHeight?: number;
}

export default function H4BoxChart({
  candles,
  activeSignal,
  timeframe,
  symbol,
  scanData,
  defaultHeight = 820
}: H4BoxChartProps) {
  const [visibleCount, setVisibleCount] = useState<number>(timeframe === '4h' ? 35 : 50);
  const [scrollOffset, setScrollOffset] = useState<number>(0);
  const [hoveredCandleIdx, setHoveredCandleIdx] = useState<number | null>(null);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(null);
  const [minimalistLines, setMinimalistLines] = useState<boolean>(true);

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

  const activeKeyLevelZone = useMemo(() => {
    return activeSignal?.keyLevelZone || activeSignal?.ictCrt?.keyLevelZone || scanData?.ictCrtModel?.keyLevelZone || null;
  }, [activeSignal, scanData]);

  // Chart dimensions & height settings
  const [stageHeight, setStageHeight] = useState<number>(defaultHeight);
  const width = 960;
  const height = stageHeight;
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

    const crt = activeSignal?.ictCrt || activeSignal?.crt9Am || scanData?.ictCrtModel || scanData?.crt9AmModel;
    if (crt) {
      if (crt.benchmark) {
        if (crt.benchmark.rangeLow < min) min = crt.benchmark.rangeLow;
        if (crt.benchmark.rangeHigh > max) max = crt.benchmark.rangeHigh;
      }
      if (crt.sweepPrice && crt.sweepPrice < min) min = crt.sweepPrice;
      if (crt.sweepPrice && crt.sweepPrice > max) max = crt.sweepPrice;
      if (crt.stopLoss && crt.stopLoss < min) min = crt.stopLoss;
      if (crt.takeProfit2 && crt.takeProfit2 > max) max = crt.takeProfit2;
    }

    if (activeSignal) {
      if (activeSignal.stopLoss < min) min = activeSignal.stopLoss;
      if (activeSignal.takeProfit2 > max) max = activeSignal.takeProfit2;
    }

    const margin = (max - min) * 0.12 || 10;
    return {
      min: min - margin,
      max: max + margin,
    };
  }, [visibleCandles, activeSignal, scanData]);

  const priceToY = (price: number) => {
    if (typeof price !== 'number' || isNaN(price)) return height / 2;
    if (priceLimits.max === priceLimits.min) return height / 2;
    const computed = paddingTop + (1 - (price - priceLimits.min) / (priceLimits.max - priceLimits.min)) * chartHeight;
    return isNaN(computed) ? height / 2 : computed;
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
              TF: {timeframe.toUpperCase()}
            </span>

            {/* ICT + CRT Model Indicator Badge */}
            <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 font-black text-[10px] flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>MODEL ICT + CRT</span>
            </span>

            {/* Area Key Level Precision Badge */}
            {activeKeyLevelZone && (
              <span className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/50 text-sky-200 font-bold text-[10px] flex items-center gap-1.5 shadow-sm">
                <Target className="w-3 h-3 text-sky-400" />
                <span>Area Key Level:</span>
                <span className="font-mono text-sky-100 font-extrabold">${formatPrice(activeKeyLevelZone.low)} - ${formatPrice(activeKeyLevelZone.high)}</span>
                <span className="text-amber-300 font-mono font-extrabold">(Sweet Spot: ${formatPrice(activeKeyLevelZone.sweetSpot)})</span>
                <span className={`px-1 py-0.2 rounded text-[9px] font-black uppercase ${
                  activeKeyLevelZone.status === 'SWEET_SPOT_HIT' ? 'bg-amber-500 text-slate-950 animate-pulse' :
                  activeKeyLevelZone.status === 'IN_ZONE' ? 'bg-emerald-500 text-slate-950' :
                  activeKeyLevelZone.status === 'REJECTED_RUNNING' ? 'bg-indigo-600 text-white' :
                  'bg-slate-700 text-slate-200'
                }`}>
                  {activeKeyLevelZone.status.replace(/_/g, ' ')}
                </span>
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

        {/* Height & Zoom Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Height Adjuster (Chart Kurang Tinggi fix) */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[10px]">
            <span className="text-slate-400 px-1.5 font-bold flex items-center gap-1">
              <MoveVertical className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Tinggi:</span>
            </span>
            <button
              type="button"
              onClick={() => setStageHeight(680)}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                stageHeight === 680
                  ? 'bg-slate-800 text-white font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tinggi 680px"
            >
              680px
            </button>
            <button
              type="button"
              onClick={() => setStageHeight(820)}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                stageHeight === 820
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tinggi 820px (Optimal & Luas)"
            >
              820px (Standar)
            </button>
            <button
              type="button"
              onClick={() => setStageHeight(960)}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                stageHeight === 960
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tinggi 960px (Maksimal)"
            >
              960px
            </button>
          </div>

          {/* Overlay Model ICT + CRT Toggle */}
          <button
            type="button"
            onClick={() => setMinimalistLines(!minimalistLines)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
              minimalistLines
                ? 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Tampilan Overlay ICT + CRT (Fokus / Lengkap)"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${minimalistLines ? 'bg-indigo-400 animate-pulse' : 'bg-slate-500'}`}></span>
            <span>{minimalistLines ? 'Overlay: Rapi & Ringkas' : 'Overlay: Lengkap'}</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomIn}
              title="Perbesar Lilin"
              className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer border border-slate-700/60"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Perkecil Lilin"
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
          {/* Grid lines */}
          {[0.14, 0.28, 0.42, 0.56, 0.70, 0.84].map((ratio, i) => {
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

          {/* ICT + CRT HYBRID INSTITUTIONAL MODEL (CANDLE RANGE THEORY x INNER CIRCLE TRADER) VISUAL OVERLAYS */}
          {(() => {
            const crt = activeSignal?.ictCrt || activeSignal?.crt9Am || scanData?.ictCrtModel || scanData?.crt9AmModel;
            if (!crt || !crt.benchmark) return null;

            const isBuy = crt.liquiditySweep?.type === 'SSL_SWEEP_BULLISH' || crt.sweepType === 'BULLISH_ICT_CRT' || crt.sweepType === 'BULLISH_CRT_9AM';
            const rhY = priceToY(crt.benchmark.rangeHigh);
            const rlY = priceToY(crt.benchmark.rangeLow);
            const eqY = priceToY(crt.benchmark.equilibrium);
            const sweepY = priceToY(crt.sweepPrice);
            const mssY = priceToY(crt.mssLevel);

            // Compute relative candle coordinates anchored to current running candle
            const benchRelIdx = crt.benchmark.candleIndex - visibleRange.start;
            const benchX = (benchRelIdx >= 0 && benchRelIdx < visibleCandles.length)
              ? candleIndexToX(benchRelIdx)
              : width - paddingRight - 15;

            const sweepRelIdx = crt.sweepCandleIndex - visibleRange.start;
            const sweepX = (sweepRelIdx >= 0 && sweepRelIdx < visibleCandles.length)
              ? candleIndexToX(sweepRelIdx)
              : Math.max(paddingLeft + 50, benchX - 45);

            const mssRelIdx = (crt.mssCandleIndex || (crt.sweepCandleIndex + 2)) - visibleRange.start;
            const mssX = (mssRelIdx >= 0 && mssRelIdx < visibleCandles.length)
              ? candleIndexToX(mssRelIdx)
              : Math.max(paddingLeft + 75, benchX - 20);

            // Range box and line coordinates (framed around current running candle)
            const benchBoxStartX = Math.max(paddingLeft, Math.min(sweepX - 20, benchX - (minimalistLines ? 80 : 130)));
            const benchBoxEndX = width - paddingRight;
            const benchBoxWidth = Math.max(50, benchBoxEndX - benchBoxStartX);
            const rangeHeight = Math.max(Math.abs(rlY - rhY), 12);
            const rangeTopY = Math.min(rhY, rlY);

            const crtSpan = minimalistLines ? 25 : 45;
            const sweepStartX = Math.max(paddingLeft, sweepX - crtSpan);
            const sweepEndX = Math.min(width - paddingRight - 10, sweepX + crtSpan);

            // FVG coordinates
            const fvgTop = crt.fairValueGap?.top || (isBuy ? crt.benchmark.rangeLow * 1.0015 : crt.benchmark.rangeHigh * 1.0015);
            const fvgBottom = crt.fairValueGap?.bottom || (isBuy ? crt.benchmark.rangeLow * 0.9985 : crt.benchmark.rangeHigh * 0.9985);
            const fvgTopY = priceToY(fvgTop);
            const fvgBottomY = priceToY(fvgBottom);
            const fvgHeight = Math.max(Math.abs(fvgBottomY - fvgTopY), 6);
            const fvgY = Math.min(fvgTopY, fvgBottomY);
            const fvgStartX = Math.max(paddingLeft, mssX);
            const fvgEndX = Math.min(width - paddingRight - 10, mssX + (minimalistLines ? 55 : 95));
            const fvgWidth = Math.max(30, fvgEndX - fvgStartX);

            return (
              <g id="ict-crt-model-group">
                {/* 1. CRT BENCHMARK MOTHER CANDLE RANGE - Localized Box */}
                <rect
                  x={benchBoxStartX}
                  y={rangeTopY}
                  width={benchBoxWidth}
                  height={rangeHeight}
                  fill="#6366f1"
                  fillOpacity="0.08"
                  stroke="#6366f1"
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                  rx="3"
                />

                {/* Range High (RH BSL) Line */}
                <line
                  x1={benchBoxStartX}
                  y1={rhY}
                  x2={benchBoxEndX}
                  y2={rhY}
                  stroke="#818cf8"
                  strokeWidth="1.2"
                />
                <rect x={benchBoxStartX + 2} y={rhY - 11} width="84" height="11" rx="2" fill="#1e1b4b" stroke="#818cf8" strokeWidth="0.6" />
                <text x={benchBoxStartX + 44} y={rhY - 3} fill="#c7d2fe" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                  CRT RH BSL (${formatPrice(crt.benchmark.rangeHigh)})
                </text>

                {/* 50% Equilibrium (EQ) Line */}
                <line
                  x1={benchBoxStartX}
                  y1={eqY}
                  x2={benchBoxEndX}
                  y2={eqY}
                  stroke="#a5b4fc"
                  strokeWidth="0.9"
                  strokeDasharray="2 2"
                />
                <rect x={benchBoxStartX + 2} y={eqY - 6} width="58" height="11" rx="2" fill="#1e1b4b" stroke="#a5b4fc" strokeWidth="0.6" />
                <text x={benchBoxStartX + 31} y={eqY + 2} fill="#e0e7ff" fontSize="6" fontWeight="bold" textAnchor="middle">
                  50% CRT EQ
                </text>

                {/* Range Low (RL SSL) Line */}
                <line
                  x1={benchBoxStartX}
                  y1={rlY}
                  x2={benchBoxEndX}
                  y2={rlY}
                  stroke="#818cf8"
                  strokeWidth="1.2"
                />
                <rect x={benchBoxStartX + 2} y={rlY + 1} width="84" height="11" rx="2" fill="#1e1b4b" stroke="#818cf8" strokeWidth="0.6" />
                <text x={benchBoxStartX + 44} y={rlY + 9} fill="#c7d2fe" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                  CRT RL SSL (${formatPrice(crt.benchmark.rangeLow)})
                </text>

                {/* 2. ICT TURTLE SOUP MANIPULATION SWEEP */}
                <line
                  x1={sweepStartX}
                  y1={sweepY}
                  x2={sweepEndX}
                  y2={sweepY}
                  stroke={isBuy ? '#f43f5e' : '#38bdf8'}
                  strokeWidth="1.6"
                  strokeDasharray="2 2"
                />
                <g transform={`translate(${Math.max(paddingLeft + 4, Math.min(sweepX - 45, width - paddingRight - 105))}, ${isBuy ? sweepY + 7 : sweepY - 18})`}>
                  <rect width="102" height="14" rx="2.5" fill="#0f172a" stroke={isBuy ? '#f43f5e' : '#38bdf8'} strokeWidth="0.9" />
                  <text x="51" y="10" fill="#ffffff" fontSize="6.8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
                    ⚡ ICT TURTLE SOUP ({isBuy ? 'SSL' : 'BSL'})
                  </text>
                </g>

                {/* 3. ICT DISPLACEMENT & 5M MSS CONFIRMATION */}
                <line
                  x1={Math.max(paddingLeft, mssX - crtSpan)}
                  y1={mssY}
                  x2={Math.min(width - paddingRight - 10, mssX + crtSpan)}
                  y2={mssY}
                  stroke="#fbbf24"
                  strokeWidth="1.4"
                  strokeDasharray="2 2"
                />
                <rect x={mssX + 4} y={mssY - 6} width="56" height="12" rx="2" fill="#78350f" stroke="#fbbf24" strokeWidth="0.8" />
                <text x={mssX + 32} y={mssY + 3} fill="#fef3c7" fontSize="6.5" fontWeight="black" textAnchor="middle">
                  ICT 5M MSS
                </text>

                {/* 4. ICT FAIR VALUE GAP (FVG BISI / SIBI) MITIGATION ZONE */}
                <rect
                  x={fvgStartX}
                  y={fvgY}
                  width={fvgWidth}
                  height={fvgHeight}
                  fill={isBuy ? '#10b981' : '#ef4444'}
                  fillOpacity="0.18"
                  stroke={isBuy ? '#34d399' : '#f87171'}
                  strokeWidth="1"
                  strokeDasharray="2 1"
                  rx="2"
                />
                <text x={fvgStartX + 4} y={fvgY + Math.min(fvgHeight - 2, 8)} fill={isBuy ? '#6ee7b7' : '#fca5a5'} fontSize="5.8" fontWeight="bold">
                  FVG {isBuy ? 'BISI' : 'SIBI'}
                </text>
              </g>
            );
          })()}

          {/* CANDLESTICK RENDERING */}
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
              </g>
            );
          })}

          {/* 5. MODEL ICT + CRT EXECUTION TARGETS (ENTRY FVG, TP1 50% EQ, TP2 DOL, SL SWEEP) */}
          {(() => {
            const crt = activeSignal?.ictCrt || activeSignal?.crt9Am || scanData?.ictCrtModel || scanData?.crt9AmModel;
            const sig = activeSignal || (crt?.entryPrice ? {
              entryPrice: crt.entryPrice,
              stopLoss: crt.stopLoss,
              takeProfit1: crt.takeProfit1,
              takeProfit2: crt.takeProfit2,
              type: (crt.liquiditySweep?.type === 'SSL_SWEEP_BULLISH' || crt.sweepType?.includes('BULLISH')) ? 'BUY' as const : 'SELL' as const,
              riskRewardRatio: crt.riskRewardRatio
            } : null);

            if (!sig) return null;

            const entryY = priceToY(sig.entryPrice);
            const slY = priceToY(sig.stopLoss);
            const tp1Y = priceToY(sig.takeProfit1);
            const tp2Y = priceToY(sig.takeProfit2);

            // Risk zone height
            const riskTop = Math.min(entryY, slY);
            const riskHeight = Math.max(Math.abs(entryY - slY), 3);

            // Reward zone height (Draw on Liquidity external target)
            const rewardTop = Math.min(entryY, tp2Y);
            const rewardHeight = Math.max(Math.abs(entryY - tp2Y), 3);

            // Localized position tool coordinates anchored to setup
            const posStartX = Math.max(paddingLeft + 60, width - paddingRight - (minimalistLines ? 190 : 250));
            const posEndX = width - paddingRight;
            const posWidth = posEndX - posStartX;

            return (
              <g id="ict-crt-execution-group">
                {/* 4.5. AREA KEY LEVEL UNTUK ENTRI VALID & PRESISI (OTE 62% - 79% + FVG BISI/SIBI CONFLUENCE) */}
                {(() => {
                  const klz = activeSignal?.keyLevelZone || crt?.keyLevelZone;
                  if (!klz) return null;

                  const isBuy = sig.type === 'BUY';
                  const klzTopY = priceToY(klz.high);
                  const klzBottomY = priceToY(klz.low);
                  const klzZoneY = Math.min(klzTopY, klzBottomY);
                  const klzZoneH = Math.max(Math.abs(klzBottomY - klzTopY), 14);
                  const sweetY = priceToY(klz.sweetSpot);

                  const klzStartX = Math.max(paddingLeft, posStartX - 130);
                  const klzWidth = (width - paddingRight) - klzStartX;

                  return (
                    <g id="area-key-level-group">
                      {/* Shaded Area Key Level Zone with distinct high-contrast border */}
                      <rect
                        x={klzStartX}
                        y={klzZoneY}
                        width={klzWidth}
                        height={klzZoneH}
                        fill={isBuy ? '#0284c7' : '#e11d48'}
                        fillOpacity="0.22"
                        stroke={isBuy ? '#38bdf8' : '#fb7185'}
                        strokeWidth="1.6"
                        strokeDasharray="4 2"
                        rx="3"
                      />

                      {/* Sweet Spot Line (Confluence 70.5% OTE & FVG Midpoint) */}
                      <line
                        x1={klzStartX}
                        y1={sweetY}
                        x2={width - paddingRight}
                        y2={sweetY}
                        stroke="#f59e0b"
                        strokeWidth="2.4"
                        strokeDasharray="6 3"
                      />

                      {/* Area Key Level Label & Status Badge */}
                      <rect
                        x={klzStartX + 6}
                        y={klzZoneY + 2}
                        width="186"
                        height="17"
                        rx="3"
                        fill="#082f49"
                        stroke="#38bdf8"
                        strokeWidth="1"
                      />
                      <text
                        x={klzStartX + 12}
                        y={klzZoneY + 13}
                        fill="#bae6fd"
                        fontSize="7.5"
                        fontWeight="black"
                        fontFamily="monospace"
                      >
                        🎯 AREA KEY LEVEL ({klz.precisionScore}%): ${formatPrice(klz.low)} - ${formatPrice(klz.high)}
                      </text>

                      {/* Sweet spot indicator badge */}
                      <rect
                        x={klzStartX + 196}
                        y={klzZoneY + 2}
                        width="118"
                        height="17"
                        rx="3"
                        fill="#78350f"
                        stroke="#f59e0b"
                        strokeWidth="1"
                      />
                      <text
                        x={klzStartX + 202}
                        y={klzZoneY + 13}
                        fill="#fef3c7"
                        fontSize="7.5"
                        fontWeight="black"
                        fontFamily="monospace"
                      >
                        ★ SWEET SPOT: ${formatPrice(klz.sweetSpot)}
                      </text>

                      {/* Status chip */}
                      <rect
                        x={klzStartX + 318}
                        y={klzZoneY + 2}
                        width="80"
                        height="17"
                        rx="3"
                        fill={klz.status === 'SWEET_SPOT_HIT' ? '#b45309' : klz.status === 'IN_ZONE' ? '#065f46' : '#1e1b4b'}
                        stroke={klz.status === 'SWEET_SPOT_HIT' ? '#f59e0b' : klz.status === 'IN_ZONE' ? '#10b981' : '#6366f1'}
                        strokeWidth="0.8"
                      />
                      <text
                        x={klzStartX + 358}
                        y={klzZoneY + 13}
                        fill="#ffffff"
                        fontSize="7"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {klz.status.replace(/_/g, ' ')}
                      </text>
                    </g>
                  );
                })()}

                {/* Visual Position Tool: Risk & Reward Shaded Box */}
                <rect
                  x={posStartX}
                  y={rewardTop}
                  width={posWidth}
                  height={rewardHeight}
                  fill="#10b981"
                  fillOpacity="0.14"
                  stroke="#10b981"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  pointerEvents="none"
                  rx="3"
                />
                <rect
                  x={posStartX}
                  y={riskTop}
                  width={posWidth}
                  height={riskHeight}
                  fill="#f43f5e"
                  fillOpacity="0.14"
                  stroke="#f43f5e"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  pointerEvents="none"
                  rx="3"
                />

                {/* Entry Level at FVG Mitigation */}
                <line x1={posStartX} y1={entryY} x2={posEndX} y2={entryY} stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
                <rect x={width - paddingRight + 2} y={entryY - 9} width="122" height="18" rx="3" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" />
                <text x={width - paddingRight + 5} y={entryY + 4} fill="#ffffff" fontSize="8" fontWeight="black" fontFamily="monospace">
                  ENTRY: ${formatPrice(sig.entryPrice)} 🔒
                </text>

                {/* TP 1 Line (50% CRT Equilibrium) */}
                <line x1={posStartX} y1={tp1Y} x2={posEndX} y2={tp1Y} stroke="#34d399" strokeWidth="1.6" />
                <rect x={width - paddingRight + 2} y={tp1Y - 9} width="122" height="18" rx="3" fill="#065f46" stroke="#059669" strokeWidth="1" />
                <text x={width - paddingRight + 5} y={tp1Y + 4} fill="#a7f3d0" fontSize="8" fontWeight="bold" fontFamily="monospace">
                  TP1 (50% EQ): ${formatPrice(sig.takeProfit1)} 🔒
                </text>

                {/* TP 2 (Major DOL External Liquidity Target) */}
                <line x1={posStartX} y1={tp2Y} x2={posEndX} y2={tp2Y} stroke="#10b981" strokeWidth="2.2" />
                <rect x={width - paddingRight + 2} y={tp2Y - 9} width="122" height="18" rx="3" fill="#047857" stroke="#10b981" strokeWidth="1.2" />
                <text x={width - paddingRight + 5} y={tp2Y + 4} fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="monospace">
                  TP2 (DOL): ${formatPrice(sig.takeProfit2)} 🔒
                </text>

                {/* Stop Loss Line (Sweep Invalidation Level) */}
                <line x1={posStartX} y1={slY} x2={posEndX} y2={slY} stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 2" />
                <rect x={width - paddingRight + 2} y={slY - 9} width="122" height="18" rx="3" fill="#881337" stroke="#e11d48" strokeWidth="1" />
                <text x={width - paddingRight + 5} y={slY + 4} fill="#fecdd3" fontSize="8" fontWeight="bold" fontFamily="monospace">
                  SL (Sweep): ${formatPrice(sig.stopLoss)} 🔒
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

      {/* 3. BOTTOM LEGEND: MODEL ICT + CANDLE RANGE THEORY (CRT) ANATOMY */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-indigo-500 border border-indigo-400"></span>
            <span>Rentang Acuan CRT (RH BSL, RL SSL, 50% EQ)</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-rose-500"></span>
            <span>ICT Turtle Soup Sweep (SSL/BSL)</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-amber-400"></span>
            <span>ICT Displacement MSS (5M Shift)</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/80 border border-emerald-400"></span>
            <span>ICT Fair Value Gap (FVG BISI / SIBI)</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-3 h-1 bg-emerald-400 rounded"></span>
            <span>Target Terkunci (50% EQ &amp; DOL)</span>
          </span>
        </div>

        <div className="font-mono text-[10px] text-amber-400 font-bold flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Eksklusif: Model ICT &amp; Candle Range Theory (CRT)</span>
        </div>
      </div>
    </div>
  );
}
