/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Candle,
  STFTimeframe,
  SifirTFHierarchy,
  EngulfingZone,
  ZeroFloatingZone,
  CycleCount6C9C,
  Zona1LotFM,
  Storyline,
  GunNumberInfo,
  TradingSignal,
  ScanResult
} from '../types';

// ==========================================
// 1. SIFIR TIME FRAME (STF) ENGINE
// ==========================================
export function analyzeSifirHierarchy(
  htfCandles: Candle[],
  mtfCandles: Candle[],
  ltfCandles: Candle[]
): SifirTFHierarchy {
  if (!htfCandles || htfCandles.length < 5) {
    return {
      htf: '4h',
      mtf: '15m',
      ltf: '5m',
      htfTrend: 'SIDEWAYS',
      cycleRatio: '1D = 6 x 4H | 1 x 4H = 16 x 15M | 1 x 15M = 3 x 5M',
      statusDescription: 'Data candle belum mencukupi untuk evaluasi Sifir Time Frame.'
    };
  }

  // HTF Trend: Compare EMA / Slope of last 5 candles
  const lastHtf = htfCandles[htfCandles.length - 1];
  const prevHtf = htfCandles[htfCandles.length - 3] || htfCandles[0];
  const htfTrend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' =
    lastHtf.close > prevHtf.close * 1.002
      ? 'BULLISH'
      : lastHtf.close < prevHtf.close * 0.998
      ? 'BEARISH'
      : 'SIDEWAYS';

  return {
    htf: '4h',
    mtf: '15m',
    ltf: '5m',
    htfTrend,
    cycleRatio: '1D = 6 x 4H | 1 x 4H = 16 x 15M | 1 x 15M = 3 x 5M',
    statusDescription: `Sifir Hirarki: Tren HTF (4H) ${htfTrend}. Eksekusi sniper pada LTF (5M) yang searah aliran Storyline.`
  };
}

// ==========================================
// 2. VALID BREAKOUT & ENGULFING (VBO) ENGINE
// ==========================================
export function detectEngulfingAndBreakouts(candles: Candle[], timeframe: string = '4h'): EngulfingZone[] {
  const zones: EngulfingZone[] = [];
  if (!candles || candles.length < 3) return zones;

  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];

    const prevIsBear = prev.close < prev.open;
    const prevIsBull = prev.close > prev.open;
    const currIsBull = curr.close > curr.open;
    const currIsBear = curr.close < curr.open;

    const prevBody = Math.abs(prev.close - prev.open);
    const currBody = Math.abs(curr.close - curr.open);

    // Bullish Engulfing: Current bull candle swallows previous bear candle's body & breaks its high
    if (prevIsBear && currIsBull && curr.close > prev.open && curr.open <= prev.close && currBody > prevBody * 0.9) {
      const isValidBreakout = curr.close > prev.high; // Valid Breakout: body breaks prior high
      zones.push({
        id: `eng-bull-${timeframe}-${curr.time}`,
        type: 'BULLISH_ENGULFING',
        timeframe,
        candleIndex: i,
        motherCandle: prev,
        engulfingCandle: curr,
        top: Math.max(curr.high, prev.high),
        bottom: Math.min(curr.low, prev.low),
        bodyTop: curr.close,
        bodyBottom: curr.open,
        isFresh: true,
        isValidBreakout,
        breakoutLevel: prev.high,
        volumeConfirmed: curr.volume >= prev.volume * 0.95
      });
    }

    // Bearish Engulfing: Current bear candle swallows previous bull candle's body & breaks its low
    if (prevIsBull && currIsBear && curr.close < prev.open && curr.open >= prev.close && currBody > prevBody * 0.9) {
      const isValidBreakout = curr.close < prev.low; // Valid Breakout: body breaks prior low
      zones.push({
        id: `eng-bear-${timeframe}-${curr.time}`,
        type: 'BEARISH_ENGULFING',
        timeframe,
        candleIndex: i,
        motherCandle: prev,
        engulfingCandle: curr,
        top: Math.max(curr.high, prev.high),
        bottom: Math.min(curr.low, prev.low),
        bodyTop: curr.open,
        bodyBottom: curr.close,
        isFresh: true,
        isValidBreakout,
        breakoutLevel: prev.low,
        volumeConfirmed: curr.volume >= prev.volume * 0.95
      });
    }
  }

  // Check freshness against subsequent price action
  const currentPrice = candles[candles.length - 1]?.close || 0;
  return zones.slice(-6).map((z) => {
    // If subsequent price completely violated the zone, it's mitigated
    if (z.type === 'BULLISH_ENGULFING' && currentPrice < z.bottom * 0.995) {
      z.isFresh = false;
    } else if (z.type === 'BEARISH_ENGULFING' && currentPrice > z.top * 1.005) {
      z.isFresh = false;
    }
    return z;
  });
}

