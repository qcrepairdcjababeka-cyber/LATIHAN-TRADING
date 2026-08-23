/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Candle, H4Box, FiveMinCandleAnalysis, TradingSignal, ScanResult, SingleBox } from '../types';

/**
 * Calculates the H4 Key Boxes formed by Candle #2 and Candle #3 in real-time.
 * Candle 1 = current active/forming H4 candle (index: length - 1)
 * Candle 2 = previous closed H4 candle (index: length - 2) -> Box Lilin #2 (Chart 2)
 * Candle 3 = 2nd previous closed H4 candle (index: length - 3) -> Box Lilin #3 (Chart 3)
 */
export function calculateH4Box(h4Candles: Candle[]): H4Box | null {
  if (!h4Candles || h4Candles.length < 2) return null;

  const c2Idx = h4Candles.length - 2;
  const candle2 = h4Candles[c2Idx];

  const c3Idx = h4Candles.length >= 3 ? h4Candles.length - 3 : c2Idx;
  const candle3 = h4Candles[c3Idx];

  const isC2Bullish = candle2.close >= candle2.open;
  const isC3Bullish = candle3.close >= candle3.open;

  const box2: SingleBox = {
    candleIndex: c2Idx,
    candleNumber: 2,
    candle: candle2,
    top: candle2.high,
    bottom: candle2.low,
    bodyTop: Math.max(candle2.open, candle2.close),
    bodyBottom: Math.min(candle2.open, candle2.close),
    isBullish: isC2Bullish,
  };

  const box3: SingleBox = {
    candleIndex: c3Idx,
    candleNumber: 3,
    candle: candle3,
    top: candle3.high,
    bottom: candle3.low,
    bodyTop: Math.max(candle3.open, candle3.close),
    bodyBottom: Math.min(candle3.open, candle3.close),
    isBullish: isC3Bullish,
  };

  return {
    id: `h4-box-${candle2.time}`,
    candle2Index: c2Idx,
    candle2,
    candle3Index: c3Idx,
    candle3,
    box2,
    box3,
    top: candle2.high,
    bottom: candle2.low,
    bodyTop: box2.bodyTop,
    bodyBottom: box2.bodyBottom,
    type: isC2Bullish ? 'bullish' : 'bearish',
    timeframe: '4h',
  };
}

/**
 * Evaluates whether a 5-minute candle is a "Strong Candle" (body dominant >= 50%, not a wick)
 * and whether it has re-entered a target H4 Box after a recent breakout outside.
 */
