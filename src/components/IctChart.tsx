/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Candle, FVG, OrderBlock, MarketStructure, TradingSignal, Inducement, CISD } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Maximize2, Crosshair, Eye } from 'lucide-react';

interface IctChartProps {
  candles: Candle[];
  fvgs: FVG[];
  orderBlocks: OrderBlock[];
  marketStructures: MarketStructure[];
  inducements: Inducement[];
  cisds?: CISD[];
  activeSignal: TradingSignal | null;
  selectedPatternId: string | null;
  onSelectPattern: (id: string | null) => void;
  timeframe: string;
}

export default function IctChart({
  candles,
  fvgs,
  orderBlocks,
  marketStructures,
  inducements,
  cisds = [],
  activeSignal,
  selectedPatternId,
  onSelectPattern,
  timeframe,
}: IctChartProps) {
  // Navigation states (Zoom / Pan)
  const [visibleCount, setVisibleCount] = useState<number>(60); // default show 60 candles for wider resolution
  const [scrollOffset, setScrollOffset] = useState<number>(0); // 0 means latest candles are visible
  const [hoveredCandleIdx, setHoveredCandleIdx] = useState<number | null>(null);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Live countdown timer state for current forming candle
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (candles.length === 0) {
      setTimeRemaining('');
      return;
    }

    const getTfMs = (tf: string) => {
      switch (tf) {
        case '5m': return 5 * 60 * 1000;
        case '15m': return 15 * 60 * 1000;
        case '1h': return 60 * 60 * 1000;
        case '4h': return 4 * 60 * 60 * 1000;
        case '1d': return 24 * 60 * 60 * 1000;
        default: return 15 * 60 * 1000;
      }
    };

    const intervalMs = getTfMs(timeframe);

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

  // SVG Dimension defaults
  const width = 1200;
  const height = 540;
  const paddingLeft = 15;
  const paddingRight = 75;
  const paddingTop = 30;
  const paddingBottom = 50;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Reset scroll on candle list updates
  useEffect(() => {
    setScrollOffset(0);
  }, [candles]);

  // Adjust visible range limits
  const visibleRange = useMemo(() => {
    if (candles.length === 0) return { start: 0, end: 0, count: 0 };
    
    // visibleCount shouldn't exceed candles count
    const count = Math.min(visibleCount, candles.length);
    
    // max scroll offset
    const maxOffset = candles.length - count;
    const offset = Math.min(Math.max(0, scrollOffset), maxOffset);
    
    // Range indices
    const start = candles.length - count - offset;
    const end = candles.length - offset;
    
    return { start, end, count };
  }, [candles, visibleCount, scrollOffset]);

  // Visible candles slice
  const visibleCandles = useMemo(() => {
    if (candles.length === 0) return [];
    return candles.slice(visibleRange.start, visibleRange.end);
  }, [candles, visibleRange]);

  // Min and Max price in visible range for scaling
  const priceLimits = useMemo(() => {
    if (visibleCandles.length === 0) return { min: 0, max: 100 };
    
    let min = Infinity;
    let max = -Infinity;
    
    visibleCandles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });

    // Add breathing room (5% padding top and bottom)
    const diff = max - min;
    const pad = diff > 0 ? diff * 0.06 : min * 0.02;
    
    return {
      min: Math.max(0, min - pad),
      max: max + pad,
    };
  }, [visibleCandles]);

  // Map Price to Y coordinate
  const getY = (price: number) => {
    const min = priceLimits.min;
    const max = priceLimits.max;
    if (max === min) return paddingTop + chartHeight / 2;
    return paddingTop + chartHeight - ((price - min) / (max - min)) * chartHeight;
  };

  // Map Y coordinate back to Price
  const getPriceFromY = (y: number) => {
    const min = priceLimits.min;
    const max = priceLimits.max;
    const normalizedY = (chartHeight - (y - paddingTop)) / chartHeight;
    return min + normalizedY * (max - min);
  };

  // Map Candle relative index to X coordinate
  const getX = (visibleIdx: number) => {
    if (visibleRange.count <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (visibleIdx / (visibleRange.count - 1)) * chartWidth;
  };

  // Map global candle index to X coordinate
  const getXFromGlobalIndex = (globalIdx: number) => {
    const visibleIdx = globalIdx - visibleRange.start;
    return getX(visibleIdx);
  };

  // Check if a global candle index is within visible window
  const isVisible = (globalIdx: number) => {
    return globalIdx >= visibleRange.start && globalIdx < visibleRange.end;
  };

  // Candle width for rect rendering
  const candleWidth = useMemo(() => {
    return Math.max(2, (chartWidth / visibleRange.count) * 0.65);
  }, [chartWidth, visibleRange.count]);

  // Handles Zoom
  const handleZoom = (factor: number) => {
    setVisibleCount((prev) => {
      const next = Math.round(prev * factor);
      return Math.min(Math.max(15, next), candles.length);
    });
  };

  // Handles Scroll / Pan
  const handleScroll = (direction: 'left' | 'right' | 'latest') => {
    if (direction === 'latest') {
      setScrollOffset(0);
      return;
    }
    const delta = Math.round(visibleRange.count * 0.25) || 1;
    setScrollOffset((prev) => {
      const next = direction === 'left' ? prev + delta : prev - delta;
      return Math.min(Math.max(0, next), candles.length - visibleRange.count);
    });
  };

  // Mouse Move Event for Crosshair & Tooltip Snapping
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current || candles.length === 0) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    // Scale standard mouse client events to SVG coordinate system
    const x = (e.clientX - rect.left) * (width / rect.width);
    const y = (e.clientY - rect.top) * (height / rect.height);

    // Constrain inside chart area
    if (x < paddingLeft || x > width - paddingRight || y < paddingTop || y > height - paddingBottom) {
      setHoveredCandleIdx(null);
      setCrosshair(null);
      return;
    }

    setCrosshair({ x, y });

    // Find closest candle index
    const relativeX = x - paddingLeft;
    const pct = relativeX / chartWidth;
    const approxIdx = Math.round(pct * (visibleRange.count - 1));
    const snappedVisibleIdx = Math.max(0, Math.min(approxIdx, visibleRange.count - 1));
    const snappedGlobalIdx = visibleRange.start + snappedVisibleIdx;

    if (snappedGlobalIdx >= 0 && snappedGlobalIdx < candles.length) {
      setHoveredCandleIdx(snappedGlobalIdx);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCandleIdx(null);
    setCrosshair(null);
  };

  // Selected or Hovered candle detail
  const activeDetailCandle = hoveredCandleIdx !== null ? candles[hoveredCandleIdx] : candles[candles.length - 1];

  // Helper to draw horizontal level price tags cleanly on right price axis
  const renderPriceTag = (price: number, label: string, colorClass: string) => {
    if (typeof price !== 'number' || isNaN(price)) return null;
    const y = getY(price);
    if (isNaN(y) || y < paddingTop || y > height - paddingBottom) return null;
    return (
      <g key={`tag-${label}-${price}`} className="select-none font-mono">
        <line
          x1={paddingLeft}
          x2={width - paddingRight}
          y1={y}
          y2={y}
          stroke="currentColor"
          strokeDasharray="3,3"
          className={`${colorClass} opacity-60`}
          strokeWidth="1"
        />
        {/* Right axis price pill */}
        <rect
          x={width - paddingRight + 2}
          y={y - 8}
          width={82}
          height={16}
          rx={3}
          fill="#0f172a"
          stroke="currentColor"
          strokeWidth="1"
          className={`${colorClass}`}
        />
        <text
          x={width - paddingRight + 43}
          y={y + 4}
          fill="#ffffff"
          fontSize="9"
          fontWeight="bold"
          textAnchor="middle"
          className="font-mono"
        >
          {label}: {price.toFixed(1)}
        </text>
      </g>
    );
  };

  // --- PATTERN FILTERING FOR MAXIMUM CHART CLARITY ---
  // 1. Fair Value Gaps & Inversion FVGs: ONLY top 3 newest active/unmitigated gaps
  const activeFvgs = useMemo(() => {
    if (!fvgs) return [];
    // Filter out old mitigated gaps or gaps touched 3+ times
    const filtered = fvgs.filter((fvg) => {
      if (fvg.touchCount >= 3) return false;
      if (fvg.isMitigated && !fvg.isInverted) return false;
      return true;
    });
    filtered.sort((a, b) => b.startIndex - a.startIndex); // Newest first
    return filtered.slice(0, 3); // Keep only top 3 newest active gaps
  }, [fvgs]);

  // 2. Change in State of Delivery (CISD): ONLY top 2 newest CISD levels
  const activeCisds = useMemo(() => {
    const all: CISD[] = [...(cisds || [])];
    if (activeSignal?.cisd) {
      const exists = all.some((c) => c.id === activeSignal.cisd?.id || Math.abs(c.price - activeSignal.cisd!.price) < 0.01);
      if (!exists) all.push(activeSignal.cisd);
    }
    all.sort((a, b) => b.candleIndex - a.candleIndex); // Newest first
    return all.slice(0, 2); // Keep max 2 newest CISD levels
  }, [cisds, activeSignal]);

  // 3. Order Blocks: ONLY top 2 newest active OBs
  const activeOrderBlocks = useMemo(() => {
    if (!orderBlocks) return [];
    const list = [...orderBlocks];
    list.sort((a, b) => b.candleIndex - a.candleIndex);
    return list.slice(0, 2);
  }, [orderBlocks]);

  // 4. Inducements: ONLY top 2 newest active IDMs
  const activeInducements = useMemo(() => {
    if (!inducements) return [];
    const unSwept = inducements.filter((i) => !i.isSwept);
    const source = unSwept.length > 0 ? unSwept : inducements;
    const sorted = [...source].sort((a, b) => b.candleIndex - a.candleIndex);
    return sorted.slice(0, 2);
  }, [inducements]);

  // 5. Market Structures: ONLY top 3 newest MSS/BOS
  const activeMarketStructures = useMemo(() => {
    if (!marketStructures) return [];
    const list = [...marketStructures];
    list.sort((a, b) => b.candleIndex - a.candleIndex);
    return list.slice(0, 3);
  }, [marketStructures]);

  return (
    <div id="chart-container" className="flex flex-col bg-slate-900 rounded-lg border border-slate-800 p-4 shadow-xl">
      {/* Chart Top Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/60 pb-3 mb-3">
        {activeDetailCandle && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-sm bg-slate-950 px-2 py-0.5 rounded-sm border border-slate-800">
              {activeSignal?.symbol || 'BTCUSDT'}
            </span>
            <span className="text-slate-400 font-mono">
              Waktu: <span className="text-slate-200">{new Date(activeDetailCandle.time).toLocaleDateString()} {activeDetailCandle.timeString}</span>
            </span>
            <span className="font-mono text-slate-400">
              O: <span className={activeDetailCandle.close >= activeDetailCandle.open ? 'text-emerald-400' : 'text-rose-400'}>{activeDetailCandle.open.toFixed(2)}</span>
            </span>
            <span className="font-mono text-slate-400">
              H: <span className="text-emerald-400">{activeDetailCandle.high.toFixed(2)}</span>
            </span>
            <span className="font-mono text-slate-400">
              L: <span className="text-rose-400">{activeDetailCandle.low.toFixed(2)}</span>
            </span>
            <span className="font-mono text-slate-400">
              C: <span className={activeDetailCandle.close >= activeDetailCandle.open ? 'text-emerald-400' : 'text-rose-400'}>{activeDetailCandle.close.toFixed(2)}</span>
            </span>
          </div>
        )}

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-md border border-slate-800">
          <div className="flex items-center gap-1 border-r border-slate-800 pr-1.5">
            <button
              id="btn-scroll-left"
              onClick={() => handleScroll('left')}
              className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-slate-100 rounded transition"
              title="Scroll ke kiri (Masa Lalu)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="btn-zoom-out"
              onClick={() => handleZoom(1.2)}
              className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-slate-100 rounded transition"
              title="Zoom Out (Perkecil Chart)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              id="btn-zoom-in"
              onClick={() => handleZoom(0.8)}
              className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-slate-100 rounded transition"
              title="Zoom In (Perbesar Chart)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              id="btn-scroll-right"
              onClick={() => handleScroll('right')}
              className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-slate-100 rounded transition"
              title="Scroll ke kanan"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Zoom Presets */}
          <div className="flex items-center gap-1 text-[10px] font-mono">
            <button
              onClick={() => { setVisibleCount(30); setScrollOffset(0); }}
              className={`px-2 py-1 rounded transition font-bold ${visibleCount === 30 ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
              title="Zoom Fokus (30 Lilin)"
            >
              30L
            </button>
            <button
              onClick={() => { setVisibleCount(60); setScrollOffset(0); }}
              className={`px-2 py-1 rounded transition font-bold ${visibleCount === 60 ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
              title="Zoom Standar (60 Lilin)"
            >
              60L
            </button>
            <button
              onClick={() => { setVisibleCount(120); setScrollOffset(0); }}
              className={`px-2 py-1 rounded transition font-bold ${visibleCount === 120 ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
              title="Zoom Luas (120 Lilin)"
            >
              120L
            </button>
            <button
              id="btn-scroll-latest"
              onClick={() => handleScroll('latest')}
              className="px-2.5 py-1 text-[10px] bg-slate-900 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 rounded border border-indigo-500/30 transition font-bold"
              title="Lompat ke lilin terbaru"
            >
              Reset Zoom
            </button>
          </div>
        </div>
      </div>

      {/* SVG Rendering Stage */}
      <div ref={containerRef} className="relative w-full overflow-hidden select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onWheel={(e) => {
            if (e.deltaY < 0) {
              handleZoom(0.85); // Zoom In
            } else {
              handleZoom(1.15); // Zoom Out
            }
          }}
          textRendering="geometricPrecision"
          shapeRendering="geometricPrecision"
        >
          {/* Background Grid Lines */}
          <g opacity="0.04" stroke="#ffffff" strokeWidth="1">
            {/* Price lines */}
            {Array.from({ length: 6 }).map((_, i) => {
              const yVal = priceLimits.min + (i / 5) * (priceLimits.max - priceLimits.min);
              const y = getY(yVal);
              return <line key={`grid-y-${i}`} x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} />;
            })}
            {/* Time lines */}
            {Array.from({ length: 8 }).map((_, i) => {
              const x = paddingLeft + (i / 7) * chartWidth;
              return <line key={`grid-x-${i}`} x1={x} y1={paddingTop} x2={x} y2={height - paddingBottom} />;
            })}
          </g>

          {/* SVG Axis borders */}
          <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} stroke="#374151" strokeWidth="1" />
          <line x1={width - paddingRight} y1={paddingTop} x2={width - paddingRight} y2={height - paddingBottom} stroke="#374151" strokeWidth="1" />
          <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#374151" strokeWidth="1" />

          {/* --- 1. RENDER DETECTED PATTERN OVERLAYS (FILTERED FOR RECENT/ACTIVE ONLY) --- */}

          {/* FVG (Fair Value Gaps) & Inversion FVGs */}
          {activeFvgs.map((fvg) => {
            const fvgStartGlobalIdx = fvg.startIndex;
            const fvgEndGlobalIdx = fvg.isInverted 
              ? (fvg.invertedAtIndex ?? candles.length - 1)
              : (fvg.isMitigated ? (fvg.mitigatedByIndex ?? candles.length - 1) : candles.length - 1);

            const startsBeforeVisibleEnd = fvgStartGlobalIdx < visibleRange.end;
            const endsAfterVisibleStart = fvgEndGlobalIdx >= visibleRange.start;

            if (!startsBeforeVisibleEnd || !endsAfterVisibleStart) return null;

            const visualStartIdx = Math.max(fvgStartGlobalIdx, visibleRange.start);
            const visualEndIdx = Math.min(fvgEndGlobalIdx, visibleRange.end - 1);

            const xStart = getXFromGlobalIndex(visualStartIdx);
            const xEnd = getXFromGlobalIndex(visualEndIdx);
            const yTop = getY(fvg.top);
            const yBottom = getY(fvg.bottom);
            const rectHeight = Math.abs(yBottom - yTop);

            const isSelected = selectedPatternId === fvg.id;

            let fill = 'rgba(16, 185, 129, 0.08)';
            let stroke = '#10b981';
            let label = fvg.touchCount > 0 ? `FVG Bull (${fvg.touchCount}/3)` : `FVG Bull (Baru)`;
            let textColor = '#34d399';
            let strokeWidth = '1';
            let strokeDash = '3,3';

            if (fvg.type === 'bearish') {
              fill = 'rgba(239, 68, 68, 0.08)';
              stroke = '#ef4444';
              label = fvg.touchCount > 0 ? `FVG Bear (${fvg.touchCount}/3)` : `FVG Bear (Baru)`;
              textColor = '#f87171';
            }

            if (fvg.isInverted) {
              strokeDash = '0';
              strokeWidth = '1.5';
              if (fvg.invertedType === 'bearish_to_bullish') {
                fill = 'rgba(99, 102, 241, 0.18)';
                stroke = '#6366f1';
                label = `IFG Bull Support (${fvg.touchCount}/3)`;
                textColor = '#818cf8';
              } else {
                fill = 'rgba(234, 179, 8, 0.18)';
                stroke = '#eab308';
                label = `IFG Bear Resist (${fvg.touchCount}/3)`;
                textColor = '#fbbf24';
              }
            }

            if (isSelected) {
              stroke = '#818cf8';
              strokeWidth = '2';
              fill = fvg.isInverted ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)';
            }

            return (
              <g key={fvg.id} className="cursor-pointer" onClick={() => onSelectPattern(fvg.id)}>
                <rect
                  x={xStart}
                  y={Math.min(yTop, yBottom)}
                  width={Math.max(10, xEnd - xStart)}
                  height={rectHeight}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                />
                {isVisible(fvgStartGlobalIdx) && (
                  <g transform={`translate(${getXFromGlobalIndex(fvgStartGlobalIdx) + 4}, ${Math.min(yTop, yBottom) + 2})`}>
                    <rect
                      width={125}
                      height={15}
                      rx={3}
                      fill="#0f172a"
                      stroke={stroke}
                      strokeWidth="0.8"
                      className="filter drop-shadow-sm"
                    />
                    <text
                      x={6}
                      y={11}
                      fill={textColor}
                      fontSize="9"
                      fontWeight="bold"
                      className="font-mono"
                    >
                      {label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Standalone CISD (Change in State of Delivery) Level Overlays */}
          {activeCisds.map((cisd, idx) => {
            const y = getY(cisd.price);
            if (isNaN(y) || y < paddingTop || y > height - paddingBottom) return null;

            const isBull = cisd.type === 'bullish';
            const strokeColor = isBull ? '#10b981' : '#f43f5e';
            const badgeBg = isBull ? '#064e3b' : '#881337';

            // CISD line extends ONLY from the candle where it was triggered to the right
            const xStart = isVisible(cisd.candleIndex)
              ? getXFromGlobalIndex(cisd.candleIndex)
              : (cisd.candleIndex >= visibleRange.end ? width - paddingRight : paddingLeft);

            return (
              <g key={`cisd-overlay-${cisd.id || idx}`} pointerEvents="none">
                <line
                  x1={xStart}
                  x2={width - paddingRight}
                  y1={y}
                  y2={y}
                  stroke={strokeColor}
                  strokeWidth="1.8"
                  strokeDasharray="5,3"
                  opacity="0.9"
                />

                {isVisible(cisd.candleIndex) && (
                  <g transform={`translate(${xStart}, ${y})`}>
                    <circle r="5" fill={strokeColor} className="animate-ping" opacity="0.6" />
                    <circle r="3.5" fill={strokeColor} stroke="#ffffff" strokeWidth="1" />
                  </g>
                )}

                <g transform={`translate(${Math.min(width - paddingRight - 165, Math.max(paddingLeft + 5, xStart + 8))}, ${y - 9})`}>
                  <rect
                    width={155}
                    height={18}
                    rx={3}
                    fill={badgeBg}
                    stroke={strokeColor}
                    strokeWidth="1"
                    className="filter drop-shadow-sm"
                  />
                  <text
                    x={8}
                    y={12}
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="bold"
                    className="font-mono"
                  >
                    ⚡ CISD {isBull ? 'Bull' : 'Bear'}: ${cisd.price.toFixed(2)}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Order Blocks (OB) */}
          {activeOrderBlocks.map((ob) => {
            if (ob.candleIndex >= visibleRange.end) return null;
            const obStartGlobalIdx = ob.candleIndex;
            const obEndGlobalIdx = candles.length - 1;

            const visualStartIdx = Math.max(obStartGlobalIdx, visibleRange.start);
            const visualEndIdx = Math.min(obEndGlobalIdx, visibleRange.end - 1);

            const xStart = getXFromGlobalIndex(visualStartIdx);
            const xEnd = getXFromGlobalIndex(visualEndIdx);
            const yTop = getY(ob.top);
            const yBottom = getY(ob.bottom);
            const rectHeight = Math.abs(yBottom - yTop);

            const isSelected = selectedPatternId === ob.id;

            let fill = 'rgba(59, 130, 246, 0.08)';
            let stroke = '#3b82f6';
            let label = 'Bullish OB';
            let textColor = '#818cf8';

            if (ob.type === 'bearish') {
              fill = 'rgba(239, 68, 68, 0.05)';
              stroke = '#ef4444';
              label = 'Bearish OB';
              textColor = '#f87171';
            }

            if (isSelected) {
              stroke = '#6366f1';
              fill = 'rgba(99, 102, 241, 0.2)';
            }

            return (
              <g key={ob.id} className="cursor-pointer" onClick={() => onSelectPattern(ob.id)}>
                <rect
                  x={xStart}
                  y={Math.min(yTop, yBottom)}
                  width={Math.max(5, xEnd - xStart)}
                  height={Math.max(2, rectHeight)}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isSelected ? '2' : '1'}
                />
                {isVisible(obStartGlobalIdx) && (
                  <g transform={`translate(${getXFromGlobalIndex(obStartGlobalIdx) + 4}, ${Math.min(yTop, yBottom) + 2})`}>
                    <rect
                      width={80}
                      height={14}
                      rx={3}
                      fill="#0f172a"
                      stroke={stroke}
                      strokeWidth="0.8"
                    />
                    <text
                      x={5}
                      y={10}
                      fill={textColor}
                      fontSize="9"
                      fontWeight="bold"
                      className="font-mono"
                    >
                      {label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Market Structure Shifts (MSS / BOS) */}
          {activeMarketStructures.map((ms) => {
            const levelVisible = isVisible(ms.levelIndex);
            const breakVisible = isVisible(ms.candleIndex);

            if (!levelVisible && !breakVisible && (ms.candleIndex < visibleRange.start || ms.levelIndex >= visibleRange.end)) return null;

            const xStart = getXFromGlobalIndex(Math.max(ms.levelIndex, visibleRange.start));
            const xEnd = getXFromGlobalIndex(Math.min(ms.candleIndex, visibleRange.end - 1));
            const y = getY(ms.price);

            const isSelected = selectedPatternId === ms.id;

            return (
              <g key={ms.id} className="cursor-pointer" onClick={() => onSelectPattern(ms.id)}>
                <line
                  x1={xStart}
                  y1={y}
                  x2={xEnd}
                  y2={y}
                  stroke={isSelected ? '#6366f1' : (ms.type === 'bullish' ? '#10b981' : '#ef4444')}
                  strokeWidth={isSelected ? '2' : '1.5'}
                  strokeDasharray="4,3"
                />
                {isVisible(ms.candleIndex) && (
                  <g transform={`translate(${getXFromGlobalIndex(ms.candleIndex) - 25}, ${y - 12})`}>
                    <rect
                      width={38}
                      height={14}
                      rx={3}
                      fill={ms.type === 'bullish' ? '#047857' : '#b91c1c'}
                      stroke="#ffffff"
                      strokeWidth="0.5"
                    />
                    <text
                      x={19}
                      y={10}
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      {ms.style}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Inducements (IDM) */}
          {activeInducements.map((idm) => {
            const isVisibleStart = isVisible(idm.candleIndex);
            const isVisibleSweep = idm.sweptAtIndex !== null && isVisible(idm.sweptAtIndex);

            if (!isVisibleStart && !isVisibleSweep && (idm.candleIndex < visibleRange.start || idm.candleIndex >= visibleRange.end)) return null;

            const xStart = getXFromGlobalIndex(Math.max(idm.candleIndex, visibleRange.start));
            const xEnd = idm.sweptAtIndex !== null
              ? getXFromGlobalIndex(Math.min(idm.sweptAtIndex, visibleRange.end - 1))
              : getXFromGlobalIndex(visibleRange.end - 1);
              
            const y = getY(idm.price);

            if (isNaN(xStart) || isNaN(xEnd) || isNaN(y)) return null;

            const strokeColor = idm.isSwept ? '#94a3b8' : '#f59e0b';
            const dashArray = idm.isSwept ? '2,3' : '4,2';
            const labelText = idm.isSwept ? `IDM Swept ✓` : `IDM Liquidity ⚡`;

            return (
              <g key={idm.id} className="opacity-90">
                <line
                  x1={xStart}
                  y1={y}
                  x2={xEnd}
                  y2={y}
                  stroke={strokeColor}
                  strokeWidth={idm.isSwept ? '1' : '1.3'}
                  strokeDasharray={dashArray}
                />
                
                {isVisibleStart && (
                  <circle
                    cx={getXFromGlobalIndex(idm.candleIndex)}
                    cy={y}
                    r="3"
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="1"
                  />
                )}

                {idm.isSwept && idm.sweptAtIndex !== null && isVisible(idm.sweptAtIndex) && (
                  <g transform={`translate(${getXFromGlobalIndex(idm.sweptAtIndex)}, ${y})`}>
                    <circle
                      cx="0"
                      cy="0"
                      r="5"
                      fill="#10b981"
                      className="animate-ping"
                      opacity="0.5"
                    />
                    <circle
                      cx="0"
                      cy="0"
                      r="3"
                      fill="#10b981"
                    />
                  </g>
                )}

                {isVisibleStart && (
                  <g transform={`translate(${getXFromGlobalIndex(idm.candleIndex) + 4}, ${idm.type === 'bullish' ? y + 4 : y - 16})`}>
                    <rect
                      width={130}
                      height={14}
                      rx={3}
                      fill="#0f172a"
                      stroke={strokeColor}
                      strokeWidth="0.8"
                    />
                    <text
                      x={6}
                      y={10}
                      fill={strokeColor}
                      fontSize="9"
                      fontWeight="bold"
                      className="font-mono"
                    >
                      {labelText} ({idm.price.toFixed(1)})
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* --- 2. RENDER THE CANDLESTICKS --- */}
          {visibleCandles.map((candle, idx) => {
            const globalIdx = visibleRange.start + idx;
            const x = getX(idx);
            const yOpen = getY(candle.open);
            const yClose = getY(candle.close);
            const yHigh = getY(candle.high);
            const yLow = getY(candle.low);

            if (isNaN(x) || isNaN(yOpen) || isNaN(yClose) || isNaN(yHigh) || isNaN(yLow)) return null;

            const isBullish = candle.close >= candle.open;
            const candleColor = isBullish ? '#10b981' : '#ef4444';

            const rectTop = Math.min(yOpen, yClose);
            const rectHeight = Math.max(1, Math.abs(yClose - yOpen));

            const isHovered = hoveredCandleIdx === globalIdx;

            return (
              <g key={`candle-${candle.time}-${idx}`} className="transition-all duration-75">
                {/* Wick / Shadow */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={candleColor}
                  strokeWidth={isHovered ? '2' : '1.2'}
                />
                {/* Real Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={rectTop}
                  width={candleWidth}
                  height={rectHeight}
                  fill={candleColor}
                  stroke={isHovered ? '#ffffff' : candleColor}
                  strokeWidth={isHovered ? '1.5' : '0'}
                  rx="1"
                />
              </g>
            );
          })}

          {/* --- 3. ACTIVE SIGNAL RENDER OVERLAYS (Entry, SL, TPs) --- */}
          {activeSignal && (
            <g className="opacity-90">
              {/* Entry Zone Shading */}
              {renderPriceTag(activeSignal.entryRange.max, 'Limit Entry Max', 'text-emerald-400 font-mono')}
              {renderPriceTag(activeSignal.entryRange.min, 'Limit Entry Min', 'text-emerald-400 font-mono')}
              
              {/* Entry shading rectangle */}
              <rect
                x={paddingLeft}
                y={Math.min(getY(activeSignal.entryRange.min), getY(activeSignal.entryRange.max))}
                width={chartWidth}
                height={Math.abs(getY(activeSignal.entryRange.max) - getY(activeSignal.entryRange.min))}
                fill="rgba(16, 185, 129, 0.03)"
                pointerEvents="none"
              />

              {/* Optimal Trade Entry (OTE) Zone (62% - 79% Fibonacci Retracement) */}
              {activeSignal.oteZone && (
                <g id="ote-fib-group" className="select-none">
                  {/* OTE Shading between 62% and 79% */}
                  <rect
                    x={paddingLeft}
                    y={Math.min(getY(activeSignal.oteZone.fib62), getY(activeSignal.oteZone.fib79))}
                    width={chartWidth}
                    height={Math.abs(getY(activeSignal.oteZone.fib79) - getY(activeSignal.oteZone.fib62))}
                    fill="rgba(245, 158, 11, 0.08)"
                    stroke="rgba(245, 158, 11, 0.25)"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                    pointerEvents="none"
                  />
                  {/* Fib 62% line */}
                  <line
                    x1={paddingLeft}
                    x2={width - paddingRight}
                    y1={getY(activeSignal.oteZone.fib62)}
                    y2={getY(activeSignal.oteZone.fib62)}
                    stroke="#f59e0b"
                    strokeWidth="1"
                    strokeDasharray="4,2"
                    opacity="0.7"
                  />
                  <text
                    x={paddingLeft + 10}
                    y={getY(activeSignal.oteZone.fib62) - 4}
                    fill="#f59e0b"
                    fontSize="8"
                    fontWeight="bold"
                  >
                    OTE 62.0% ({activeSignal.oteZone.fib62.toFixed(2)})
                  </text>

                  {/* Fib 70.5% line (Sweet Spot) */}
                  <line
                    x1={paddingLeft}
                    x2={width - paddingRight}
                    y1={getY(activeSignal.oteZone.fib705)}
                    y2={getY(activeSignal.oteZone.fib705)}
                    stroke="#eab308"
                    strokeWidth="1.2"
                    opacity="0.9"
                  />
                  <text
                    x={paddingLeft + 10}
                    y={getY(activeSignal.oteZone.fib705) - 4}
                    fill="#eab308"
                    fontSize="8"
                    fontWeight="bold"
                  >
                    🎯 OTE 70.5% Sweet Spot ({activeSignal.oteZone.fib705.toFixed(2)})
                  </text>

                  {/* Fib 79% line */}
                  <line
                    x1={paddingLeft}
                    x2={width - paddingRight}
                    y1={getY(activeSignal.oteZone.fib79)}
                    y2={getY(activeSignal.oteZone.fib79)}
                    stroke="#f59e0b"
                    strokeWidth="1"
                    strokeDasharray="4,2"
                    opacity="0.7"
                  />
                  <text
                    x={paddingLeft + 10}
                    y={getY(activeSignal.oteZone.fib79) + 10}
                    fill="#f59e0b"
                    fontSize="8"
                    fontWeight="bold"
                  >
                    OTE 79.0% ({activeSignal.oteZone.fib79.toFixed(2)})
                  </text>

                  {/* Anchor High Line & Label (BSL) */}
                  {(() => {
                    const bslVal = activeSignal.bsl ?? activeSignal.oteZone?.swingHigh;
                    if (bslVal === undefined || isNaN(bslVal)) return null;
                    const y = getY(bslVal);
                    if (isNaN(y)) return null;
                    return (
                      <g>
                        <line
                          x1={paddingLeft}
                          x2={width - paddingRight}
                          y1={y}
                          y2={y}
                          stroke="#ef4444"
                          strokeWidth="1.2"
                          strokeDasharray="4,4"
                          opacity="0.8"
                        />
                        <text
                          x={width - paddingRight - 10}
                          y={y - 4}
                          fill="#f87171"
                          fontSize="8"
                          textAnchor="end"
                          fontWeight="semibold"
                        >
                          🚨 BSL - Buy-Side Liquidity ({ bslVal.toFixed(2) })
                        </text>
                      </g>
                    );
                  })()}

                  {/* Anchor Low Line & Label (SSL) */}
                  {(() => {
                    const sslVal = activeSignal.ssl ?? activeSignal.oteZone?.swingLow;
                    if (sslVal === undefined || isNaN(sslVal)) return null;
                    const y = getY(sslVal);
                    if (isNaN(y)) return null;
                    return (
                      <g>
                        <line
                          x1={paddingLeft}
                          x2={width - paddingRight}
                          y1={y}
                          y2={y}
                          stroke="#3b82f6"
                          strokeWidth="1.2"
                          strokeDasharray="4,4"
                          opacity="0.8"
                        />
                        <text
                          x={width - paddingRight - 10}
                          y={y + 10}
                          fill="#60a5fa"
                          fontSize="8"
                          textAnchor="end"
                          fontWeight="semibold"
                        >
                          🛡️ SSL - Sell-Side Liquidity ({ sslVal.toFixed(2) })
                        </text>
                      </g>
                    );
                  })()}

                  {/* CISD (Change in State of Delivery) Line & Badge */}
                  {activeSignal.cisd && (() => {
                    const cisdVal = activeSignal.cisd.price;
                    const y = getY(cisdVal);
                    if (isNaN(y)) return null;
                    const isBull = activeSignal.cisd.type === 'bullish';
                    const color = isBull ? '#10b981' : '#f43f5e';
                    return (
                      <g id="cisd-overlay-group">
                        <line
                          x1={paddingLeft}
                          x2={width - paddingRight}
                          y1={y}
                          y2={y}
                          stroke={color}
                          strokeWidth="1.8"
                          strokeDasharray="6,3"
                        />
                        <rect
                          x={paddingLeft + 10}
                          y={y - 10}
                          width={240}
                          height={18}
                          rx={4}
                          fill={isBull ? '#064e3b' : '#881337'}
                          stroke={color}
                          strokeWidth="1"
                        />
                        <text
                          x={paddingLeft + 16}
                          y={y + 2}
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="bold"
                          className="font-mono"
                        >
                          ⚡ CISD Line: ${cisdVal.toFixed(2)} [{activeSignal.cisd.sweptType} Terjemput]
                        </text>
                      </g>
                    );
                  })()}
                </g>
              )}

              {/* Stop Loss (SL) */}
              {renderPriceTag(activeSignal.stopLoss, 'Stop Loss (Batal)', 'text-rose-500 font-mono')}

              {/* Take Profit (TPs) */}
              {renderPriceTag(activeSignal.takeProfit1, 'Target TP1', 'text-blue-400 font-mono')}
              {renderPriceTag(activeSignal.takeProfit2, 'Target TP2', 'text-indigo-400 font-mono')}
              {renderPriceTag(activeSignal.takeProfit3, 'Target TP3', 'text-purple-400 font-mono')}
            </g>
          )}

          {/* --- 4. RENDER VOLUME BAR CHARTS (Dimmed at Bottom) --- */}
          <g opacity="0.15">
            {visibleCandles.map((candle, idx) => {
              const x = getX(idx);
              const maxVol = Math.max(...visibleCandles.map((c) => c.volume), 1);
              const volHeight = (candle.volume / maxVol) * 45; // Max volume bar is 45px
              const y = height - paddingBottom - volHeight;
              
              if (isNaN(x) || isNaN(y) || isNaN(volHeight)) return null;
              
              const isBullish = candle.close >= candle.open;

              return (
                <rect
                  key={`vol-${candle.time}`}
                  x={x - candleWidth / 2}
                  y={y}
                  width={candleWidth}
                  height={volHeight}
                  fill={isBullish ? '#10b981' : '#ef4444'}
                />
              );
            })}
          </g>

          {/* --- 5. RENDER GRID LABELS (Price Axis Right & Time Axis Bottom) --- */}
          {/* Price labels right */}
          <g fill="#9ca3af" fontSize="9" className="font-mono">
            {Array.from({ length: 6 }).map((_, i) => {
              const price = priceLimits.min + (i / 5) * (priceLimits.max - priceLimits.min);
              const y = getY(price);
              
              if (isNaN(price) || isNaN(y)) return null;
              
              return (
                <text key={`price-lbl-${i}`} x={width - paddingRight + 6} y={y + 3} textAnchor="start">
                  {price.toFixed(2)}
                </text>
              );
            })}
          </g>

          {/* Time labels bottom */}
          <g fill="#9ca3af" fontSize="8" className="font-mono">
            {Array.from({ length: 5 }).map((_, i) => {
              const approxIdx = Math.round((i / 4) * (visibleRange.count - 1));
              const globalIdx = visibleRange.start + approxIdx;
              if (globalIdx < 0 || globalIdx >= candles.length) return null;
              
              const candle = candles[globalIdx];
              const x = getX(approxIdx);
              
              // Formatting time: show hour/minute + short date
              const timeFormatted = `${candle.timeString}`;
              const dateObj = new Date(candle.time);
              const dateFormatted = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

              return (
                <g key={`time-lbl-${i}`} transform={`translate(${x}, ${height - paddingBottom + 15})`}>
                  <text textAnchor="middle" y="0">{timeFormatted}</text>
                  <text textAnchor="middle" y="10" opacity="0.6">{dateFormatted}</text>
                </g>
              );
            })}
          </g>

          {/* --- 5.5. LIVE CURRENT PRICE TRACKER (TradingView Style) --- */}
          {candles.length > 0 && (
            (() => {
              const lastCandle = candles[candles.length - 1];
              const isBullish = lastCandle.close >= lastCandle.open;
              const y = getY(lastCandle.close);
              const isPriceVisible = y >= paddingTop && y <= height - paddingBottom;
              
              if (!isPriceVisible) return null;
              
              const priceColor = isBullish ? '#10b981' : '#ef4444';
              const badgeBg = isBullish ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)';

              return (
                <g key="live-price-tracker" pointerEvents="none">
                  {/* Dashed Price Line across the chart */}
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke={priceColor}
                    strokeWidth="1.2"
                    strokeDasharray="4,2"
                    className="animate-pulse"
                  />
                  
                  {/* Blinking Live Beacon Indicator Dot at the end of the line */}
                  <circle
                    cx={width - paddingRight}
                    cy={y}
                    r="4"
                    fill={priceColor}
                  />
                  <circle
                    cx={width - paddingRight}
                    cy={y}
                    r="8"
                    fill="none"
                    stroke={priceColor}
                    strokeWidth="1.5"
                    className="animate-ping"
                    style={{ transformOrigin: `${width - paddingRight}px ${y}px` }}
                  />

                  {/* Price Value Badge on Right Axis */}
                  <g transform={`translate(${width - paddingRight + 2}, ${y - 8})`}>
                    <rect
                      width={70}
                      height={16}
                      rx="2"
                      fill={badgeBg}
                      className="filter drop-shadow-sm"
                    />
                    <text
                      x="35"
                      y="11"
                      fill="#ffffff"
                      fontSize="8.5"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      {lastCandle.close.toFixed(2)}
                    </text>
                  </g>

                  {/* Live countdown timer badge below or beside the price label */}
                  {timeRemaining && (
                    <g transform={`translate(${width - paddingRight + 2}, ${y + 10})`}>
                      <rect
                        width={60}
                        height={12}
                        rx="1.5"
                        fill="#0f172a"
                        stroke="#334155"
                        strokeWidth="0.5"
                      />
                      <text
                        x="30"
                        y="9"
                        fill="#38bdf8"
                        fontSize="7"
                        fontWeight="semibold"
                        textAnchor="middle"
                        className="font-mono"
                      >
                        ⏱️ {timeRemaining}
                      </text>
                    </g>
                  )}
                </g>
              );
            })()
          )}

          {/* --- 6. INTERACTIVE CROSSHAIR --- */}
          {crosshair && hoveredCandleIdx !== null && hoveredCandleIdx >= visibleRange.start && hoveredCandleIdx < visibleRange.end && (
            <g pointerEvents="none">
              {/* Vertical dotted line snaps to candle X */}
              <line
                x1={getXFromGlobalIndex(hoveredCandleIdx)}
                y1={paddingTop}
                x2={getXFromGlobalIndex(hoveredCandleIdx)}
                y2={height - paddingBottom}
                stroke="#9ca3af"
                strokeWidth="1"
                strokeDasharray="2,2"
                opacity="0.5"
              />
              {/* Horizontal dotted line aligns with mouse Y */}
              <line
                x1={paddingLeft}
                y1={crosshair.y}
                x2={width - paddingRight}
                y2={crosshair.y}
                stroke="#9ca3af"
                strokeWidth="1"
                strokeDasharray="2,2"
                opacity="0.5"
              />

              {/* Floating Price label on crosshair Y axis */}
              <g transform={`translate(${width - paddingRight + 2}, ${crosshair.y - 7})`}>
                <rect width={65} height={14} rx="2" fill="#6366f1" />
                <text x="32" y="10" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle" className="font-mono">
                  {getPriceFromY(crosshair.y).toFixed(2)}
                </text>
              </g>

              {/* Floating Candle Hover Tooltip Box */}
              <g transform={`translate(${Math.min(crosshair.x + 15, width - paddingRight - 150)}, ${Math.max(paddingTop + 10, crosshair.y - 65)})`}>
                <rect width={135} height={60} rx="4" fill="rgba(15, 23, 42, 0.95)" stroke="#334155" strokeWidth="1" />
                <text x="8" y="14" fill="#818cf8" fontSize="8" fontWeight="bold">
                  LILIN TERPILIH
                </text>
                <text x="8" y="27" fill="#e2e8f0" fontSize="8" className="font-mono">
                  Open: {candles[hoveredCandleIdx].open.toFixed(2)}
                </text>
                <text x="8" y="38" fill="#10b981" fontSize="8" className="font-mono">
                  High: {candles[hoveredCandleIdx].high.toFixed(2)}
                </text>
                <text x="8" y="49" fill="#ef4444" fontSize="8" className="font-mono">
                  Low: {candles[hoveredCandleIdx].low.toFixed(2)}
                </text>
                <text x="75" y="27" fill="#e2e8f0" fontSize="8" className="font-mono">
                  Close: {candles[hoveredCandleIdx].close.toFixed(2)}
                </text>
                <text x="75" y="38" fill="#94a3b8" fontSize="8" className="font-mono">
                  Vol: {candles[hoveredCandleIdx].volume}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Chart Footer Indicator */}
      <div className="flex justify-between items-center mt-2 px-1 text-[10px] text-slate-500 font-mono">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1.5 bg-emerald-500/10 border border-emerald-500/30 inline-block"></span> Bullish FVG
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1.5 bg-rose-500/10 border border-rose-500/30 inline-block"></span> Bearish FVG
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1.5 bg-indigo-500/15 border border-indigo-500/40 inline-block"></span> IFG Bull Support
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1.5 bg-amber-500/15 border border-amber-500/40 inline-block"></span> IFG Bear Resist
          </span>
        </div>
        <span>Lilin Terlihat: {visibleRange.count} / {candles.length}</span>
      </div>
    </div>
  );
}