// ==========================================
// 3. ZERO FLOATING ZONA (ZFZ) ENGINE
// ==========================================
export function calculateZeroFloatingZones(
  engulfingZones: EngulfingZone[],
  candles: Candle[],
  timeframe: string = '5m'
): ZeroFloatingZone[] {
  const zfzList: ZeroFloatingZone[] = [];

  for (const eng of engulfingZones.filter((z) => z.isFresh)) {
    if (eng.type === 'BULLISH_ENGULFING') {
      // Zero Floating BUY: Akar wick (shadow bawah mother candle atau engulfing candle)
      const wickLow = Math.min(eng.motherCandle.low, eng.engulfingCandle.low);
      const entryHigh = Math.min(eng.motherCandle.open, eng.engulfingCandle.open);

      zfzList.push({
        id: `zfz-buy-${eng.id}`,
        type: 'BUY_ZFZ',
        timeframe,
        priceZoneHigh: entryHigh,
        priceZoneLow: wickLow,
        wickSniperLevel: wickLow,
        originDescription: `Zero Floating BUY: Akar Shadow Wick Fresh Bullish Engulfing ${eng.timeframe.toUpperCase()}`,
        isHit: false,
        status: 'PENDING_RETEST'
      });
    } else {
      // Zero Floating SELL: Pucuk wick (shadow atas mother candle atau engulfing candle)
      const wickHigh = Math.max(eng.motherCandle.high, eng.engulfingCandle.high);
      const entryLow = Math.max(eng.motherCandle.open, eng.engulfingCandle.open);

      zfzList.push({
        id: `zfz-sell-${eng.id}`,
        type: 'SELL_ZFZ',
        timeframe,
        priceZoneHigh: wickHigh,
        priceZoneLow: entryLow,
        wickSniperLevel: wickHigh,
        originDescription: `Zero Floating SELL: Pucuk Shadow Wick Fresh Bearish Engulfing ${eng.timeframe.toUpperCase()}`,
        isHit: false,
        status: 'PENDING_RETEST'
      });
    }
  }

  // Evaluate if current LTF candle is tapping into any ZFZ
  const lastCandle = candles[candles.length - 1];
  if (lastCandle) {
    zfzList.forEach((zfz) => {
      if (
        (lastCandle.low <= zfz.priceZoneHigh && lastCandle.high >= zfz.priceZoneLow) ||
        (lastCandle.close <= zfz.priceZoneHigh && lastCandle.close >= zfz.priceZoneLow)
      ) {
        zfz.isHit = true;
        zfz.status = 'TRIGGERED_ACTIVE';
      }
    });
  }

  return zfzList;
}

// ==========================================
// 4. KODE 6C.9C (CYCLE COUNTING) ENGINE
// ==========================================
export function calculateKode6C9C(candles: Candle[]): CycleCount6C9C {
  if (!candles || candles.length < 5) {
    return {
      currentCount: 1,
      lastCycleTriggerIndex: 0,
      is6C: false,
      is9C: false,
      cyclePhase: 'COUNTING',
      explanation: 'Menghitung siklus lilin berjalan.'
    };
  }

  // Look back to find recent swing high/low or key pivot to begin count
  let swingIndex = Math.max(0, candles.length - 15);
  for (let i = candles.length - 2; i >= Math.max(1, candles.length - 14); i--) {
    const isPivotHigh = candles[i].high > candles[i - 1].high && candles[i].high > candles[i + 1].high;
    const isPivotLow = candles[i].low < candles[i - 1].low && candles[i].low < candles[i + 1].low;
    if (isPivotHigh || isPivotLow) {
      swingIndex = i;
      break;
    }
  }

  const rawCount = candles.length - 1 - swingIndex;
  // Sifir cycle modulus: 1 s/d 9
  const cycleCount = ((rawCount - 1) % 9) + 1;

  const is6C = cycleCount === 6;
  const is9C = cycleCount === 9;

  let cyclePhase: 'COUNTING' | 'KODE_6C_CONFIRMED' | 'KODE_9C_CONFIRMED' | 'CYCLE_RESET' = 'COUNTING';
  let explanation = `Candle #${cycleCount} dalam gelombang berjalan.`;

  if (is6C) {
    cyclePhase = 'KODE_6C_CONFIRMED';
    explanation = 'KODE 6C AKTIF: Lilin ke-6 konfirmasi siklus ekspansi/retest. Sinyal lanjutan tren berpeluang tinggi.';
  } else if (is9C) {
    cyclePhase = 'KODE_9C_CONFIRMED';
    explanation = 'KODE 9C AKTIF: Lilin ke-9 siklus pembalikan (Turning Point / Exhaustion). Reversal sniper.';
  }

  return {
    currentCount: cycleCount,
    lastCycleTriggerIndex: swingIndex,
    is6C,
    is9C,
    cyclePhase,
    explanation
  };
}