export function analyze5mCandle(
  candle: Candle,
  index: number,
  targetBox: { top: number; bottom: number },
  all5mCandles?: Candle[],
  boxNumber?: 2 | 3
): FiveMinCandleAnalysis {
  const totalRange = candle.high - candle.low;
  const bodySize = Math.abs(candle.close - candle.open);
  const bodyRatio = totalRange > 0 ? bodySize / totalRange : 0;

  // Strong candle rule: Body must be >= 50% of the entire high-low range (not just a wick/shadow)
  const isStrong = bodyRatio >= 0.50 && bodySize > 0;

  let direction: 'bullish' | 'bearish' | 'doji' = 'doji';
  if (candle.close > candle.open) direction = 'bullish';
  else if (candle.close < candle.open) direction = 'bearish';

  // Check consecutive strong candles if previous candle exists
  let consecutiveStrongCount = isStrong ? 1 : 0;
  let has2ConsecutiveStrong = false;

  if (all5mCandles && index > 0) {
    const prev = all5mCandles[index - 1];
    const prevRange = prev.high - prev.low;
    const prevBody = Math.abs(prev.close - prev.open);
    const prevRatio = prevRange > 0 ? prevBody / prevRange : 0;
    const prevIsStrong = prevRatio >= 0.50 && prevBody > 0;
    const prevDirection = prev.close > prev.open ? 'bullish' : prev.close < prev.open ? 'bearish' : 'doji';

    if (isStrong && prevIsStrong && direction === prevDirection && direction !== 'doji') {
      consecutiveStrongCount = 2;
      has2ConsecutiveStrong = true;
    }
  }

  // Check interaction with target Box
  const touchesBox = candle.low <= targetBox.top && candle.high >= targetBox.bottom;
  const closesInBox = candle.close >= targetBox.bottom && candle.close <= targetBox.top;

  // Detect if recent candles (lookback up to 8 candles) broke out outside the target Box
  let brokeOutBelow = false;
  let brokeOutAbove = false;

  if (all5mCandles && index > 0) {
    const lookbackStart = Math.max(0, index - 8);
    const lookbackCandles = all5mCandles.slice(lookbackStart, index);
    for (const prev of lookbackCandles) {
      if (prev.low < targetBox.bottom || prev.close < targetBox.bottom) {
        brokeOutBelow = true;
      }
      if (prev.high > targetBox.top || prev.close > targetBox.top) {
        brokeOutAbove = true;
      }
    }
  } else {
    if (candle.low < targetBox.bottom || candle.open < targetBox.bottom) brokeOutBelow = true;
    if (candle.high > targetBox.top || candle.open > targetBox.top) brokeOutAbove = true;
  }

  let isBreakoutReentry = false;
  let breakoutSide: 'below' | 'above' | 'none' = 'none';
  let interactionType: 'reentered_from_breakout' | 'entered_box' | 'closed_in_box' | 'outside_box' | 'none' = 'none';

  if (closesInBox) {
    if (direction === 'bullish' && (brokeOutBelow || candle.open < targetBox.bottom)) {
      isBreakoutReentry = true;
      breakoutSide = 'below';
      interactionType = 'reentered_from_breakout';
    } else if (direction === 'bearish' && (brokeOutAbove || candle.open > targetBox.top)) {
      isBreakoutReentry = true;
      breakoutSide = 'above';
      interactionType = 'reentered_from_breakout';
    } else {
      interactionType = 'closed_in_box';
    }
  } else if (touchesBox) {
    interactionType = 'entered_box';
  } else {
    interactionType = 'outside_box';
  }

  return {
    candle,
    candleIndex: index,
    isStrong,
    bodyRatio,
    bodySize,
    totalRange,
    direction,
    isInsideBox: closesInBox || touchesBox,
    isBreakoutReentry,
    breakoutSide,
    interactionType,
    targetBoxNumber: boxNumber,
    consecutiveStrongCount,
    has2ConsecutiveStrong,
  };
}

/**
 * Scans a specific box (Box 2 or Box 3) against 5M candles for breakout + re-entry
 * STRICT RULE: Requires MINIMAL 2 CONSECUTIVE STRONG CLOSING CANDLES on 5M (bullish for BUY, bearish for SELL)
 */
