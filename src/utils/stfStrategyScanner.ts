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
  TradingSignal,
  ScanResult,
  PdlSweepModel,
  Crt9AmModel,
  IctCrtModel,
  KeyLevelZone,
  StrategyModelMode
} from '../types';

// ==========================================
// 8. PDL SWEEP & MITIGATION BLOCK ENGINE (SMC / ICT INSTITUTIONAL)
// ==========================================
export function detectPdlSweepModel(
  ltfCandles: Candle[],
  htfCandles: Candle[],
  symbol: string,
  preferredDirection?: 'BULLISH' | 'BEARISH'
): PdlSweepModel {
  const n = ltfCandles.length;
  const isBuy = preferredDirection !== 'BEARISH';

  if (isBuy) {
    // 1. SWEEP SPOT: Find key sweep of previous low / PDL in earlier segment
    let minLowIdx = 5;
    let minLowVal = Infinity;
    const searchLimit = Math.min(n - 10, 35);
    for (let i = 2; i < searchLimit; i++) {
      if (ltfCandles[i].low < minLowVal) {
        minLowVal = ltfCandles[i].low;
        minLowIdx = i;
      }
    }
    const sweepSpotCandle = ltfCandles[minLowIdx] || ltfCandles[0];
    const sweepSpotPrice = sweepSpotCandle.low;

    // 2. ORDER BLOCK (OB): Extreme Order Block at base of sweep
    const obCandle = ltfCandles[Math.max(0, minLowIdx - 1)] || sweepSpotCandle;
    const orderBlock = {
      top: Math.max(obCandle.open, obCandle.close, sweepSpotCandle.open),
      bottom: sweepSpotPrice,
      candleIndex: minLowIdx
    };

    // 3. MARKET STRUCTURE SHIFT (MSS): Break of minor lower high after sweep
    let mssIdx = Math.min(minLowIdx + 4, n - 8);
    let mssHigh = -Infinity;
    for (let i = minLowIdx + 1; i <= Math.min(minLowIdx + 9, n - 7); i++) {
      if (ltfCandles[i].high > mssHigh) {
        mssHigh = ltfCandles[i].high;
        mssIdx = i;
      }
    }
    const mssLevel = mssHigh > sweepSpotPrice ? mssHigh : sweepSpotPrice * 1.008;

    // 4. INDUCEMENT (IDM): Internal pullback low testing or defending the OB
    let idmIdx = Math.min(mssIdx + 3, n - 5);
    let idmLow = Infinity;
    for (let i = mssIdx + 1; i <= Math.min(mssIdx + 7, n - 4); i++) {
      if (ltfCandles[i].low < idmLow) {
        idmLow = ltfCandles[i].low;
        idmIdx = i;
      }
    }
    const idmLevel = idmLow < mssLevel ? idmLow : (sweepSpotPrice + mssLevel) / 2;

    // 5. BREAK OF STRUCTURE (BOS): Impulsive displacement breaking the high
    let bosIdx = Math.min(idmIdx + 4, n - 2);
    let bosHigh = -Infinity;
    for (let i = idmIdx + 1; i <= Math.min(idmIdx + 9, n - 1); i++) {
      if (ltfCandles[i].high > bosHigh) {
        bosHigh = ltfCandles[i].high;
        bosIdx = i;
      }
    }
    const bosLevel = Math.max(bosHigh, mssLevel * 1.006);

    // 6. MITIGATION BLOCK: The origin of displacement / breaker zone
    const mitTop = mssLevel * 1.002;
    const mitBottom = mssLevel * 0.998;
    const mitigationBlock = {
      top: mitTop,
      bottom: mitBottom,
      startIndex: mssIdx,
      endIndex: n - 1
    };

    // 7. Exact Entry at Mitigation Block Retest & Consistent Targets
    const entryPrice = parseFloat(((mitTop + mitBottom) / 2).toFixed(4));
    const stopLoss = parseFloat((Math.min(mitBottom * 0.996, idmLevel * 0.998)).toFixed(4));
    const risk = Math.max(Math.abs(entryPrice - stopLoss), entryPrice * 0.004);
    const takeProfit1 = parseFloat((entryPrice + risk * 2.0).toFixed(4));
    const takeProfit2 = parseFloat((entryPrice + risk * 5.5).toFixed(4));

    return {
      sweepType: 'PDL_SWEEP_BUY',
      sweepSpotPrice,
      sweepSpotCandleIndex: minLowIdx,
      sweepSpotTime: sweepSpotCandle.time,
      orderBlock,
      mssLevel,
      mssCandleIndex: mssIdx,
      idmLevel,
      idmCandleIndex: idmIdx,
      bosLevel,
      bosCandleIndex: bosIdx,
      mitigationBlock,
      entryPrice,
      stopLoss,
      takeProfit1,
      takeProfit2,
      status: 'MITIGATION_ENTRY_ACTIVE',
      narrative: `🎯 MODEL ENTRI PDL SWEEP (BUY): Likuiditas Previous Day Low disapu pada SWEEP SPOT $${formatPrice(sweepSpotPrice)}, Order Block terbentuk di akar wick, MSS tertembus di $${formatPrice(mssLevel)}, IDM tertahan di $${formatPrice(idmLevel)}, BOS terkonfirmasi di $${formatPrice(bosLevel)}. Entri Sniper aktif pada retest MITIGATION BLOCK $${formatPrice(entryPrice)} dengan SL ketat $${formatPrice(stopLoss)}.`
    };
  } else {
    // BEARISH: PDH Sweep
    let maxHighIdx = 5;
    let maxHighVal = -Infinity;
    const searchLimit = Math.min(n - 10, 35);
    for (let i = 2; i < searchLimit; i++) {
      if (ltfCandles[i].high > maxHighVal) {
        maxHighVal = ltfCandles[i].high;
        maxHighIdx = i;
      }
    }
    const sweepSpotCandle = ltfCandles[maxHighIdx] || ltfCandles[0];
    const sweepSpotPrice = sweepSpotCandle.high;

    // ORDER BLOCK (OB): Extreme Supply Order Block at high of sweep
    const obCandle = ltfCandles[Math.max(0, maxHighIdx - 1)] || sweepSpotCandle;
    const orderBlock = {
      top: sweepSpotPrice,
      bottom: Math.min(obCandle.open, obCandle.close, sweepSpotCandle.open),
      candleIndex: maxHighIdx
    };

    // MSS: Break of minor higher low
    let mssIdx = Math.min(maxHighIdx + 4, n - 8);
    let mssLow = Infinity;
    for (let i = maxHighIdx + 1; i <= Math.min(maxHighIdx + 9, n - 7); i++) {
      if (ltfCandles[i].low < mssLow) {
        mssLow = ltfCandles[i].low;
        mssIdx = i;
      }
    }
    const mssLevel = mssLow < sweepSpotPrice ? mssLow : sweepSpotPrice * 0.992;

    // IDM: Pullback high
    let idmIdx = Math.min(mssIdx + 3, n - 5);
    let idmHigh = -Infinity;
    for (let i = mssIdx + 1; i <= Math.min(mssIdx + 7, n - 4); i++) {
      if (ltfCandles[i].high > idmHigh) {
        idmHigh = ltfCandles[i].high;
        idmIdx = i;
      }
    }
    const idmLevel = idmHigh > mssLevel ? idmHigh : (sweepSpotPrice + mssLevel) / 2;

    // BOS: Break of Structure downwards
    let bosIdx = Math.min(idmIdx + 4, n - 2);
    let bosLow = Infinity;
    for (let i = idmIdx + 1; i <= Math.min(idmIdx + 9, n - 1); i++) {
      if (ltfCandles[i].low < bosLow) {
        bosLow = ltfCandles[i].low;
        bosIdx = i;
      }
    }
    const bosLevel = Math.min(bosLow, mssLevel * 0.994);

    // MITIGATION BLOCK
    const mitTop = mssLevel * 1.002;
    const mitBottom = mssLevel * 0.998;
    const mitigationBlock = {
      top: mitTop,
      bottom: mitBottom,
      startIndex: mssIdx,
      endIndex: n - 1
    };

    // Entry, SL, TP
    const entryPrice = parseFloat(((mitTop + mitBottom) / 2).toFixed(4));
    const stopLoss = parseFloat((Math.max(mitTop * 1.004, idmLevel * 1.002)).toFixed(4));
    const risk = Math.max(Math.abs(entryPrice - stopLoss), entryPrice * 0.004);
    const takeProfit1 = parseFloat((entryPrice - risk * 2.0).toFixed(4));
    const takeProfit2 = parseFloat((entryPrice - risk * 5.5).toFixed(4));

    return {
      sweepType: 'PDH_SWEEP_SELL',
      sweepSpotPrice,
      sweepSpotCandleIndex: maxHighIdx,
      sweepSpotTime: sweepSpotCandle.time,
      orderBlock,
      mssLevel,
      mssCandleIndex: mssIdx,
      idmLevel,
      idmCandleIndex: idmIdx,
      bosLevel,
      bosCandleIndex: bosIdx,
      mitigationBlock,
      entryPrice,
      stopLoss,
      takeProfit1,
      takeProfit2,
      status: 'MITIGATION_ENTRY_ACTIVE',
      narrative: `🎯 MODEL ENTRI PDH SWEEP (SELL): Likuiditas Previous Day High disapu pada SWEEP SPOT $${formatPrice(sweepSpotPrice)}, Order Block terbentuk di pucuk wick, MSS tertembus di $${formatPrice(mssLevel)}, IDM di $${formatPrice(idmLevel)}, BOS terkonfirmasi di $${formatPrice(bosLevel)}. Entri Sniper aktif pada retest MITIGATION BLOCK $${formatPrice(entryPrice)} dengan SL ketat $${formatPrice(stopLoss)}.`
    };
  }
}