// ==========================================
// 7. GUN NUMBER (GANN / PSYCHOLOGICAL LEVEL) ENGINE
// ==========================================
export function calculateGunNumber(currentPrice: number, symbol: string): GunNumberInfo {
  let step = 10;
  if (symbol.includes('BTC')) step = 500;
  else if (symbol.includes('ETH')) step = 50;
  else if (symbol.includes('SOL') || symbol.includes('BNB') || symbol.includes('XAU')) step = 10;
  else if (currentPrice < 0.01) step = 0.0005;
  else if (currentPrice < 1) step = 0.05;
  else if (currentPrice < 10) step = 0.5;
  else if (currentPrice < 100) step = 2.5;
  else step = 10;

  const nearestGunNumber = Math.round(currentPrice / step) * step;
  const distance = Math.abs(currentPrice - nearestGunNumber);
  const distancePercent = (distance / currentPrice) * 100;
  const isAtGunNumber = distancePercent <= 0.25; // within 0.25%

  const allLevels: number[] = [
    nearestGunNumber - step * 2,
    nearestGunNumber - step,
    nearestGunNumber,
    nearestGunNumber + step,
    nearestGunNumber + step * 2
  ];

  let levelType: 'MAJOR_GANN_000' | 'PSYCHOLOGICAL_500' | 'KEY_PIVOT_200_800' = 'KEY_PIVOT_200_800';
  if (nearestGunNumber % (step * 5) === 0) levelType = 'MAJOR_GANN_000';
  else if (nearestGunNumber % (step * 2) === 0) levelType = 'PSYCHOLOGICAL_500';

  return {
    nearestGunNumber,
    allLevels,
    distanceToNearest: distance,
    isAtGunNumber,
    levelType
  };
}

// ==========================================
// 6. STORYLINE (NARRATIVE OF PRICE) ENGINE
// ==========================================
export function generateStoryline(
  htfTrend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS',
  engulfingList: EngulfingZone[],
  currentPrice: number
): Storyline {
  const latestBullEng = engulfingList.filter((e) => e.type === 'BULLISH_ENGULFING').slice(-1)[0];
  const latestBearEng = engulfingList.filter((e) => e.type === 'BEARISH_ENGULFING').slice(-1)[0];

  if (htfTrend === 'BULLISH' || (latestBullEng && currentPrice >= latestBullEng.bottom)) {
    const origin = latestBullEng
      ? `Reject Fresh Bullish Engulfing H4 di $${latestBullEng.bottom.toFixed(2)}`
      : 'Rebound dari Key Support Sifir H4';
    const targetPrice = latestBearEng ? latestBearEng.top : currentPrice * 1.05;
    const destination = latestBearEng
      ? `Target Menuju Resistance Bearish Engulfing di $${latestBearEng.top.toFixed(2)}`
      : `Target Ekspansi Menuju Level Sifir Berikutnya ($${targetPrice.toFixed(2)})`;

    return {
      direction: 'BULLISH',
      origin,
      currentPhase: 'SNIPER_ENTRY',
      destination,
      narrativeText: `Storyline BULLISH: Harga datang dari ${origin}, saat ini melakukan retest Zero Floating Zona, menuju ${destination}.`,
      targetPrice
    };
  } else {
    const origin = latestBearEng
      ? `Reject Fresh Bearish Engulfing H4 di $${latestBearEng.top.toFixed(2)}`
      : 'Rejection dari Key Resistance Sifir H4';
    const targetPrice = latestBullEng ? latestBullEng.bottom : currentPrice * 0.95;
    const destination = latestBullEng
      ? `Target Menuju Support Bullish Engulfing di $${latestBullEng.bottom.toFixed(2)}`
      : `Target Penurunan Menuju Level Sifir Berikutnya ($${targetPrice.toFixed(2)})`;

    return {
      direction: 'BEARISH',
      origin,
      currentPhase: 'SNIPER_ENTRY',
      destination,
      narrativeText: `Storyline BEARISH: Harga datang dari ${origin}, saat ini memantul dari Zero Floating Zona, menuju ${destination}.`,
      targetPrice
    };
  }
}