function scanSpecificBox(
  symbol: string,
  box: SingleBox,
  h4Box: H4Box,
  fiveMinCandles: Candle[],
  boxNumber: 2 | 3
): { signal: TradingSignal | null; latestAnalysis: FiveMinCandleAnalysis | null } {
  const recentCount = Math.min(10, fiveMinCandles.length);
  const recent5m = fiveMinCandles.slice(-recentCount);
  let latestAnalysis: FiveMinCandleAnalysis | null = null;
  let signal: TradingSignal | null = null;

  for (let i = recent5m.length - 1; i >= 1; i--) {
    const c2 = recent5m[i]; // Candle Konfirmasi ke-2 (Trigger Sinyal)
    const c1 = recent5m[i - 1]; // Candle Konfirmasi ke-1
    const globalIdx2 = fiveMinCandles.length - recent5m.length + i;
    const globalIdx1 = globalIdx2 - 1;

    const analysis2 = analyze5mCandle(c2, globalIdx2, box, fiveMinCandles, boxNumber);
    const analysis1 = analyze5mCandle(c1, globalIdx1, box, fiveMinCandles, boxNumber);

    if (i === recent5m.length - 1) {
      latestAnalysis = analysis2;
    }

    const lookbackStart = Math.max(0, globalIdx1 - 8);
    const priorCandles = fiveMinCandles.slice(lookbackStart, globalIdx1);

    const hadBreakoutBelow = 
      priorCandles.some(p => p.low < box.bottom || p.close < box.bottom) || 
      c1.open < box.bottom || 
      c1.low < box.bottom || 
      c2.open < box.bottom || 
      c2.low < box.bottom;

    const hadBreakoutAbove = 
      priorCandles.some(p => p.high > box.top || p.close > box.top) || 
      c1.open > box.top || 
      c1.high > box.top || 
      c2.open > box.top || 
      c2.high > box.top;

    const entryPrice = c2.close;
    const targetBoxName = `Box H4 (Lilin #${boxNumber})`;
    const boxHeight = box.top - box.bottom;
    const buffer = Math.max(boxHeight * 0.05, entryPrice * 0.0008);
    const midPrice = parseFloat(((box.top + box.bottom) / 2).toFixed(4));

    const isBullishCandle = c2.close >= c2.open;
    const isBearishCandle = c2.close < c2.open;

    // BUY SIGNAL: Lilin 5M Masuk ke dalam Box H4 dari bawah (Bullish)
    // Sesuai tanda kotak merah: candle masuk/menembus batas bawah box dan closing di dalam box
    const isEnteringFromBelow = 
      (c2.open < box.bottom && c2.close >= box.bottom) ||
      (c1.close <= box.bottom && c2.close > box.bottom) ||
      (hadBreakoutBelow && c2.close >= box.bottom && c2.close <= box.top);

    // SELL SIGNAL: Lilin 5M Masuk ke dalam Box H4 dari atas (Bearish)
    // Sesuai tanda kotak merah: candle masuk/menembus batas atas box dan closing di dalam box
    const isEnteringFromAbove = 
      (c2.open > box.top && c2.close <= box.top) ||
      (c1.close >= box.top && c2.close < box.top) ||
      (hadBreakoutAbove && c2.close <= box.top && c2.close >= box.bottom);

    // ==========================================
    // EVALUASI MEMORY & KUALITAS MASUK BOX:
    // ==========================================
    // 1. SKENARIO MASUK DARI BAWAH (POTENSI AWAL BUY)
    if (!signal && isEnteringFromBelow) {
      const isWeakEntry = !analysis2.isStrong || analysis2.bodyRatio < 0.50 || analysis2.direction === 'doji';
      const isBullishPairedWithBearish = 
        (analysis1.direction === 'bullish' && (analysis2.direction === 'bearish' || c2.close < c2.open)) ||
        (isBullishCandle && (c2.close < c1.close || c2.high - c2.close > (c2.high - c2.low) * 0.5));

      // ATURAN MEMORY USER: Jika candle masuk box WEAK atau lilin bullish dibarengi lilin bearish:
      // => Signal BUY = CANCEL dan Signal BERUBAH MENJADI SELL!
      if (isWeakEntry || isBullishPairedWithBearish) {
        const breakoutHighs = priorCandles.filter(p => p.high > box.top).map(p => p.high);
        const highestHigh = Math.max(...breakoutHighs, c1.high, c2.high, box.top);
        const stopLoss = parseFloat((highestHigh + buffer).toFixed(4));
        const risk = Math.max(stopLoss - entryPrice, entryPrice * 0.001);

        const tp1 = midPrice; // Garis Tengah Hitam
        const tp2 = parseFloat(box.bottom.toFixed(4)); // Batas Bawah Box
        const tp3 = parseFloat((box.bottom - (midPrice - box.bottom)).toFixed(4));
        const rrRatio = parseFloat((Math.abs(entryPrice - tp1) / Math.max(risk, 0.0001)).toFixed(2));

        const pct1 = Math.round(analysis1.bodyRatio * 100);
        const pct2 = Math.round(analysis2.bodyRatio * 100);

        signal = {
          id: `SIG-FLIP-SELL-${symbol}-B${boxNumber}-${c2.time}`,
          type: 'SELL',
          symbol,
          timeframe: '5m',
          h4Box,
          targetBoxName,
          targetBoxNumber: boxNumber,
          triggerCandle: c2,
          firstConfirmCandle: c1,
          secondConfirmCandle: c2,
          confirmationCount: 1,
          entryPrice,
          stopLoss,
          takeProfit1: tp1,
          takeProfit2: tp2,
          takeProfit3: tp3,
          riskRewardRatio: rrRatio > 0 ? rrRatio : 2.5,
          setupType: `⚠️ BUY DIBATALKAN ➔ BERUBAH MENJADI SELL (Lilin Masuk Lemah / Dibalas Bearish)`,
          explanation: `Candle 5M mencoba masuk Box H4 #${boxNumber} dari bawah, namun terdeteksi WEAK (${pct2}% body) atau candle bullish langsung dibarengi candle bearish penolakan. Sinyal BUY otomatis DICANCEL dan berbalik menjadi SELL. Target TP 1: Garis Tengah ($${tp1.toFixed(2)}), TP 2: Batas Bawah Box ($${tp2.toFixed(2)}).`,
          timestamp: c2.time,
          status: 'active',
          confirmation: `⚠️ BUY CANCEL ➔ FLIP SELL (${isWeakEntry ? 'Candle Lemah <50%' : 'Bullish Dibalas Bearish'}) &bull; TP 1: Garis Tengah ($${tp1.toFixed(2)}) &bull; TP 2: Batas Bawah ($${tp2.toFixed(2)})`,
          bodyRatioPercent: pct2,
          firstBodyRatioPercent: pct1,
          isFlipped: true,
          flippedFrom: 'BUY',
          invalidationReason: isWeakEntry 
            ? `Candle 5M masuk box lemah (body ${pct2}% < 50%)`
            : `Candle bullish masuk box langsung dibarengi candle bearish`,
        };
        break;
      }

      // KASUS NORMAL KUAT: BUY Valid (Bullish kuat >= 50% & tidak dibarengi bearish)
      if (isBullishCandle && analysis2.isStrong) {
        const breakoutLows = priorCandles.filter(p => p.low < box.bottom).map(p => p.low);
        const lowestBreakoutLow = breakoutLows.length > 0 
          ? Math.min(...breakoutLows, c1.low, c2.low) 
          : Math.min(c1.low, c2.low);
        const stopLoss = parseFloat((Math.min(lowestBreakoutLow, box.bottom) - buffer).toFixed(4));
        const risk = Math.max(entryPrice - stopLoss, entryPrice * 0.001);

        const tp1 = midPrice; // Garis Tengah Hitam
        const tp2 = parseFloat(box.top.toFixed(4)); // Batas Atas Box
        const tp3 = parseFloat((box.top + (box.top - midPrice)).toFixed(4));
        const rrRatio = parseFloat((Math.abs(tp1 - entryPrice) / Math.max(risk, 0.0001)).toFixed(2));

        const pct1 = Math.round(analysis1.bodyRatio * 100);
        const pct2 = Math.round(analysis2.bodyRatio * 100);

        signal = {
          id: `SIG-BUY-${symbol}-B${boxNumber}-${c2.time}`,
          type: 'BUY',
          symbol,
          timeframe: '5m',
          h4Box,
          targetBoxName,
          targetBoxNumber: boxNumber,
          triggerCandle: c2,
          firstConfirmCandle: c1,
          secondConfirmCandle: c2,
          confirmationCount: analysis1.direction === 'bullish' ? 2 : 1,
          entryPrice,
          stopLoss,
          takeProfit1: tp1,
          takeProfit2: tp2,
          takeProfit3: tp3,
          riskRewardRatio: rrRatio > 0 ? rrRatio : 2.5,
          setupType: `Lilin 5M Masuk Box H4 #${boxNumber} ➔ Sinyal BUY (TP1: Garis Tengah, TP2: Box Atas)`,
          explanation: `Candle 5M Bullish Kuat (${pct2}% body @ ${c2.timeString}) berhasil masuk ke dalam ${targetBoxName} ($${box.bottom.toFixed(2)} - $${box.top.toFixed(2)}) dari bawah. Target TP 1 berada pada Garis Tengah Hitam ($${tp1.toFixed(2)}) dan TP 2 pada Batas Atas Box ($${tp2.toFixed(2)}).`,
          timestamp: c2.time,
          status: 'active',
          confirmation: `Lilin 5M Masuk Box #${boxNumber} ➔ TP 1: Garis Tengah ($${tp1.toFixed(2)}) &bull; TP 2: Box Atas ($${tp2.toFixed(2)})`,
          bodyRatioPercent: pct2,
          firstBodyRatioPercent: pct1,
        };
        break;
      }
    }

    // ==========================================
    // 2. SKENARIO MASUK DARI ATAS (POTENSI AWAL SELL)
    // ==========================================
    if (!signal && isEnteringFromAbove) {
      const isWeakEntry = !analysis2.isStrong || analysis2.bodyRatio < 0.50 || analysis2.direction === 'doji';
      const isBearishPairedWithBullish = 
        (analysis1.direction === 'bearish' && (analysis2.direction === 'bullish' || c2.close > c2.open)) ||
        (isBearishCandle && (c2.close > c1.close || c2.close - c2.low > (c2.high - c2.low) * 0.5));

      // ATURAN MEMORY USER: Jika candle masuk box WEAK atau lilin bearish dibarengi lilin bullish:
      // => Signal SELL = CANCEL dan Signal BERUBAH MENJADI BUY!
      if (isWeakEntry || isBearishPairedWithBullish) {
        const breakoutLows = priorCandles.filter(p => p.low < box.bottom).map(p => p.low);
        const lowestLow = Math.min(...breakoutLows, c1.low, c2.low, box.bottom);
        const stopLoss = parseFloat((lowestLow - buffer).toFixed(4));
        const risk = Math.max(entryPrice - stopLoss, entryPrice * 0.001);

        const tp1 = midPrice; // Garis Tengah Hitam
        const tp2 = parseFloat(box.top.toFixed(4)); // Batas Atas Box
        const tp3 = parseFloat((box.top + (box.top - midPrice)).toFixed(4));
        const rrRatio = parseFloat((Math.abs(tp1 - entryPrice) / Math.max(risk, 0.0001)).toFixed(2));

        const pct1 = Math.round(analysis1.bodyRatio * 100);
        const pct2 = Math.round(analysis2.bodyRatio * 100);

        signal = {
          id: `SIG-FLIP-BUY-${symbol}-B${boxNumber}-${c2.time}`,
          type: 'BUY',
          symbol,
          timeframe: '5m',
          h4Box,
          targetBoxName,
          targetBoxNumber: boxNumber,
          triggerCandle: c2,
          firstConfirmCandle: c1,
          secondConfirmCandle: c2,
          confirmationCount: 1,
          entryPrice,
          stopLoss,
          takeProfit1: tp1,
          takeProfit2: tp2,
          takeProfit3: tp3,
          riskRewardRatio: rrRatio > 0 ? rrRatio : 2.5,
          setupType: `⚠️ SELL DIBATALKAN ➔ BERUBAH MENJADI BUY (Lilin Masuk Lemah / Dibalas Bullish)`,
          explanation: `Candle 5M mencoba masuk Box H4 #${boxNumber} dari atas, namun terdeteksi WEAK (${pct2}% body) atau candle bearish langsung dibarengi candle bullish penolakan. Sinyal SELL otomatis DICANCEL dan berbalik menjadi BUY. Target TP 1: Garis Tengah ($${tp1.toFixed(2)}), TP 2: Batas Atas Box ($${tp2.toFixed(2)}).`,
          timestamp: c2.time,
          status: 'active',
          confirmation: `⚠️ SELL CANCEL ➔ FLIP BUY (${isWeakEntry ? 'Candle Lemah <50%' : 'Bearish Dibalas Bullish'}) &bull; TP 1: Garis Tengah ($${tp1.toFixed(2)}) &bull; TP 2: Batas Atas ($${tp2.toFixed(2)})`,
          bodyRatioPercent: pct2,
          firstBodyRatioPercent: pct1,
          isFlipped: true,
          flippedFrom: 'SELL',
          invalidationReason: isWeakEntry 
            ? `Candle 5M masuk box lemah (body ${pct2}% < 50%)`
            : `Candle bearish masuk box langsung dibarengi candle bullish`,
        };
        break;
      }

      // KASUS NORMAL KUAT: SELL Valid (Bearish kuat >= 50% & tidak dibarengi bullish)
      if (isBearishCandle && analysis2.isStrong) {
        const breakoutHighs = priorCandles.filter(p => p.high > box.top).map(p => p.high);
        const highestBreakoutHigh = breakoutHighs.length > 0 
          ? Math.max(...breakoutHighs, c1.high, c2.high) 
          : Math.max(c1.high, c2.high);
        const stopLoss = parseFloat((Math.max(highestBreakoutHigh, box.top) + buffer).toFixed(4));
        const risk = Math.max(stopLoss - entryPrice, entryPrice * 0.001);

        const tp1 = midPrice; // Garis Tengah Hitam
        const tp2 = parseFloat(box.bottom.toFixed(4)); // Batas Bawah Box
        const tp3 = parseFloat((box.bottom - (midPrice - box.bottom)).toFixed(4));
        const rrRatio = parseFloat((Math.abs(entryPrice - tp1) / Math.max(risk, 0.0001)).toFixed(2));

        const pct1 = Math.round(analysis1.bodyRatio * 100);
        const pct2 = Math.round(analysis2.bodyRatio * 100);

        signal = {
          id: `SIG-SELL-${symbol}-B${boxNumber}-${c2.time}`,
          type: 'SELL',
          symbol,
          timeframe: '5m',
          h4Box,
          targetBoxName,
          targetBoxNumber: boxNumber,
          triggerCandle: c2,
          firstConfirmCandle: c1,
          secondConfirmCandle: c2,
          confirmationCount: analysis1.direction === 'bearish' ? 2 : 1,
          entryPrice,
          stopLoss,
          takeProfit1: tp1,
          takeProfit2: tp2,
          takeProfit3: tp3,
          riskRewardRatio: rrRatio > 0 ? rrRatio : 2.5,
          setupType: `Lilin 5M Masuk Box H4 #${boxNumber} ➔ Sinyal SELL (TP1: Garis Tengah, TP2: Box Bawah)`,
          explanation: `Candle 5M Bearish Kuat (${pct2}% body @ ${c2.timeString}) berhasil masuk ke dalam ${targetBoxName} ($${box.bottom.toFixed(2)} - $${box.top.toFixed(2)}) dari atas. Target TP 1 berada pada Garis Tengah Hitam ($${tp1.toFixed(2)}) dan TP 2 pada Batas Bawah Box ($${tp2.toFixed(2)}).`,
          timestamp: c2.time,
          status: 'active',
          confirmation: `Lilin 5M Masuk Box #${boxNumber} ➔ TP 1: Garis Tengah ($${tp1.toFixed(2)}) &bull; TP 2: Box Bawah ($${tp2.toFixed(2)})`,
          bodyRatioPercent: pct2,
          firstBodyRatioPercent: pct1,
        };
        break;
      }
    }
  }

  return { signal, latestAnalysis };
}