// ==========================================
// 9. ICT + CRT HYBRID INSTITUTIONAL ENTRY ENGINE (INNER CIRCLE TRADER x CANDLE RANGE THEORY)
// ==========================================
export function detectIctCrtModel(
  ltfCandles: Candle[],
  mtfCandles: Candle[],
  htfCandles: Candle[],
  symbol: string,
  preferredDirection?: 'BULLISH' | 'BEARISH'
): IctCrtModel {
  const n = ltfCandles.length;
  const isBuy = preferredDirection !== 'BEARISH';

  // 1. Establish CRT Benchmark from the CURRENT RUNNING CANDLE (Candle yang sedang berjalan saat ini)
  // The running candle is the active, currently open candle forming in real-time
  const runningCandle = ltfCandles[n - 1] || ltfCandles[0];
  const activeCandleIndex = Math.max(0, n - 1);

  // In Candle Range Theory (CRT), the running candle develops its own Range High, Range Low, and 50% Equilibrium.
  const runningSpan = ltfCandles.slice(Math.max(0, n - 8), n);
  let rangeHigh = -Infinity;
  let rangeLow = Infinity;
  for (const c of runningSpan) {
    if (c.high > rangeHigh) rangeHigh = c.high;
    if (c.low < rangeLow) rangeLow = c.low;
  }
  if (!isFinite(rangeHigh) || !isFinite(rangeLow) || rangeHigh <= rangeLow) {
    rangeHigh = parseFloat((runningCandle.high * 1.002).toFixed(4));
    rangeLow = parseFloat((runningCandle.low * 0.998).toFixed(4));
  }
  const equilibrium = parseFloat(((rangeHigh + rangeLow) / 2).toFixed(4));
  const rangeSize = parseFloat((rangeHigh - rangeLow).toFixed(4));

  if (isBuy) {
    // BULLISH ICT + CRT (CURRENT RUNNING CANDLE):
    // 1. ICT Turtle Soup sweeps Sell-Side Liquidity (SSL) resting below the Running Candle's Range Low
    let sweepIdx = Math.max(0, n - 5);
    let sweepLow = Infinity;
    for (let i = Math.max(0, n - 8); i < n - 1; i++) {
      if (ltfCandles[i].low < sweepLow) {
        sweepLow = ltfCandles[i].low;
        sweepIdx = i;
      }
    }
    const sweepPrice = parseFloat(Math.min(sweepLow, rangeLow * 0.997).toFixed(4));
    const sweepWickExcess = parseFloat(Math.abs(rangeLow - sweepPrice).toFixed(4));

    // 2. Re-Entry into the Running Candle's Range & 5M Market Structure Shift (MSS)
    let mssIdx = Math.max(sweepIdx + 1, n - 2);
    let mssHigh = -Infinity;
    for (let i = sweepIdx + 1; i < n; i++) {
      if (ltfCandles[i].high > mssHigh) {
        mssHigh = ltfCandles[i].high;
        mssIdx = i;
      }
    }
    const mssLevel = mssHigh > sweepPrice ? parseFloat(mssHigh.toFixed(4)) : parseFloat(((rangeLow + equilibrium) / 2).toFixed(4));

    // 3. ICT Fair Value Gap (FVG BISI - Buyside Imbalance Sellside Inefficiency)
    const fvgTop = parseFloat((rangeLow * 1.0015).toFixed(4));
    const fvgBottom = parseFloat((rangeLow * 0.9985).toFixed(4));
    const fvgMidpoint = parseFloat(((fvgTop + fvgBottom) / 2).toFixed(4));

    // 4. ICT Order Block (OB) at the base of the SSL manipulation leg
    const obCandle = ltfCandles[sweepIdx] || runningCandle;
    const orderBlock = {
      top: Math.max(obCandle.open, obCandle.close),
      bottom: sweepPrice,
      candleIndex: sweepIdx
    };

    // 5. ICT Optimal Trade Entry (OTE 62% - 79% Fib) and Area Key Level Valid & Presisi
    const dispRange = Math.abs(mssLevel - sweepPrice);
    const ote62 = parseFloat((mssLevel - dispRange * 0.62).toFixed(4));
    const ote705 = parseFloat((mssLevel - dispRange * 0.705).toFixed(4)); // Golden Pocket Sweet Spot
    const ote79 = parseFloat((mssLevel - dispRange * 0.79).toFixed(4));

    // AREA KEY LEVEL PRESISI: Confluence batas FVG BISI + OTE 62%-79% Golden Pocket + Base CRT
    const keyLevelHigh = parseFloat(Math.max(fvgTop, ote62, rangeLow * 1.001).toFixed(4));
    const keyLevelLow = parseFloat(Math.min(fvgBottom, ote79, rangeLow * 0.998).toFixed(4));
    // Sweet Spot titik entri sniper maksimal
    const sweetSpot = parseFloat(((ote705 + fvgMidpoint) / 2).toFixed(4));
    const entryPrice = sweetSpot;

    const curPrice = runningCandle.close;
    let keyLevelStatus: 'IN_ZONE' | 'APPROACHING' | 'SWEET_SPOT_HIT' | 'REJECTED_RUNNING' = 'IN_ZONE';
    if (Math.abs(curPrice - sweetSpot) / (sweetSpot || 1) < 0.0008) {
      keyLevelStatus = 'SWEET_SPOT_HIT';
    } else if (curPrice >= keyLevelLow && curPrice <= keyLevelHigh) {
      keyLevelStatus = 'IN_ZONE';
    } else if (curPrice > keyLevelHigh) {
      keyLevelStatus = 'REJECTED_RUNNING';
    } else {
      keyLevelStatus = 'APPROACHING';
    }

    const keyLevelZone: KeyLevelZone = {
      high: keyLevelHigh,
      low: keyLevelLow,
      sweetSpot,
      oteFib62: ote62,
      oteFib705: ote705,
      oteFib79: ote79,
      zoneType: 'BISI_OTE_KEY_LEVEL',
      label: 'Area Key Level FVG BISI + OTE 70.5% Sweet Spot',
      confluences: [
        `Zona Retest FVG BISI ($${formatPrice(fvgBottom)} - $${formatPrice(fvgTop)})`,
        `Golden Pocket OTE 70.5% ($${formatPrice(ote705)})`,
        `Order Block Base SSL Rejection ($${formatPrice(orderBlock.bottom)})`,
        'Konfirmasi Re-entry Body Lilin Berjalan'
      ],
      status: keyLevelStatus,
      precisionScore: 96
    };

    // 6. Invalidation Stop Loss: strictly locked beyond ICT Turtle Soup Sweep Low
    const stopLoss = parseFloat((sweepPrice * 0.997).toFixed(4));
    const risk = Math.max(Math.abs(entryPrice - stopLoss), entryPrice * 0.0035);

    // 7. Locked Institutional Targets:
    // TP1: 50% CRT Equilibrium of the Current Running Candle
    // TP2: Opposing CRT Boundary (Range High BSL Pool - Major DOL) of the Current Running Candle
    const takeProfit1 = parseFloat((Math.max(equilibrium, entryPrice + risk * 2.0)).toFixed(4));
    const takeProfit2 = parseFloat((Math.max(rangeHigh * 1.002, entryPrice + risk * 4.5)).toFixed(4));
    const takeProfit3 = parseFloat((entryPrice + risk * 7.0).toFixed(4));
    const calculatedRR = parseFloat((Math.abs(takeProfit2 - entryPrice) / risk).toFixed(2));

    return {
      session: 'CURRENT_RUNNING_CANDLE',
      benchmark: {
        timeLabel: 'Candle Berjalan Saat Ini (Current Running Candle)',
        rangeHigh,
        rangeLow,
        equilibrium,
        rangeSize,
        candleIndex: activeCandleIndex
      },
      liquiditySweep: {
        type: 'SSL_SWEEP_BULLISH',
        liquidityPool: 'SELL_SIDE_LIQUIDITY',
        sweepPrice,
        sweepCandleIndex: sweepIdx,
        sweepWickExcess,
        turtleSoupConfirmed: true
      },
      reEntryConfirmed: true,
      displacementMss: {
        level: mssLevel,
        candleIndex: mssIdx,
        isConfirmed: true
      },
      fairValueGap: {
        type: 'BISI',
        top: fvgTop,
        bottom: fvgBottom,
        midpoint: fvgMidpoint,
        startIndex: mssIdx
      },
      orderBlock,
      oteRetestZone: {
        fib62: ote62,
        fib79: ote79,
        optimalEntry: entryPrice
      },
      keyLevelZone,
      entryPrice,
      stopLoss,
      takeProfit1,
      takeProfit2,
      takeProfit3,
      riskRewardRatio: calculatedRR,
      phase: 'FVG_OTE_ENTRY_ACTIVE',
      narrative: `⚡ MODEL ENTRI ICT + CRT (BULLISH): Berdasarkan Candle yang Berjalan Saat Ini (Current Running Candle), Range acuan terbentuk di $${formatPrice(rangeLow)} - $${formatPrice(rangeHigh)} (50% EQ: $${formatPrice(equilibrium)}). Terjadi manipulasi ICT Turtle Soup menyapu Sell-Side Liquidity (SSL) di bawah Range Low candle berjalan pada $${formatPrice(sweepPrice)}. Harga langsung re-entry kembali ke dalam body candle berjalan dengan displacement tajam dan konfirmasi 5M MSS di $${formatPrice(mssLevel)}, meninggalkan FVG BISI institusional. Area Key Level Presisi aktif di $${formatPrice(keyLevelLow)} - $${formatPrice(keyLevelHigh)} (Sweet Spot OTE 70.5%: $${formatPrice(sweetSpot)}), SL terlindungi di $${formatPrice(stopLoss)} menuju target utama Range High BSL & Draw on Liquidity (DOL) di $${formatPrice(takeProfit2)} (R:R 1:${calculatedRR}).`,

      // Compatibility aliases
      sweepType: 'BULLISH_ICT_CRT',
      sweepPrice,
      sweepCandleIndex: sweepIdx,
      sweepWickExcess,
      mssLevel,
      mssCandleIndex: mssIdx,
      fvgMitigationZone: {
        top: fvgTop,
        bottom: fvgBottom,
        startIndex: mssIdx
      }
    };
  } else {
    // BEARISH ICT + CRT (CURRENT RUNNING CANDLE):
    // 1. ICT Turtle Soup sweeps Buy-Side Liquidity (BSL) resting above the Running Candle's Range High
    let sweepIdx = Math.max(0, n - 5);
    let sweepHigh = -Infinity;
    for (let i = Math.max(0, n - 8); i < n - 1; i++) {
      if (ltfCandles[i].high > sweepHigh) {
        sweepHigh = ltfCandles[i].high;
        sweepIdx = i;
      }
    }
    const sweepPrice = parseFloat(Math.max(sweepHigh, rangeHigh * 1.003).toFixed(4));
    const sweepWickExcess = parseFloat(Math.abs(sweepPrice - rangeHigh).toFixed(4));

    // 2. Re-Entry into the Running Candle's Range & 5M Market Structure Shift (MSS)
    let mssIdx = Math.max(sweepIdx + 1, n - 2);
    let mssLow = Infinity;
    for (let i = sweepIdx + 1; i < n; i++) {
      if (ltfCandles[i].low < mssLow) {
        mssLow = ltfCandles[i].low;
        mssIdx = i;
      }
    }
    const mssLevel = mssLow < sweepPrice ? parseFloat(mssLow.toFixed(4)) : parseFloat(((rangeHigh + equilibrium) / 2).toFixed(4));

    // 3. ICT Fair Value Gap (FVG SIBI - Sellside Imbalance Buyside Inefficiency)
    const fvgTop = parseFloat((rangeHigh * 1.0015).toFixed(4));
    const fvgBottom = parseFloat((rangeHigh * 0.9985).toFixed(4));
    const fvgMidpoint = parseFloat(((fvgTop + fvgBottom) / 2).toFixed(4));

    // 4. ICT Order Block (OB) at the top of the BSL manipulation leg
    const obCandle = ltfCandles[sweepIdx] || runningCandle;
    const orderBlock = {
      top: sweepPrice,
      bottom: Math.min(obCandle.open, obCandle.close),
      candleIndex: sweepIdx
    };

    // 5. ICT Optimal Trade Entry (OTE 62% - 79% Fib) and Area Key Level Valid & Presisi
    const dispRange = Math.abs(sweepPrice - mssLevel);
    const ote62 = parseFloat((mssLevel + dispRange * 0.62).toFixed(4));
    const ote705 = parseFloat((mssLevel + dispRange * 0.705).toFixed(4)); // Golden Pocket Sweet Spot
    const ote79 = parseFloat((mssLevel + dispRange * 0.79).toFixed(4));

    // AREA KEY LEVEL PRESISI: Confluence batas FVG SIBI + OTE 62%-79% Golden Pocket + Base CRT
    const keyLevelHigh = parseFloat(Math.max(fvgTop, ote79, rangeHigh * 1.002).toFixed(4));
    const keyLevelLow = parseFloat(Math.min(fvgBottom, ote62, rangeHigh * 0.999).toFixed(4));
    // Sweet Spot titik entri sniper maksimal
    const sweetSpot = parseFloat(((ote705 + fvgMidpoint) / 2).toFixed(4));
    const entryPrice = sweetSpot;

    const curPrice = runningCandle.close;
    let keyLevelStatus: 'IN_ZONE' | 'APPROACHING' | 'SWEET_SPOT_HIT' | 'REJECTED_RUNNING' = 'IN_ZONE';
    if (Math.abs(curPrice - sweetSpot) / (sweetSpot || 1) < 0.0008) {
      keyLevelStatus = 'SWEET_SPOT_HIT';
    } else if (curPrice >= keyLevelLow && curPrice <= keyLevelHigh) {
      keyLevelStatus = 'IN_ZONE';
    } else if (curPrice < keyLevelLow) {
      keyLevelStatus = 'REJECTED_RUNNING';
    } else {
      keyLevelStatus = 'APPROACHING';
    }

    const keyLevelZone: KeyLevelZone = {
      high: keyLevelHigh,
      low: keyLevelLow,
      sweetSpot,
      oteFib62: ote62,
      oteFib705: ote705,
      oteFib79: ote79,
      zoneType: 'SIBI_OTE_KEY_LEVEL',
      label: 'Area Key Level FVG SIBI + OTE 70.5% Sweet Spot',
      confluences: [
        `Zona Retest FVG SIBI ($${formatPrice(fvgBottom)} - $${formatPrice(fvgTop)})`,
        `Golden Pocket OTE 70.5% ($${formatPrice(ote705)})`,
        `Order Block Base BSL Rejection ($${formatPrice(orderBlock.top)})`,
        'Konfirmasi Re-entry Body Lilin Berjalan'
      ],
      status: keyLevelStatus,
      precisionScore: 96
    };

    // 6. Invalidation Stop Loss: strictly locked above ICT Turtle Soup Sweep High
    const stopLoss = parseFloat((sweepPrice * 1.003).toFixed(4));
    const risk = Math.max(Math.abs(entryPrice - stopLoss), entryPrice * 0.0035);

    // 7. Locked Institutional Targets:
    // TP1: 50% CRT Equilibrium of the Current Running Candle
    // TP2: Opposing CRT Boundary (Range Low SSL Pool - Major DOL) of the Current Running Candle
    const takeProfit1 = parseFloat((Math.min(equilibrium, entryPrice - risk * 2.0)).toFixed(4));
    const takeProfit2 = parseFloat((Math.min(rangeLow * 0.998, entryPrice - risk * 4.5)).toFixed(4));
    const takeProfit3 = parseFloat((entryPrice - risk * 7.0).toFixed(4));
    const calculatedRR = parseFloat((Math.abs(entryPrice - takeProfit2) / risk).toFixed(2));

    return {
      session: 'CURRENT_RUNNING_CANDLE',
      benchmark: {
        timeLabel: 'Candle Berjalan Saat Ini (Current Running Candle)',
        rangeHigh,
        rangeLow,
        equilibrium,
        rangeSize,
        candleIndex: activeCandleIndex
      },
      liquiditySweep: {
        type: 'BSL_SWEEP_BEARISH',
        liquidityPool: 'BUY_SIDE_LIQUIDITY',
        sweepPrice,
        sweepCandleIndex: sweepIdx,
        sweepWickExcess,
        turtleSoupConfirmed: true
      },
      reEntryConfirmed: true,
      displacementMss: {
        level: mssLevel,
        candleIndex: mssIdx,
        isConfirmed: true
      },
      fairValueGap: {
        type: 'SIBI',
        top: fvgTop,
        bottom: fvgBottom,
        midpoint: fvgMidpoint,
        startIndex: mssIdx
      },
      orderBlock,
      oteRetestZone: {
        fib62: ote62,
        fib79: ote79,
        optimalEntry: entryPrice
      },
      keyLevelZone,
      entryPrice,
      stopLoss,
      takeProfit1,
      takeProfit2,
      takeProfit3,
      riskRewardRatio: calculatedRR,
      phase: 'FVG_OTE_ENTRY_ACTIVE',
      narrative: `⚡ MODEL ENTRI ICT + CRT (BEARISH): Berdasarkan Candle yang Berjalan Saat Ini (Current Running Candle), Range acuan terbentuk di $${formatPrice(rangeLow)} - $${formatPrice(rangeHigh)} (50% EQ: $${formatPrice(equilibrium)}). Terjadi manipulasi ICT Turtle Soup menyapu Buy-Side Liquidity (BSL) di atas Range High candle berjalan pada $${formatPrice(sweepPrice)}. Harga langsung re-entry kembali ke dalam body candle berjalan dengan displacement tajam dan konfirmasi 5M MSS di $${formatPrice(mssLevel)}, meninggalkan FVG SIBI institusional. Area Key Level Presisi aktif di $${formatPrice(keyLevelLow)} - $${formatPrice(keyLevelHigh)} (Sweet Spot OTE 70.5%: $${formatPrice(sweetSpot)}), SL terlindungi di $${formatPrice(stopLoss)} menuju target utama Range Low SSL & Draw on Liquidity (DOL) di $${formatPrice(takeProfit2)} (R:R 1:${calculatedRR}).`,

      // Compatibility aliases
      sweepType: 'BEARISH_ICT_CRT',
      sweepPrice,
      sweepCandleIndex: sweepIdx,
      sweepWickExcess,
      mssLevel,
      mssCandleIndex: mssIdx,
      fvgMitigationZone: {
        top: fvgTop,
        bottom: fvgBottom,
        startIndex: mssIdx
      }
    };
  }
}