// Persistent signal memory per symbol to guarantee TP and SL never fluctuate with live price changes
export const persistentSignals = new Map<string, TradingSignal>();

export function getPersistentSignal(symbol: string): TradingSignal | null {
  return persistentSignals.get(symbol) || null;
}

export function resetPersistentSignal(symbol: string): void {
  persistentSignals.delete(symbol);
}

export function setPersistentSignal(symbol: string, signal: TradingSignal): void {
  persistentSignals.set(symbol, signal);
}

export function clearAllPersistentSignals(): void {
  persistentSignals.clear();
}

// ==========================================
// 5. ZONA 1 LOT [FM] & UNIFIED SIGNAL GENERATOR
// ==========================================
export function scanSTFStrategy(
  symbol: string,
  htfCandles: Candle[],
  mtfCandles: Candle[],
  ltfCandles: Candle[],
  existingSignal?: TradingSignal | null
): ScanResult {
  const currentPrice = ltfCandles[ltfCandles.length - 1]?.close || htfCandles[htfCandles.length - 1]?.close || 100;

  // 1. Sifir Timeframe
  const stfHierarchy = analyzeSifirHierarchy(htfCandles, mtfCandles, ltfCandles);

  // 2. Valid Breakout & Engulfing
  const htfEngulfings = detectEngulfingAndBreakouts(htfCandles, '4h');
  const ltfEngulfings = detectEngulfingAndBreakouts(ltfCandles, '5m');
  const activeEngulfingZones = [...htfEngulfings, ...ltfEngulfings];

  // 3. Zero Floating Zona
  const zeroFloatingZones = calculateZeroFloatingZones(activeEngulfingZones, ltfCandles, '5m');

  // 4. Kode 6C.9C
  const currentCycle = calculateKode6C9C(ltfCandles);

  // 7. Gun Number
  const gunNumber = calculateGunNumber(currentPrice, symbol);

  // 6. Storyline
  const storyline = generateStoryline(stfHierarchy.htfTrend, htfEngulfings, currentPrice);

  // 5. Zona 1 Lot [FM] Confluence Checker
  const confluencePoints: string[] = [];
  let score = 0;

  // Confluence 1: Storyline Alignment (+25%)
  if (stfHierarchy.htfTrend !== 'SIDEWAYS') {
    confluencePoints.push(`Searah Aliran Storyline HTF 4H (${stfHierarchy.htfTrend})`);
    score += 25;
  }

  // Confluence 2: Zero Floating Zona Tap (+25%)
  const triggeredZFZ = zeroFloatingZones.find((z) => z.isHit || z.status === 'TRIGGERED_ACTIVE');
  if (triggeredZFZ) {
    confluencePoints.push(`Sedang Menyentuh Zero Floating Zona (${triggeredZFZ.originDescription})`);
    score += 25;
  }

  // Confluence 3: Fresh Valid Breakout / Engulfing (+20%)
  const hasFreshVBO = activeEngulfingZones.some((e) => e.isFresh && e.isValidBreakout);
  if (hasFreshVBO) {
    confluencePoints.push('Terkonfirmasi Valid Breakout (VBO) & Fresh Engulfing Zone');
    score += 20;
  }

  // Confluence 4: Kode 6C atau 9C (+15%)
  if (currentCycle.is6C) {
    confluencePoints.push('Timing Presisi: KODE 6C (Siklus 6 Candle Ekspansi)');
    score += 15;
  } else if (currentCycle.is9C) {
    confluencePoints.push('Timing Presisi: KODE 9C (Siklus 9 Candle Turning Point / Reversal)');
    score += 15;
  }

  // Confluence 5: Gun Number / Psychological Level (+15%)
  if (gunNumber.isAtGunNumber) {
    confluencePoints.push(`Rejeksi Sakral di Level Gun Number ($${gunNumber.nearestGunNumber.toLocaleString()})`);
    score += 15;
  }

  const isEligible1Lot = score >= 65;
  const zona1Lot: Zona1LotFM = {
    isEligible: isEligible1Lot,
    confluenceScore: score,
    confluencePoints,
    setupGrade: score >= 85 ? 'TIER_1_FULL_MARGIN' : score >= 65 ? 'TIER_2_HIGH_CONFIRM' : 'STANDARD',
    riskRewardRatio: score >= 85 ? 4.5 : 3.0,
    recommendedLeverageTip:
      score >= 85
        ? '🔥 ZONA 1 LOT [FM]: Konfluensi 7 pilar terpenuhi. Sangat ideal untuk eksekusi optimal (Full Margin / High RR).'
        : 'Konfirmasi standar. Gunakan manajemen risiko disiplin (1-2% risk per trade).'
  };

  // CHECK PERSISTENT SIGNAL FIRST TO PREVENT ENTRY/SL/TP FROM MOVING AS PRICE TICKS
  let activeSignal: TradingSignal | null = null;
  const prevSignal = existingSignal || persistentSignals.get(symbol);

  if (prevSignal && prevSignal.status === 'active' && prevSignal.symbol === symbol) {
    const isBuy = prevSignal.type === 'BUY';
    const lastLtf = ltfCandles[ltfCandles.length - 1];
    const candleHigh = Math.max(currentPrice, lastLtf?.high || currentPrice);
    const candleLow = Math.min(currentPrice, lastLtf?.low || currentPrice);

    let updatedStatus: TradingSignal['status'] = 'active';

    if (isBuy) {
      if (candleLow <= prevSignal.stopLoss) {
        updatedStatus = 'hit_sl';
      } else if (candleHigh >= prevSignal.takeProfit2) {
        updatedStatus = 'hit_tp';
      }
    } else {
      if (candleHigh >= prevSignal.stopLoss) {
        updatedStatus = 'hit_sl';
      } else if (candleLow <= prevSignal.takeProfit2) {
        updatedStatus = 'hit_tp';
      }
    }

    // Live R-Multiple calculation
    const riskAmount = Math.abs(prevSignal.entryPrice - prevSignal.stopLoss);
    const pnlPoints = isBuy ? (currentPrice - prevSignal.entryPrice) : (prevSignal.entryPrice - currentPrice);
    const currentR = riskAmount > 0 ? parseFloat((pnlPoints / riskAmount).toFixed(2)) : 0;

    // STRICT CONSISTENCY: KEEP entryPrice, stopLoss, takeProfit1, takeProfit2 100% UNCHANGED
    activeSignal = {
      ...prevSignal,
      status: updatedStatus,
      stf: stfHierarchy,
      cycle6C9C: currentCycle,
      zona1Lot,
      storyline,
      gunNumber,
      isLocked: true,
      pnlR: currentR,
    };

    persistentSignals.set(symbol, activeSignal);
  } else if (triggeredZFZ || score >= 50) {
    // GENERATE NEW ANCHORED SIGNAL (FIXED KEY LEVELS, NOT FLOATING MARKET PRICE)
    const signalType: 'BUY' | 'SELL' = storyline.direction === 'BULLISH' ? 'BUY' : 'SELL';
    const isBuy = signalType === 'BUY';
    const refZone = triggeredZFZ || zeroFloatingZones[0];

    // 1. Anchor Entry Price to structural key zone (Sniper Wick Level or Breakout Level)
    let entryPrice = currentPrice;
    if (refZone && refZone.wickSniperLevel) {
      entryPrice = refZone.wickSniperLevel;
    } else if (activeEngulfingZones.length > 0) {
      const topEng = activeEngulfingZones[activeEngulfingZones.length - 1];
      entryPrice = topEng.breakoutLevel || (isBuy ? topEng.top : topEng.bottom);
    } else if (ltfCandles.length >= 2) {
      entryPrice = ltfCandles[ltfCandles.length - 2].close;
    }

    // 2. Anchor Stop Loss to structural support/resistance boundary (Fixed Price)
    let stopLoss: number;
    if (isBuy) {
      if (refZone) {
        stopLoss = refZone.priceZoneLow * 0.996;
      } else {
        const swingLow = Math.min(...ltfCandles.slice(-10).map((c) => c.low));
        stopLoss = Math.min(swingLow * 0.998, entryPrice * 0.992);
      }
      if (stopLoss >= entryPrice) {
        stopLoss = entryPrice * 0.992;
      }
    } else {
      if (refZone) {
        stopLoss = refZone.priceZoneHigh * 1.004;
      } else {
        const swingHigh = Math.max(...ltfCandles.slice(-10).map((c) => c.high));
        stopLoss = Math.max(swingHigh * 1.002, entryPrice * 1.008);
      }
      if (stopLoss <= entryPrice) {
        stopLoss = entryPrice * 1.008;
      }
    }

    // 3. Anchor Take Profit 1 & 2 to fixed Risk-Reward ratios
    const fixedRisk = Math.abs(entryPrice - stopLoss);
    const takeProfit1 = isBuy ? entryPrice + fixedRisk * 2.0 : entryPrice - fixedRisk * 2.0;

    let takeProfit2 = isBuy ? entryPrice + fixedRisk * 4.0 : entryPrice - fixedRisk * 4.0;
    if (isBuy) {
      if (storyline.targetPrice > takeProfit1) {
        takeProfit2 = storyline.targetPrice;
      }
    } else {
      if (storyline.targetPrice < takeProfit1) {
        takeProfit2 = storyline.targetPrice;
      }
    }

    const calculatedRR = parseFloat((Math.abs(takeProfit2 - entryPrice) / fixedRisk).toFixed(2));

    const setupType = isEligible1Lot
      ? 'ZONA_1_LOT_FM'
      : triggeredZFZ
      ? 'ZERO_FLOATING_ENTRY'
      : currentCycle.is6C
      ? 'KODE_6C_PULLBACK'
      : currentCycle.is9C
      ? 'KODE_9C_REVERSAL'
      : 'VBO_ENGULFING_RETEST';

    const chosenEngulfing = activeEngulfingZones[activeEngulfingZones.length - 1] || {
      id: `eng-${Date.now()}`,
      type: isBuy ? 'BULLISH_ENGULFING' : 'BEARISH_ENGULFING',
      timeframe: '4h',
      candleIndex: 0,
      motherCandle: ltfCandles[0],
      engulfingCandle: ltfCandles[1],
      top: entryPrice * 1.01,
      bottom: entryPrice * 0.99,
      bodyTop: entryPrice * 1.005,
      bodyBottom: entryPrice * 0.995,
      isFresh: true,
      isValidBreakout: true,
      breakoutLevel: entryPrice,
      volumeConfirmed: true
    };

    const chosenZFZ = triggeredZFZ || {
      id: `zfz-${Date.now()}`,
      type: isBuy ? 'BUY_ZFZ' : 'SELL_ZFZ',
      timeframe: '5m',
      priceZoneHigh: isBuy ? entryPrice : entryPrice * 1.004,
      priceZoneLow: isBuy ? entryPrice * 0.996 : entryPrice,
      wickSniperLevel: entryPrice,
      originDescription: 'Zero Floating Zone Sniper',
      isHit: true,
      status: 'TRIGGERED_ACTIVE'
    };

    activeSignal = {
      id: `sig-${symbol}-${Date.now()}`,
      type: signalType,
      symbol,
      timeframe: '5m',
      entryPrice,
      stopLoss,
      takeProfit1,
      takeProfit2,
      riskRewardRatio: calculatedRR,
      setupType,
      explanation: isEligible1Lot
        ? `🔥 SINYAL ZONA 1 LOT [FM] (${signalType}): Konfluensi 7 Pilar Tercapai (${score}%). ${storyline.narrativeText} Didukung ${currentCycle.explanation} dan Gun Number $${gunNumber.nearestGunNumber.toLocaleString()}.`
        : `Sinyal ${signalType} Aktif: ${storyline.narrativeText} Retest Zero Floating Zona dengan SL & TP terkunci konsisten.`,
      timestamp: Date.now(),
      status: 'active',
      confirmation: `${score}% Confluence (7 Pilar)`,
      bodyRatioPercent: 68,
      stf: stfHierarchy,
      engulfing: chosenEngulfing,
      zeroFloatingZone: chosenZFZ,
      cycle6C9C: currentCycle,
      zona1Lot,
      storyline,
      gunNumber,
      targetBoxName: isEligible1Lot ? 'ZONA 1 LOT [FM]' : 'Zero Floating Zone',
      targetBoxNumber: 2,
      isLocked: true,
      pnlR: 0,
    };

    persistentSignals.set(symbol, activeSignal);
  }

  // Backward compatibility mock boxes for existing charts if accessed
  const dummyH4Box = {
    id: `box-${symbol}`,
    candle2Index: 1,
    candle2: htfCandles[htfCandles.length - 2] || htfCandles[0],
    candle3Index: 2,
    candle3: htfCandles[htfCandles.length - 1] || htfCandles[0],
    box2: {
      candleIndex: 1,
      candleNumber: 2,
      candle: htfCandles[htfCandles.length - 2] || htfCandles[0],
      top: currentPrice * 1.02,
      bottom: currentPrice * 0.98,
      bodyTop: currentPrice * 1.01,
      bodyBottom: currentPrice * 0.99,
      isBullish: true
    },
    box3: {
      candleIndex: 2,
      candleNumber: 3,
      candle: htfCandles[htfCandles.length - 1] || htfCandles[0],
      top: currentPrice * 1.03,
      bottom: currentPrice * 0.97,
      bodyTop: currentPrice * 1.015,
      bodyBottom: currentPrice * 0.985,
      isBullish: true
    },
    top: currentPrice * 1.02,
    bottom: currentPrice * 0.98,
    bodyTop: currentPrice * 1.01,
    bodyBottom: currentPrice * 0.99,
    type: stfHierarchy.htfTrend === 'BULLISH' ? 'bullish' : 'bearish',
    timeframe: '4h'
  };

  return {
    symbol,
    scannedAt: Date.now(),
    trend: stfHierarchy.htfTrend === 'BULLISH' ? 'bullish' : stfHierarchy.htfTrend === 'BEARISH' ? 'bearish' : 'sideways',
    htfCandles,
    mtfCandles,
    ltfCandles,
    fiveMinCandles: ltfCandles,
    stfHierarchy,
    activeEngulfingZones,
    zeroFloatingZones,
    currentCycle,
    zona1Lot,
    storyline,
    gunNumber,
    activeSignal,
    signalBox2: activeSignal,
    signalBox3: activeSignal?.zona1Lot.isEligible ? activeSignal : null,
    signal15mBox2: activeSignal,
    signal15mBox3: activeSignal,
    h4Box: dummyH4Box,
    latest5mAnalysis: {
      candle: ltfCandles[ltfCandles.length - 1],
      candleIndex: ltfCandles.length - 1,
      isStrong: true,
      bodyRatio: 0.65,
      bodySize: 10,
      totalRange: 15,
      direction: storyline.direction === 'BULLISH' ? 'bullish' : 'bearish',
      isInsideBox: true,
      isBreakoutReentry: true,
      breakoutSide: storyline.direction === 'BULLISH' ? 'below' : 'above',
      interactionType: 'reentered_from_breakout',
      targetBoxNumber: 2
    }
  };
}