/**
 * Scans H4 candles (Box Lilin #2 & Box Lilin #3) and 5M candles:
 * Produces separate signals for Chart 2 (Box #2) and Chart 3 (Box #3).
 */
export function scanH4BoxAnd5m(
  symbol: string,
  h4Candles: Candle[],
  fiveMinCandles: Candle[]
): ScanResult {
  const h4Box = calculateH4Box(h4Candles);

  if (!h4Box || !fiveMinCandles || fiveMinCandles.length === 0) {
    return {
      symbol,
      h4Box,
      h4Candles,
      fiveMinCandles,
      latest5mAnalysis: null,
      latest5mAnalysisBox2: null,
      latest5mAnalysisBox3: null,
      activeSignal: null,
      signalBox2: null,
      signalBox3: null,
      trend: 'sideways',
      scannedAt: Date.now(),
    };
  }

  // Scan specifically for Box Lilin #2 (Chart 2)
  const resBox2 = scanSpecificBox(symbol, h4Box.box2, h4Box, fiveMinCandles, 2);

  // Scan specifically for Box Lilin #3 (Chart 3)
  const resBox3 = scanSpecificBox(symbol, h4Box.box3, h4Box, fiveMinCandles, 3);

  // Determine overall trend from H4 Box & recent closes
  const lastH4 = h4Candles[h4Candles.length - 1];
  const trend: 'bullish' | 'bearish' | 'sideways' =
    lastH4.close > h4Box.box2.top ? 'bullish' : lastH4.close < h4Box.box2.bottom ? 'bearish' : 'sideways';

  const activeSignal = resBox2.signal || resBox3.signal || null;

  return {
    symbol,
    h4Box,
    h4Candles,
    fiveMinCandles,
    latest5mAnalysis: resBox2.latestAnalysis || resBox3.latestAnalysis,
    latest5mAnalysisBox2: resBox2.latestAnalysis,
    latest5mAnalysisBox3: resBox3.latestAnalysis,
    activeSignal,
    signalBox2: resBox2.signal,
    signalBox3: resBox3.signal,
    trend,
    scannedAt: Date.now(),
  };
}