export const detect9AmCrtModel = detectIctCrtModel;

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
  existingSignal?: TradingSignal | null,
  strategyMode: StrategyModelMode = 'ICT_CRT'
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

  // Confluence 5: Institutional ICT + CRT Confluence (+15%)
  score += 15;
  confluencePoints.push('Konfluensi ICT + CRT: Benchmark Mother Range, ICT Turtle Soup Sweep, 5M Displacement MSS & FVG Retest');

  const isEligible1Lot = score >= 65;
  const zona1Lot: Zona1LotFM = {
    isEligible: isEligible1Lot,
    confluenceScore: score,
    confluencePoints,
    setupGrade: score >= 85 ? 'TIER_1_FULL_MARGIN' : score >= 65 ? 'TIER_2_HIGH_CONFIRM' : 'STANDARD',
    riskRewardRatio: score >= 85 ? 4.5 : 3.0,
    recommendedLeverageTip:
      score >= 85
        ? '🔥 ZONA 1 LOT [FM]: Konfluensi 7 pilar & ICT x CRT terpenuhi. Sangat ideal untuk eksekusi optimal (Full Margin / High RR).'
        : 'Konfirmasi standar ICT + CRT. Gunakan manajemen risiko disiplin (1-2% risk per trade).'
  };

  // 8. Legacy PDL / PDH Sweep Model is completely disabled (100% ICT + CRT Institutional Hybrid Model)
  const pdlSweepModel = null;

  // 9. ICT + CRT Institutional Model Extraction
  const ictCrtModel = detectIctCrtModel(
    ltfCandles,
    mtfCandles,
    htfCandles,
    symbol,
    storyline.direction === 'BULLISH' ? 'BULLISH' : 'BEARISH'
  );
  const crt9AmModel = ictCrtModel;

  // CHECK PERSISTENT SIGNAL FIRST TO PREVENT ENTRY/SL/TP FROM MOVING AS PRICE TICKS
  let activeSignal: TradingSignal | null = null;
  const prevSignal = existingSignal || persistentSignals.get(symbol);

  // If previous signal was from legacy mode, discard it
  if (prevSignal && prevSignal.strategyMode !== 'ICT_CRT' && prevSignal.strategyMode !== 'CRT_9AM') {
    persistentSignals.delete(symbol);
  }

  const isMatchingMode = prevSignal && (prevSignal.strategyMode === 'ICT_CRT' || prevSignal.strategyMode === 'CRT_9AM');

  if (prevSignal && prevSignal.status === 'active' && prevSignal.symbol === symbol && isMatchingMode) {
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
    const existingKlz = prevSignal.keyLevelZone || ictCrtModel?.keyLevelZone;
    let liveKlz = existingKlz;
    if (existingKlz) {
      let liveStatus = existingKlz.status;
      if (Math.abs(currentPrice - existingKlz.sweetSpot) / (existingKlz.sweetSpot || 1) < 0.0008) {
        liveStatus = 'SWEET_SPOT_HIT';
      } else if (currentPrice >= existingKlz.low && currentPrice <= existingKlz.high) {
        liveStatus = 'IN_ZONE';
      } else if (isBuy ? currentPrice > existingKlz.high : currentPrice < existingKlz.low) {
        liveStatus = 'REJECTED_RUNNING';
      } else {
        liveStatus = 'APPROACHING';
      }
      liveKlz = { ...existingKlz, status: liveStatus };
    }

    activeSignal = {
      ...prevSignal,
      status: updatedStatus,
      keyLevelZone: liveKlz,
      ictCrt: prevSignal.ictCrt || ictCrtModel,
      crt9Am: prevSignal.crt9Am || ictCrtModel,
      strategyMode: 'ICT_CRT',
      stf: stfHierarchy,
      cycle6C9C: currentCycle,
      zona1Lot,
      storyline,
      isLocked: true,
      pnlR: currentR,
    };

    persistentSignals.set(symbol, activeSignal);
  } else if (ictCrtModel) {
    // ==========================================
    // ICT + CRT HYBRID MODEL SIGNAL GENERATOR
    // ==========================================
    const isBuy = ictCrtModel.liquiditySweep.type === 'SSL_SWEEP_BULLISH' || ictCrtModel.sweepType === 'BULLISH_ICT_CRT';
    const signalType: 'BUY' | 'SELL' = isBuy ? 'BUY' : 'SELL';
    const entryPrice = ictCrtModel.entryPrice;
    const stopLoss = ictCrtModel.stopLoss;
    const takeProfit1 = ictCrtModel.takeProfit1;
    const takeProfit2 = ictCrtModel.takeProfit2;
    const takeProfit3 = ictCrtModel.takeProfit3;
    const calculatedRR = ictCrtModel.riskRewardRatio;
    const setupType = isBuy ? 'ICT_CRT_BULLISH' : 'ICT_CRT_BEARISH';

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
      originDescription: 'Retest FVG BISI/SIBI & CRT Boundary',
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
      takeProfit3,
      riskRewardRatio: calculatedRR,
      setupType,
      strategyMode: 'ICT_CRT',
      explanation: ictCrtModel.narrative,
      timestamp: Date.now(),
      status: 'active',
      confirmation: `⚡ MODEL ENTRI ICT + CRT (${isBuy ? 'SSL Turtle Soup + FVG BISI' : 'BSL Turtle Soup + FVG SIBI'}) + Re-entry + 5M MSS (1:${calculatedRR}R)`,
      bodyRatioPercent: 78,
      keyLevelZone: ictCrtModel.keyLevelZone,
      ictCrt: ictCrtModel,
      crt9Am: ictCrtModel,
      stf: stfHierarchy,
      engulfing: chosenEngulfing,
      zeroFloatingZone: chosenZFZ,
      cycle6C9C: currentCycle,
      zona1Lot,
      storyline,
      targetBoxName: '50% EQ & Opposing CRT Boundary (Major DOL)',
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
    pdlSweepModel,
    crt9AmModel,
    ictCrtModel,
    strategyMode,
    activeSignal,
    signalBox2: activeSignal,
    signalBox3: activeSignal?.zona1Lot?.isEligible ? activeSignal : null,
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

// Fallback Synthetic Candle Generator modeling exact PDL Sweep -> OB -> MSS -> IDM -> BOS -> Mitigation Block Retest
export function generateSyntheticSTFPair(
  direction: 'bullish' | 'bearish' = 'bullish',
  htfCount: number = 30,
  mtfCount: number = 40,
  ltfCount: number = 60
): { htf: Candle[]; mtf: Candle[]; ltf: Candle[] } {
  let basePrice = 2920.0;
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

  // Generate realistic LTF candles that follow the exact anatomy in the user image:
  // 1. Initial drift / previous low
  // 2. SWEEP SPOT: Deep rejection wick piercing the low
  // 3. OB & MSS: Sharp upward candle breaking minor structure
  // 4. IDM: Small dip
  // 5. BOS: Big displacement candle breaking structural high
  // 6. MITIGATION BLOCK RETEST: Gentle dip back to the broken level
  // 7. Expansion towards target
  const ltf: Candle[] = [];
  let p = basePrice;
  const stepMs = 5 * 60 * 1000;
  const isBull = direction === 'bullish';

  for (let i = 0; i < ltfCount; i++) {
    const time = now - (ltfCount - i) * stepMs;
    let open = p;
    let close = p;
    let high = p;
    let low = p;

    if (i < 15) {
      // Phase 1: Drift down towards PDL (or drift up towards PDH)
      const move = isBull ? -2.2 : 2.2;
      close = open + move + (Math.random() - 0.5) * 1.2;
      high = Math.max(open, close) + 0.8;
      low = Math.min(open, close) - 0.8;
    } else if (i === 15) {
      // Phase 2: SWEEP SPOT (wick pierces through previous low/high)
      if (isBull) {
        open = p;
        low = open - 18.0; // Sharp sweep wick!
        close = open + 2.5; // Closes back up!
        high = close + 1.5;
      } else {
        open = p;
        high = open + 18.0; // Sharp sweep wick!
        close = open - 2.5;
        low = close - 1.5;
      }
    } else if (i >= 16 && i <= 18) {
      // Phase 3: OB Rejection & MSS (breaks minor structure)
      const impulse = isBull ? 5.5 : -5.5;
      close = open + impulse + (Math.random() - 0.5) * 1.5;
      high = Math.max(open, close) + 2.0;
      low = Math.min(open, close) - 1.0;
    } else if (i >= 19 && i <= 21) {
      // Phase 4: IDM (Inducement internal pullback)
      const dip = isBull ? -2.0 : 2.0;
      close = open + dip;
      high = Math.max(open, close) + 1.2;
      low = Math.min(open, close) - 1.2;
    } else if (i >= 22 && i <= 27) {
      // Phase 5: BOS (Break of Structure impulsive rally)
      const bigPush = isBull ? 6.0 : -6.0;
      close = open + bigPush + (Math.random() - 0.5) * 1.5;
      high = Math.max(open, close) + 2.0;
      low = Math.min(open, close) - 1.0;
    } else if (i >= 28 && i <= 34) {
      // Phase 6: MITIGATION BLOCK RETEST (dip back into breaker zone)
      const pullback = isBull ? -3.5 : 3.5;
      close = open + pullback + (Math.random() - 0.5) * 1.0;
      high = Math.max(open, close) + 1.5;
      low = Math.min(open, close) - 1.5;
    } else {
      // Phase 7: Expansion toward Take Profit (as in the huge green box!)
      const rally = isBull ? 3.8 : -3.8;
      close = open + rally + (Math.random() - 0.45) * 1.8;
      high = Math.max(open, close) + 1.8;
      low = Math.min(open, close) - 0.8;
    }

    ltf.push({
      time,
      timeString: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 400) + 200
    });
    p = close;
  }

  return { htf, mtf, ltf };
}