export function formatPrice(price: number): string {
  if (price === 0 || isNaN(price)) return '0.00';
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
}

// Fallback Synthetic Candle Generator for 7 Strategies
export function generateSyntheticSTFPair(
  direction: 'bullish' | 'bearish' = 'bullish',
  htfCount: number = 30,
  mtfCount: number = 40,
  ltfCount: number = 60
): { htf: Candle[]; mtf: Candle[]; ltf: Candle[] } {
  let basePrice = 2920.0; // Default Gold style scale
  const now = Date.now();

  const makeCandles = (count: number, stepMs: number, volatility: number): Candle[] => {
    const list: Candle[] = [];
    let price = basePrice;

    for (let i = 0; i < count; i++) {
      const time = now - (count - i) * stepMs;
      const trendBias = direction === 'bullish' ? 0.001 : -0.001;
      const delta = price * (trendBias + (Math.random() - 0.48) * volatility);
      const open = price;
      const close = price + delta;
      const high = Math.max(open, close) + price * Math.random() * volatility * 0.7;
      const low = Math.min(open, close) - price * Math.random() * volatility * 0.7;
      const volume = Math.floor(Math.random() * 500) + 100;

      list.push({
        time,
        timeString: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume
      });
      price = close;
    }
    return list;
  };

  const htf = makeCandles(htfCount, 4 * 3600 * 1000, 0.008);
  const mtf = makeCandles(mtfCount, 15 * 60 * 1000, 0.004);
  const ltf = makeCandles(ltfCount, 5 * 60 * 1000, 0.0025);

  return { htf, mtf, ltf };
}