/**
 * Generate realistic synthetic candles for H4 and 5M for testing & simulation
 * Supports 2-Candle Strong Confirmation (Lilin Konfirmasi #1 & #2)
 */
export function generateMockPair(type: 'buy_retest' | 'sell_retest' | 'neutral', countH4 = 40, count5m = 60): { h4: Candle[]; fiveM: Candle[] } {
  const now = Date.now();
  const h4Interval = 4 * 60 * 60 * 1000;
  const m5Interval = 5 * 60 * 1000;

  const basePrice = 67500;
  const h4Candles: Candle[] = [];

  let current = basePrice;
  const startH4 = now - countH4 * h4Interval;

  for (let i = 0; i < countH4; i++) {
    const t = startH4 + i * h4Interval;
    const isC2 = i === countH4 - 2;
    const isC3 = i === countH4 - 3;

    let delta = (Math.random() - 0.48) * 300;
    if (isC3) delta = type === 'buy_retest' ? 450 : -450;
    if (isC2) delta = type === 'buy_retest' ? 380 : -380;

    const open = current;
    const close = open + delta;
    const high = Math.max(open, close) + Math.random() * 150;
    const low = Math.min(open, close) - Math.random() * 150;

    h4Candles.push({
      time: t,
      timeString: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 400) + 100,
    });
    current = close;
  }

  const h4Box = calculateH4Box(h4Candles);
  const fiveMCandles: Candle[] = [];
  const start5m = now - count5m * m5Interval;

  let p5m = type === 'buy_retest' ? (h4Box ? h4Box.bottom - 80 : basePrice - 100) : (h4Box ? h4Box.top + 80 : basePrice + 100);

  for (let i = 0; i < count5m; i++) {
    const t = start5m + i * m5Interval;
    const isBreakout1 = i === count5m - 4;
    const isBreakout2 = i === count5m - 3;
    const isReentryC1 = i === count5m - 2; // Lilin Konfirmasi #1 (Bullish/Bearish Kuat)
    const isReentryC2 = i === count5m - 1; // Lilin Konfirmasi #2 (Bullish/Bearish Kuat - Trigger Entry)

    if (h4Box && type === 'buy_retest') {
      if (isBreakout1) {
        // Candle breaks out below H4 Box
        const open = h4Box.bottom + 10;
        const close = h4Box.bottom - 45;
        const high = open + 5;
        const low = close - 15;
        fiveMCandles.push({
          time: t,
          timeString: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: 290,
        });
        continue;
      }
      if (isBreakout2) {
        // Candle stays outside below H4 Box (liquidity sweep)
        const open = h4Box.bottom - 40;
        const close = h4Box.bottom - 60;
        const high = open + 5;
        const low = close - 20;
        fiveMCandles.push({
          time: t,
          timeString: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: 340,
        });
        continue;
      }
      if (isReentryC1) {
        // Lilin 1: Strong Bullish Candle re-entering H4 Box with 80% body ratio
        const open = h4Box.bottom - 50;
        const close = h4Box.bottom + 20;
        const high = close + 8;
        const low = open - 6;
        fiveMCandles.push({
          time: t,
          timeString: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: 480,
        });
        continue;
      }
      if (isReentryC2) {
        // Lilin 2: Strong Bullish Candle confirming re-entry with 85% body ratio
        const open = h4Box.bottom + 20;
        const close = h4Box.bottom + 95;
        const high = close + 10;
        const low = open - 5;
        fiveMCandles.push({
          time: t,
          timeString: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: 560,
        });
        continue;
      }
    } else if (h4Box && type === 'sell_retest') {
      if (isBreakout1) {
        // Candle breaks out above H4 Box
        const open = h4Box.top - 10;
        const close = h4Box.top + 45;
        const high = close + 15;
        const low = open - 5;
        fiveMCandles.push({
          time: t,
          timeString: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: 290,
        });
        continue;
      }
      if (isBreakout2) {
        // Candle stays outside above H4 Box (liquidity sweep)
        const open = h4Box.top + 40;
        const close = h4Box.top + 60;
        const high = close + 20;
        const low = open - 5;
        fiveMCandles.push({
          time: t,
          timeString: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: 340,
        });
        continue;
      }
      if (isReentryC1) {
        // Lilin 1: Strong Bearish Candle re-entering H4 Box with 80% body ratio
        const open = h4Box.top + 50;
        const close = h4Box.top - 20;
        const high = open + 6;
        const low = close - 8;
        fiveMCandles.push({
          time: t,
          timeString: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: 490,
        });
        continue;
      }
      if (isReentryC2) {
        // Lilin 2: Strong Bearish Candle confirming re-entry with 85% body ratio
        const open = h4Box.top - 20;
        const close = h4Box.top - 95;
        const high = open + 5;
        const low = close - 10;
        fiveMCandles.push({
          time: t,
          timeString: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: 570,
        });
        continue;
      }
    }

    const open = p5m;
    const close = open + (Math.random() - 0.49) * 40;
    const high = Math.max(open, close) + Math.random() * 20;
    const low = Math.min(open, close) - Math.random() * 20;

    fiveMCandles.push({
      time: t,
      timeString: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 150) + 40,
    });
    p5m = close;
  }

  return { h4: h4Candles, fiveM: fiveMCandles };
}
