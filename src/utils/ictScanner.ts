/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Candle, FVG, OrderBlock, MarketStructure, TradingSignal, ScanResult, OteZone, Inducement, CISD, HTFContext } from '../types';

// Detects Change in State of Delivery (CISD) after BSL/SSL sweeps
export function detectCISD(
  candles: Candle[], 
  swingHighs: { index: number; price: number }[], 
  swingLows: { index: number; price: number }[]
): CISD[] {
  const cisds: CISD[] = [];
  const len = candles.length;
  if (len < 5) return cisds;

  // Search through candles for BSL / SSL sweeps followed by CISD confirmation
  for (let i = 4; i < len; i++) {
    const c = candles[i];

    // 1. Check Bullish CISD (SSL Swept -> State flips to Buy-Side)
    const validSSLs = swingLows.filter(l => l.index < i - 1 && l.index > i - 40);
    for (const ssl of validSSLs) {
      for (let s = ssl.index + 1; s <= i; s++) {
        const sweepCandle = candles[s];
        if (sweepCandle.low < ssl.price) {
          // SSL is swept! CISD line is the high / open of sweeping candle
          const cisdLevel = Math.max(sweepCandle.open, sweepCandle.high);
          if (c.close > cisdLevel && i >= s) {
            const alreadyExists = cisds.some(cd => cd.candleIndex === i && cd.type === 'bullish');
            if (!alreadyExists) {
              cisds.push({
                id: `cisd-bull-${i}`,
                type: 'bullish',
                price: Number(cisdLevel.toFixed(4)),
                candleIndex: i,
                sweptType: 'SSL',
                sweptPrice: Number(ssl.price.toFixed(4)),
              });
            }
          }
        }
      }
    }

    // 2. Check Bearish CISD (BSL Swept -> State flips to Sell-Side)
    const validBSLs = swingHighs.filter(h => h.index < i - 1 && h.index > i - 40);
    for (const bsl of validBSLs) {
      for (let s = bsl.index + 1; s <= i; s++) {
        const sweepCandle = candles[s];
        if (sweepCandle.high > bsl.price) {
          // BSL is swept! CISD line is the low / open of sweeping candle
          const cisdLevel = Math.min(sweepCandle.open, sweepCandle.low);
          if (c.close < cisdLevel && i >= s) {
            const alreadyExists = cisds.some(cd => cd.candleIndex === i && cd.type === 'bearish');
            if (!alreadyExists) {
              cisds.push({
                id: `cisd-bear-${i}`,
                type: 'bearish',
                price: Number(cisdLevel.toFixed(4)),
                candleIndex: i,
                sweptType: 'BSL',
                sweptPrice: Number(bsl.price.toFixed(4)),
              });
            }
          }
        }
      }
    }
  }

  return cisds;
}

// Build Multi-Timeframe (D1/H4/H1 -> M15/M5) Context Object
export function buildHTFContext(
  timeframe: string, 
  trend: 'bullish' | 'bearish' | 'sideways', 
  BSL: number, 
  SSL: number
): HTFContext {
  const isHTF = ['1d', '4h', '1h', 'D1', 'H4', 'H1'].includes(timeframe);
  const htfTf = isHTF ? (timeframe.toUpperCase() as 'D1' | 'H4' | 'H1') : 'H4';
  const ltfTf = ['5m', '15m'].includes(timeframe) ? (timeframe as 'M15' | 'M5') : 'M15';

  if (trend === 'bullish') {
    return {
      htfTimeframe: htfTf,
      ltfEntryTimeframe: ltfTf,
      bias: 'bullish_retrace',
      htfZoneName: `HTF (${htfTf}) SSL Terjemput → Zone Retrace Diskon`,
      explanation: `Pergerakan HTF (${htfTf}) mengindikasikan retrace ke zona diskon setelah Sell-Side Liquidity (SSL: $${SSL.toFixed(2)}) terjemput. Pemicu CISD dan konfirmasi FVG Retrace telah terdeteksi di timeframe eksekusi (${ltfTf}).`
    };
  } else {
    return {
      htfTimeframe: htfTf,
      ltfEntryTimeframe: ltfTf,
      bias: 'bearish_retrace',
      htfZoneName: `HTF (${htfTf}) BSL Terjemput → Zone Retrace Premium`,
      explanation: `Pergerakan HTF (${htfTf}) mengindikasikan retrace ke zona premium setelah Buy-Side Liquidity (BSL: $${BSL.toFixed(2)}) terjemput. Pemicu CISD dan konfirmasi FVG Retrace telah terdeteksi di timeframe eksekusi (${ltfTf}).`
    };
  }
}

// Detects swing highs and lows in a given window (default 2 candles on each side)
export function detectSwingLevels(candles: Candle[], windowSize = 2) {
  const swingHighs: { index: number; price: number }[] = [];
  const swingLows: { index: number; price: number }[] = [];

  for (let i = windowSize; i < candles.length - windowSize; i++) {
    const currentHigh = candles[i].high;
    const currentLow = candles[i].low;

    let isSwingHigh = true;
    let isSwingLow = true;

    for (let w = -windowSize; w <= windowSize; w++) {
      if (w === 0) continue;
      if (candles[i + w].high >= currentHigh) {
        isSwingHigh = false;
      }
      if (candles[i + w].low <= currentLow) {
        isSwingLow = false;
      }
    }

    if (isSwingHigh) {
      swingHighs.push({ index: i, price: currentHigh });
    }
    if (isSwingLow) {
      swingLows.push({ index: i, price: currentLow });
    }
  }

  return { swingHighs, swingLows };
}

export function scanCandles(symbol: string, timeframe: string, candles: Candle[]): ScanResult {
  const fvgs: FVG[] = [];
  const marketStructures: MarketStructure[] = [];
  const orderBlocks: OrderBlock[] = [];
  
  if (candles.length < 5) {
    return {
      symbol,
      timeframe,
      candles,
      fvgs: [],
      orderBlocks: [],
      marketStructures: [],
      inducements: [],
      cisds: [],
      activeSignal: null,
      trend: 'sideways',
      scannedAt: Date.now(),
    };
  }

  // --- 1. DETECT FAIR VALUE GAPS (FVG) & INVERSIONS (IFVG) ---
  for (let i = 2; i < candles.length; i++) {
    const c1 = candles[i - 2];
    const c2 = candles[i - 1];
    const c3 = candles[i];

    // Bullish FVG: Low of c3 is higher than High of c1, with a bullish c2 expansion
    if (c3.low > c1.high && c2.close > c2.open) {
      const top = c3.low;
      const bottom = c1.high;
      
      const newFvg: FVG = {
        id: `fvg-bull-${i}`,
        type: 'bullish',
        top,
        bottom,
        candleIndex: i - 1,
        startIndex: i - 2,
        endIndex: i,
        isMitigated: false,
        mitigatedByIndex: null,
        isInverted: false,
        invertedAtIndex: null,
        invertedType: null,
        touchCount: 0,
      };
      
      // Track this FVG forward in time to check for mitigation, inversion, and touch count
      let touchCount = 0;
      for (let j = i + 1; j < candles.length; j++) {
        const cCurrent = candles[j];
        
        // Count how many times candles retest or enter the gap range [bottom, top]
        if (cCurrent.low <= top && cCurrent.high >= bottom) {
          touchCount++;
        }

        // Check for inversion (Inverted FVG): A candle body closes below the bottom of the bullish FVG
        if (cCurrent.close < bottom) {
          newFvg.isInverted = true;
          newFvg.invertedAtIndex = j;
          newFvg.invertedType = 'bullish_to_bearish';
          newFvg.isMitigated = true; // Once inverted, it is no longer an active bullish gap
          
          // Count retests/touches of this IFG after inversion
          for (let k = j + 1; k < candles.length; k++) {
            if (candles[k].low <= top && candles[k].high >= bottom) {
              touchCount++;
            }
          }
          break; // Stop tracking as a bullish FVG
        }
        
        // Check for normal mitigation: Low of candle dips below top of FVG
        if (!newFvg.isMitigated && cCurrent.low <= top) {
          newFvg.isMitigated = true;
          newFvg.mitigatedByIndex = j;
        }
      }
      newFvg.touchCount = touchCount;
      
      fvgs.push(newFvg);
    }

    // Bearish FVG: High of c3 is lower than Low of c1, with a bearish c2 expansion
    if (c3.high < c1.low && c2.close < c2.open) {
      const top = c1.low;
      const bottom = c3.high;
      
      const newFvg: FVG = {
        id: `fvg-bear-${i}`,
        type: 'bearish',
        top,
        bottom,
        candleIndex: i - 1,
        startIndex: i - 2,
        endIndex: i,
        isMitigated: false,
        mitigatedByIndex: null,
        isInverted: false,
        invertedAtIndex: null,
        invertedType: null,
        touchCount: 0,
      };

      // Track forward
      let touchCount = 0;
      for (let j = i + 1; j < candles.length; j++) {
        const cCurrent = candles[j];
        
        // Count how many times candles retest or enter the gap range [bottom, top]
        if (cCurrent.low <= top && cCurrent.high >= bottom) {
          touchCount++;
        }

        // Check for inversion (Inverted FVG): A candle body closes above the top of the bearish FVG
        if (cCurrent.close > top) {
          newFvg.isInverted = true;
          newFvg.invertedAtIndex = j;
          newFvg.invertedType = 'bearish_to_bullish';
          newFvg.isMitigated = true;

          // Count retests/touches of this IFG after inversion
          for (let k = j + 1; k < candles.length; k++) {
            if (candles[k].low <= top && candles[k].high >= bottom) {
              touchCount++;
            }
          }
          break; // Stop tracking
        }

        // Check for normal mitigation: High of candle rallies above bottom of FVG
        if (!newFvg.isMitigated && cCurrent.high >= bottom) {
          newFvg.isMitigated = true;
          newFvg.mitigatedByIndex = j;
        }
      }
      newFvg.touchCount = touchCount;

      fvgs.push(newFvg);
    }
  }

  // --- 2. DETECT MARKET STRUCTURE SHIFTS (MSS) & BREAK OF STRUCTURE (BOS) ---
  const { swingHighs, swingLows } = detectSwingLevels(candles, 2);
  const activeSwingHighs = [...swingHighs];
  const activeSwingLows = [...swingLows];

  // Track structure breaks
  for (let i = 4; i < candles.length; i++) {
    const currentCandle = candles[i];

    // Check for Bullish break (closing above the most recent key Swing High)
    // We search active swing highs established before this candle
    const validSwingHighs = activeSwingHighs.filter(h => h.index < i - 1);
    if (validSwingHighs.length > 0) {
      // Get the nearest previous swing high that hasn't been broken yet
      const nearestHigh = validSwingHighs[validSwingHighs.length - 1];
      if (currentCandle.close > nearestHigh.price) {
        // We have a bullish break!
        // Is it a trend continuation (BOS) or shift (MSS)?
        // Simple heuristic: if price was on a downward trend (recent candles making lower lows), it's MSS. Else, BOS.
        let isReversal = false;
        const trendLookback = Math.max(0, nearestHigh.index - 10);
        let lowerHighCount = 0;
        for (let t = trendLookback; t < nearestHigh.index; t++) {
          if (candles[t].high < candles[Math.max(0, t - 5)].high) {
            lowerHighCount++;
          }
        }
        isReversal = lowerHighCount > 3;

        marketStructures.push({
          id: `ms-bull-${i}`,
          type: 'bullish',
          style: isReversal ? 'MSS' : 'BOS',
          price: nearestHigh.price,
          candleIndex: i,
          levelIndex: nearestHigh.index,
        });

        // Remove this swing high from active list so we don't break it again
        const indexInActive = activeSwingHighs.findIndex(h => h.index === nearestHigh.index);
        if (indexInActive !== -1) {
          activeSwingHighs.splice(indexInActive, 1);
        }
      }
    }

    // Check for Bearish break (closing below the most recent key Swing Low)
    const validSwingLows = activeSwingLows.filter(l => l.index < i - 1);
    if (validSwingLows.length > 0) {
      const nearestLow = validSwingLows[validSwingLows.length - 1];
      if (currentCandle.close < nearestLow.price) {
        let isReversal = false;
        const trendLookback = Math.max(0, nearestLow.index - 10);
        let higherLowCount = 0;
        for (let t = trendLookback; t < nearestLow.index; t++) {
          if (candles[t].low > candles[Math.max(0, t - 5)].low) {
            higherLowCount++;
          }
        }
        isReversal = higherLowCount > 3;

        marketStructures.push({
          id: `ms-bear-${i}`,
          type: 'bearish',
          style: isReversal ? 'MSS' : 'BOS',
          price: nearestLow.price,
          candleIndex: i,
          levelIndex: nearestLow.index,
        });

        // Remove from active list
        const indexInActive = activeSwingLows.findIndex(l => l.index === nearestLow.index);
        if (indexInActive !== -1) {
          activeSwingLows.splice(indexInActive, 1);
        }
      }
    }
  }

  // --- 3. DETECT ORDER BLOCKS (OB) ---
  // When an MSS/BOS is detected, the last opposite candle before the move that caused the break is the Order Block
  marketStructures.forEach(ms => {
    const breakIndex = ms.candleIndex;
    const levelIndex = ms.levelIndex;

    if (ms.type === 'bullish') {
      // Find the lowest bearish candle in the range immediately preceding the break (from levelIndex down to Math.max(0, levelIndex-5))
      let lowestBearishCandleIndex = -1;
      let lowestPrice = Infinity;

      const startLookback = Math.max(0, levelIndex - 4);
      for (let k = startLookback; k <= breakIndex; k++) {
        const c = candles[k];
        if (c.close < c.open && c.low < lowestPrice) {
          lowestPrice = c.low;
          lowestBearishCandleIndex = k;
        }
      }

      if (lowestBearishCandleIndex !== -1) {
        const obCandle = candles[lowestBearishCandleIndex];
        const alreadyExists = orderBlocks.some(ob => ob.candleIndex === lowestBearishCandleIndex);
        if (!alreadyExists) {
          orderBlocks.push({
            id: `ob-bull-${lowestBearishCandleIndex}`,
            type: 'bullish',
            top: Math.max(obCandle.open, obCandle.close),
            bottom: obCandle.low,
            candleIndex: lowestBearishCandleIndex,
            strength: ms.style === 'MSS' ? 'strong' : 'medium',
          });
        }
      }
    } else {
      // Bearish OB: Find the highest bullish candle preceding the break
      let highestBullishCandleIndex = -1;
      let highestPrice = -Infinity;

      const startLookback = Math.max(0, levelIndex - 4);
      for (let k = startLookback; k <= breakIndex; k++) {
        const c = candles[k];
        if (c.close > c.open && c.high > highestPrice) {
          highestPrice = c.high;
          highestBullishCandleIndex = k;
        }
      }

      if (highestBullishCandleIndex !== -1) {
        const obCandle = candles[highestBullishCandleIndex];
        const alreadyExists = orderBlocks.some(ob => ob.candleIndex === highestBullishCandleIndex);
        if (!alreadyExists) {
          orderBlocks.push({
            id: `ob-bear-${highestBullishCandleIndex}`,
            type: 'bearish',
            top: obCandle.high,
            bottom: Math.min(obCandle.open, obCandle.close),
            candleIndex: highestBullishCandleIndex,
            strength: ms.style === 'MSS' ? 'strong' : 'medium',
          });
        }
      }
    }
  });

  // --- 3.5. DETECT INDUCEMENTS (IDM) & CISD ---
  const inducements: Inducement[] = [];
  
  swingLows.forEach(sl => {
    let isSwept = false;
    let sweptAtIndex: number | null = null;
    
    for (let j = sl.index + 1; j < candles.length; j++) {
      if (candles[j].low < sl.price) {
        isSwept = true;
        sweptAtIndex = j;
        break;
      }
    }
    
    inducements.push({
      id: `idm-bull-${sl.index}`,
      type: 'bullish',
      price: sl.price,
      candleIndex: sl.index,
      sweptAtIndex,
      isSwept
    });
  });

  swingHighs.forEach(sh => {
    let isSwept = false;
    let sweptAtIndex: number | null = null;
    
    for (let j = sh.index + 1; j < candles.length; j++) {
      if (candles[j].high > sh.price) {
        isSwept = true;
        sweptAtIndex = j;
        break;
      }
    }
    
    inducements.push({
      id: `idm-bear-${sh.index}`,
      type: 'bearish',
      price: sh.price,
      candleIndex: sh.index,
      sweptAtIndex,
      isSwept
    });
  });

  // Detect Change in State of Delivery (CISD)
  const cisds = detectCISD(candles, swingHighs, swingLows);

  // --- 4. CALCULATE OVERALL TREND DIRECTION ---
  let trend: 'bullish' | 'bearish' | 'sideways' = 'sideways';
  if (marketStructures.length > 0) {
    const recentStructures = marketStructures.slice(-3);
    const bullishCount = recentStructures.filter(ms => ms.type === 'bullish').length;
    const bearishCount = recentStructures.filter(ms => ms.type === 'bearish').length;
    if (bullishCount > bearishCount) trend = 'bullish';
    else if (bearishCount > bullishCount) trend = 'bearish';
  } else {
    // Simple EMA/MA style trend fallback
    const last30 = candles.slice(-30);
    let upDays = 0;
    last30.forEach(c => { if (c.close > c.open) upDays++; });
    if (upDays > 17) trend = 'bullish';
    else if (upDays < 13) trend = 'bearish';
  }

  // Helper for Optimal Trade Entry (OTE) Zone (62% - 79% Fibonacci Retracement)
  const calculateOteZone = (type: 'BUY' | 'SELL', entryPrice: number, stopLoss: number, currentCandles: Candle[]): OteZone => {
    const lastIdx = currentCandles.length - 1;
    const lookback = currentCandles.slice(Math.max(0, lastIdx - 20), lastIdx);
    
    let swL = Math.min(...lookback.map(c => c.low));
    let swH = Math.max(...lookback.map(c => c.high));
    
    if (type === 'BUY') {
      if (swL >= entryPrice) {
        swL = stopLoss;
      }
      if (swH <= entryPrice) {
        swH = entryPrice * 1.02;
      }
      const diff = swH - swL;
      return {
        low: Number((swH - diff * 0.79).toFixed(4)),
        high: Number((swH - diff * 0.62).toFixed(4)),
        fib62: Number((swH - diff * 0.62).toFixed(4)),
        fib705: Number((swH - diff * 0.705).toFixed(4)),
        fib79: Number((swH - diff * 0.79).toFixed(4)),
        swingLow: Number(swL.toFixed(4)),
        swingHigh: Number(swH.toFixed(4)),
      };
    } else {
      if (swH <= entryPrice) {
        swH = stopLoss;
      }
      if (swL >= entryPrice) {
        swL = entryPrice * 0.98;
      }
      const diff = swH - swL;
      return {
        low: Number((swL + diff * 0.62).toFixed(4)),
        high: Number((swL + diff * 0.79).toFixed(4)),
        fib62: Number((swL + diff * 0.62).toFixed(4)),
        fib705: Number((swL + diff * 0.705).toFixed(4)),
        fib79: Number((swL + diff * 0.79).toFixed(4)),
        swingLow: Number(swL.toFixed(4)),
        swingHigh: Number(swH.toFixed(4)),
      };
    }
  };

  // Helper for Price Action confirmation signals on retests
  const detectPriceActionConfirmation = (currentCandles: Candle[], type: 'BUY' | 'SELL'): string => {
    if (currentCandles.length < 2) return 'Rejeksi Struktur Valid';
    const last = currentCandles[currentCandles.length - 1];
    const prev = currentCandles[currentCandles.length - 2];
    const lastBody = Math.abs(last.close - last.open);
    const lastRange = last.high - last.low;
    
    if (type === 'BUY') {
      const lowerWick = Math.min(last.open, last.close) - last.low;
      if (lowerWick > lastBody * 1.5 && lastRange > 0) {
        return "Bullish Hammer / Pin Bar (Rejeksi Bawah Kuat)";
      }
      if (last.close > last.open && prev.close < prev.open && last.close > prev.open) {
        return "Bullish Engulfing Pattern (Konfirmasi Pembalikan)";
      }
      return "Bullish Rejection Block (Mitigasi Order Institusional)";
    } else {
      const upperWick = last.high - Math.max(last.open, last.close);
      if (upperWick > lastBody * 1.5 && lastRange > 0) {
        return "Bearish Shooting Star / Pin Bar (Rejeksi Atas Kuat)";
      }
      if (last.close < last.open && prev.close > prev.open && last.close < prev.low) {
        return "Bearish Engulfing Pattern (Tekanan Jual Kuat)";
      }
      return "Bearish Rejection Block (Mitigasi Order Penjualan)";
    }
  };

  // --- 5. GENERATE HIGH PROBABILITY SIGNAL ---
  let activeSignal: TradingSignal | null = null;
  const lastIndex = candles.length - 1;
  const currentCandle = candles[lastIndex];

  // Detect major SSL (Sell-Side Liquidity) and BSL (Buy-Side Liquidity) in recent candles
  const recentHighs = swingHighs.filter(h => h.index >= lastIndex - 35 && h.index < lastIndex);
  const recentLows = swingLows.filter(l => l.index >= lastIndex - 35 && l.index < lastIndex);

  const BSL = recentHighs.length > 0 
    ? Math.max(...recentHighs.map(h => h.price)) 
    : Math.max(...candles.slice(Math.max(0, lastIndex - 30), lastIndex).map(c => c.high));

  const SSL = recentLows.length > 0 
    ? Math.min(...recentLows.map(l => l.price)) 
    : Math.min(...candles.slice(Math.max(0, lastIndex - 30), lastIndex).map(c => c.low));

  const range = BSL - SSL;

  const getLevelsForBuy = () => {
    const sl = SSL;
    const entryMin = SSL + range * 0.21;
    const entryMax = SSL + range * 0.38;
    const entryPrice = SSL + range * 0.295;
    
    const tp1 = BSL + range * 0.272;
    const tp2 = BSL + range * 0.618;
    const tp3 = BSL + range * 1.000;
    
    const rrr = Number(((tp3 - entryPrice) / (entryPrice - sl)).toFixed(1));
    
    return { sl, entryMin, entryMax, entryPrice, tp1, tp2, tp3, rrr };
  };

  const getLevelsForSell = () => {
    const sl = BSL;
    const entryMin = BSL - range * 0.38;
    const entryMax = BSL - range * 0.21;
    const entryPrice = BSL - range * 0.295;
    
    const tp1 = SSL - range * 0.272;
    const tp2 = SSL - range * 0.618;
    const tp3 = SSL - range * 1.000;
    
    const rrr = Number(((entryPrice - tp3) / (sl - entryPrice)).toFixed(1));
    
    return { sl, entryMin, entryMax, entryPrice, tp1, tp2, tp3, rrr };
  };

  const activeInversions = fvgs.filter(f => f.isInverted);
  const activeOBs = orderBlocks;

  // --- METODE UTAMA USER: BSL / SSL SWEPT + CISD + FVG RETRACE (D1/H4/H1 -> M15/M5) ---
  const latestCISD = cisds.length > 0 ? cisds[cisds.length - 1] : null;
  const htfContext = buildHTFContext(timeframe, trend, BSL, SSL);

  if (latestCISD && lastIndex - latestCISD.candleIndex <= 25) {
    if (latestCISD.type === 'bullish') {
      const levels = getLevelsForBuy();
      const bullishFVG = fvgs.find(f => f.type === 'bullish' && f.candleIndex >= latestCISD.candleIndex - 3);

      activeSignal = {
        id: `sig-cisd-bull-${lastIndex}`,
        type: 'BUY',
        symbol,
        timeframe,
        entryRange: { 
          min: bullishFVG ? Number((bullishFVG.bottom * 0.9995).toFixed(4)) : Number(levels.entryMin.toFixed(4)), 
          max: bullishFVG ? Number((bullishFVG.top * 1.0005).toFixed(4)) : Number(levels.entryMax.toFixed(4)) 
        },
        stopLoss: Number(levels.sl.toFixed(4)),
        takeProfit1: Number(levels.tp1.toFixed(4)),
        takeProfit2: Number(levels.tp2.toFixed(4)),
        takeProfit3: Number(levels.tp3.toFixed(4)),
        riskRewardRatio: levels.rrr,
        setupType: 'SSL Sweep + Bullish CISD + FVG Retrace',
        explanation: `🎯 [METODE BSL/SSL + CISD + FVG RETRACE]:\n1. Sell-Side Liquidity (SSL: $${latestCISD.sweptPrice.toFixed(2)}) TERJEMPUT oleh Smart Money.\n2. CISD (Change in State of Delivery) terkonfirmasi di level $${latestCISD.price.toFixed(2)} membalikkan pengiriman harga ke Beli.\n3. HTF (${htfContext.htfTimeframe}) mengindikasikan retrace ke zona diskon.\n4. Konfirmasi FVG Retrace aktif di M15/M5 ($${levels.entryMin.toFixed(2)} - $${levels.entryMax.toFixed(2)}) untuk eksekusi BUY!`,
        timestamp: Date.now(),
        status: 'pending',
        priceActionConfirmation: `SSL Terjemput + CISD Bullish ($${latestCISD.price.toFixed(2)}) + FVG Retrace ✓`,
        oteZone: calculateOteZone('BUY', levels.entryPrice, levels.sl, candles),
        bsl: Number(BSL.toFixed(4)),
        ssl: Number(SSL.toFixed(4)),
        cisd: latestCISD,
        htfContext,
      };
    } else if (latestCISD.type === 'bearish') {
      const levels = getLevelsForSell();
      const bearishFVG = fvgs.find(f => f.type === 'bearish' && f.candleIndex >= latestCISD.candleIndex - 3);

      activeSignal = {
        id: `sig-cisd-bear-${lastIndex}`,
        type: 'SELL',
        symbol,
        timeframe,
        entryRange: { 
          min: bearishFVG ? Number((bearishFVG.bottom * 0.9995).toFixed(4)) : Number(levels.entryMin.toFixed(4)), 
          max: bearishFVG ? Number((bearishFVG.top * 1.0005).toFixed(4)) : Number(levels.entryMax.toFixed(4)) 
        },
        stopLoss: Number(levels.sl.toFixed(4)),
        takeProfit1: Number(levels.tp1.toFixed(4)),
        takeProfit2: Number(levels.tp2.toFixed(4)),
        takeProfit3: Number(levels.tp3.toFixed(4)),
        riskRewardRatio: levels.rrr,
        setupType: 'BSL Sweep + Bearish CISD + FVG Retrace',
        explanation: `🎯 [METODE BSL/SSL + CISD + FVG RETRACE]:\n1. Buy-Side Liquidity (BSL: $${latestCISD.sweptPrice.toFixed(2)}) TERJEMPUT oleh Smart Money.\n2. CISD (Change in State of Delivery) terkonfirmasi di level $${latestCISD.price.toFixed(2)} membalikkan pengiriman harga ke Jual.\n3. HTF (${htfContext.htfTimeframe}) mengindikasikan retrace ke zona premium.\n4. Konfirmasi FVG Retrace aktif di M15/M5 ($${levels.entryMin.toFixed(2)} - $${levels.entryMax.toFixed(2)}) untuk eksekusi SELL!`,
        timestamp: Date.now(),
        status: 'pending',
        priceActionConfirmation: `BSL Terjemput + CISD Bearish ($${latestCISD.price.toFixed(2)}) + FVG Retrace ✓`,
        oteZone: calculateOteZone('SELL', levels.entryPrice, levels.sl, candles),
        bsl: Number(BSL.toFixed(4)),
        ssl: Number(SSL.toFixed(4)),
        cisd: latestCISD,
        htfContext,
      };
    }
  }

  // --- SMC STRATEGI: IDM + KONFIRMASI IFG TRIGGER ---
  // "Buat signal jika idm sudah terbentuk sebelumnya terus ketemu ifg sebagai konfirmasi"
  const recentBullishIDM = inducements.find(idm => 
    idm.type === 'bullish' && 
    (idm.isSwept || lastIndex - idm.candleIndex <= 25)
  );

  const recentBearishIDM = inducements.find(idm => 
    idm.type === 'bearish' && 
    (idm.isSwept || lastIndex - idm.candleIndex <= 25)
  );

  const latestBullIFG = activeInversions.find(f => f.invertedType === 'bearish_to_bullish');
  const latestBearIFG = activeInversions.find(f => f.invertedType === 'bullish_to_bearish');

  if (recentBullishIDM && latestBullIFG && latestBullIFG.invertedAtIndex !== null && latestBullIFG.invertedAtIndex >= recentBullishIDM.candleIndex) {
    const levels = getLevelsForBuy();
    activeSignal = {
      id: `sig-idm-ifg-bull-${lastIndex}`,
      type: 'BUY',
      symbol,
      timeframe,
      entryRange: { min: Number(levels.entryMin.toFixed(4)), max: Number(levels.entryMax.toFixed(4)) },
      stopLoss: Number(levels.sl.toFixed(4)),
      takeProfit1: Number(levels.tp1.toFixed(4)),
      takeProfit2: Number(levels.tp2.toFixed(4)),
      takeProfit3: Number(levels.tp3.toFixed(4)),
      riskRewardRatio: levels.rrr,
      setupType: 'IDM + IFG Confirmation',
      explanation: `🚀 [SMC STRATEGI: IDM + KONFIRMASI IFG]: Inducement (IDM pada level ${recentBullishIDM.price.toFixed(2)}) telah terbentuk sebelumnya sebagai perangkap likuiditas retail, dan kini berhasil terkonfirmasi dengan hadirnya Inversion Fair Value Gap (IFG) Bullish pada level ${latestBullIFG.bottom.toFixed(2)} - ${latestBullIFG.top.toFixed(2)}. Penembusan ke atas ini memvalidasi kekuatan minat beli institusional (Smart Money) untuk mendorong harga ke target likuiditas berikutnya!`,
      timestamp: Date.now(),
      status: 'pending',
      priceActionConfirmation: `IDM Terbentuk + Konfirmasi IFG Aktif ✓`,
      oteZone: calculateOteZone('BUY', levels.entryPrice, levels.sl, candles),
      bsl: Number(BSL.toFixed(4)),
      ssl: Number(SSL.toFixed(4)),
    };
  } else if (recentBearishIDM && latestBearIFG && latestBearIFG.invertedAtIndex !== null && latestBearIFG.invertedAtIndex >= recentBearishIDM.candleIndex) {
    const levels = getLevelsForSell();
    activeSignal = {
      id: `sig-idm-ifg-bear-${lastIndex}`,
      type: 'SELL',
      symbol,
      timeframe,
      entryRange: { min: Number(levels.entryMin.toFixed(4)), max: Number(levels.entryMax.toFixed(4)) },
      stopLoss: Number(levels.sl.toFixed(4)),
      takeProfit1: Number(levels.tp1.toFixed(4)),
      takeProfit2: Number(levels.tp2.toFixed(4)),
      takeProfit3: Number(levels.tp3.toFixed(4)),
      riskRewardRatio: levels.rrr,
      setupType: 'IDM + IFG Confirmation',
      explanation: `🔥 [SMC STRATEGI: IDM + KONFIRMASI IFG]: Inducement (IDM pada level ${recentBearishIDM.price.toFixed(2)}) telah terbentuk sebelumnya sebagai perangkap likuiditas retail, dan kini berhasil terkonfirmasi dengan hadirnya Inversion Fair Value Gap (IFG) Bearish pada level ${latestBearIFG.bottom.toFixed(2)} - ${latestBearIFG.top.toFixed(2)}. Penembusan ke bawah ini memvalidasi kekuatan minat jual institusional (Smart Money) untuk mendorong harga ke target likuiditas berikutnya!`,
      timestamp: Date.now(),
      status: 'pending',
      priceActionConfirmation: `IDM Terbentuk + Konfirmasi IFG Aktif ✓`,
      oteZone: calculateOteZone('SELL', levels.entryPrice, levels.sl, candles),
      bsl: Number(BSL.toFixed(4)),
      ssl: Number(SSL.toFixed(4)),
    };
  }

  // --- PRIORITY IFG INSTANT TRIGGER ---
  // "Ketika ada ifg langsung berikan signalnya"
  const latestInversion = activeInversions.reduce((latest, f) => {
    if (f.invertedAtIndex === null) return latest;
    if (!latest || (latest.invertedAtIndex !== null && f.invertedAtIndex > latest.invertedAtIndex)) {
      return f;
    }
    return latest;
  }, null as FVG | null);

  if (!activeSignal && latestInversion) {
    if (latestInversion.invertedType === 'bearish_to_bullish') {
      const levels = getLevelsForBuy();
      activeSignal = {
        id: `sig-ifg-instan-bull-${lastIndex}`,
        type: 'BUY',
        symbol,
        timeframe,
        entryRange: { min: Number(levels.entryMin.toFixed(4)), max: Number(levels.entryMax.toFixed(4)) },
        stopLoss: Number(levels.sl.toFixed(4)),
        takeProfit1: Number(levels.tp1.toFixed(4)),
        takeProfit2: Number(levels.tp2.toFixed(4)),
        takeProfit3: Number(levels.tp3.toFixed(4)),
        riskRewardRatio: levels.rrr,
        setupType: 'Inversion FVG (IFG) Instan',
        explanation: `🚀 [IFG TERDETEKSI - EKSEKUSI INSTAN]: Terdeteksi Inversion Fair Value Gap (IFG) Bullish pada level ${latestInversion.bottom.toFixed(2)} - ${latestInversion.top.toFixed(2)} (terbentuk pada candle ke-${latestInversion.invertedAtIndex}). Ketika gap bearish ditembus ke arah atas dan ditutup oleh badan candle, ini langsung memicu sinyal beli institusional berprobabilitas sangat tinggi tanpa perlu menunggu konfirmasi lain!`,
        timestamp: Date.now(),
        status: 'pending',
        priceActionConfirmation: `Inversion FVG (IFG) Bullish Aktif ✓`,
        oteZone: calculateOteZone('BUY', levels.entryPrice, levels.sl, candles),
        bsl: Number(BSL.toFixed(4)),
        ssl: Number(SSL.toFixed(4)),
      };
    } else if (latestInversion.invertedType === 'bullish_to_bearish') {
      const levels = getLevelsForSell();
      activeSignal = {
        id: `sig-ifg-instan-bear-${lastIndex}`,
        type: 'SELL',
        symbol,
        timeframe,
        entryRange: { min: Number(levels.entryMin.toFixed(4)), max: Number(levels.entryMax.toFixed(4)) },
        stopLoss: Number(levels.sl.toFixed(4)),
        takeProfit1: Number(levels.tp1.toFixed(4)),
        takeProfit2: Number(levels.tp2.toFixed(4)),
        takeProfit3: Number(levels.tp3.toFixed(4)),
        riskRewardRatio: levels.rrr,
        setupType: 'Inversion FVG (IFG) Instan',
        explanation: `🔥 [IFG TERDETEKSI - EKSEKUSI INSTAN]: Terdeteksi Inversion Fair Value Gap (IFG) Bearish pada level ${latestInversion.bottom.toFixed(2)} - ${latestInversion.top.toFixed(2)} (terbentuk pada candle ke-${latestInversion.invertedAtIndex}). Ketika gap bullish ditembus ke arah bawah dan ditutup oleh badan candle, ini langsung memicu sinyal jual institusional berprobabilitas sangat tinggi tanpa perlu menunggu konfirmasi lain!`,
        timestamp: Date.now(),
        status: 'pending',
        priceActionConfirmation: `Inversion FVG (IFG) Bearish Aktif ✓`,
        oteZone: calculateOteZone('SELL', levels.entryPrice, levels.sl, candles),
        bsl: Number(BSL.toFixed(4)),
        ssl: Number(SSL.toFixed(4)),
      };
    }
  }

  // --- INDUCEMENT (IDM) SWEEP FILTERING ---
  // A valid SMC setup requires price to have swept minor retail liquidity (Inducement) 
  // before a high-probability institutional signal is confirmed. This eliminates fake breakouts.
  const recentBullishIDMSweep = inducements.find(idm => 
    idm.type === 'bullish' && 
    idm.isSwept && 
    idm.sweptAtIndex !== null && 
    lastIndex - idm.sweptAtIndex <= 25 // Lookback 25 candles
  );

  const recentBearishIDMSweep = inducements.find(idm => 
    idm.type === 'bearish' && 
    idm.isSwept && 
    idm.sweptAtIndex !== null && 
    lastIndex - idm.sweptAtIndex <= 25 // Lookback 25 candles
  );

  // Check if price is approaching or recently swept SSL / BSL
  const isNearSSL = candles.slice(-5).some(c => c.low <= SSL * 1.015);
  const isNearBSL = candles.slice(-5).some(c => c.high >= BSL * 0.985);

  // Check 1: Inversion FVG (ICT IFG) passing through Order Block (Highest Priority, No Retest Required)
  const bullIFGOverlapsOB = latestBullIFG && activeOBs.some(ob => latestBullIFG.bottom <= ob.top && latestBullIFG.top >= ob.bottom);
  const bearIFGOverlapsOB = latestBearIFG && activeOBs.some(ob => latestBearIFG.bottom <= ob.top && latestBearIFG.top >= ob.bottom);

  if (!activeSignal && bullIFGOverlapsOB && latestBullIFG && recentBullishIDMSweep) {
    const levels = getLevelsForBuy();
    const overlappingOB = activeOBs.find(ob => latestBullIFG.bottom <= ob.top && latestBullIFG.top >= ob.bottom);
    const obPrice = overlappingOB ? (overlappingOB.top + overlappingOB.bottom) / 2 : 0;

    activeSignal = {
      id: `sig-ifvg-ob-bull-${lastIndex}`,
      type: 'BUY',
      symbol,
      timeframe,
      entryRange: { min: Number(levels.entryMin.toFixed(4)), max: Number(levels.entryMax.toFixed(4)) },
      stopLoss: Number(levels.sl.toFixed(4)),
      takeProfit1: Number(levels.tp1.toFixed(4)),
      takeProfit2: Number(levels.tp2.toFixed(4)),
      takeProfit3: Number(levels.tp3.toFixed(4)),
      riskRewardRatio: levels.rrr,
      setupType: 'Inversion FVG + Order Block Convergence',
      explanation: `🔥 [KONFIRMASI IFG + OB]: Terdeteksi konfirmasi IFG terbaru yang menembus area Order Block setelah sukses menyapu Inducement (IDM pada ${recentBullishIDMSweep.price.toFixed(2)}) untuk menyapu liquidity trap retail. Sinyal pembalikan terkonfirmasi kuat tanpa retest!`,
      timestamp: Date.now(),
      status: 'pending',
      priceActionConfirmation: `IFG Melewati Order Block + IDM Sweep ✓`,
      oteZone: calculateOteZone('BUY', levels.entryPrice, levels.sl, candles),
      bsl: Number(BSL.toFixed(4)),
      ssl: Number(SSL.toFixed(4)),
    };
  } else if (bearIFGOverlapsOB && latestBearIFG && recentBearishIDMSweep) {
    const levels = getLevelsForSell();
    const overlappingOB = activeOBs.find(ob => latestBearIFG.bottom <= ob.top && latestBearIFG.top >= ob.bottom);
    const obPrice = overlappingOB ? (overlappingOB.top + overlappingOB.bottom) / 2 : 0;

    activeSignal = {
      id: `sig-ifvg-ob-bear-${lastIndex}`,
      type: 'SELL',
      symbol,
      timeframe,
      entryRange: { min: Number(levels.entryMin.toFixed(4)), max: Number(levels.entryMax.toFixed(4)) },
      stopLoss: Number(levels.sl.toFixed(4)),
      takeProfit1: Number(levels.tp1.toFixed(4)),
      takeProfit2: Number(levels.tp2.toFixed(4)),
      takeProfit3: Number(levels.tp3.toFixed(4)),
      riskRewardRatio: levels.rrr,
      setupType: 'Inversion FVG + Order Block Convergence',
      explanation: `🔥 [KONFIRMASI IFG + OB]: Terdeteksi konfirmasi IFG terbaru yang menembus area Order Block setelah sukses menyapu Inducement (IDM pada ${recentBearishIDMSweep.price.toFixed(2)}) untuk menyapu liquidity trap retail. Sinyal pembalikan terkonfirmasi kuat tanpa retest!`,
      timestamp: Date.now(),
      status: 'pending',
      priceActionConfirmation: `IFG Melewati Order Block + IDM Sweep ✓`,
      oteZone: calculateOteZone('SELL', levels.entryPrice, levels.sl, candles),
      bsl: Number(BSL.toFixed(4)),
      ssl: Number(SSL.toFixed(4)),
    };
  }

  // Check 1.5: Standard Inversion FVG (ICT IFG) Setup (Retest or recent formation fallback)
  if (!activeSignal) {
    const bullInversionRetest = activeInversions.find(f => 
      f.invertedType === 'bearish_to_bullish' && (
        (currentCandle.low <= f.top && currentCandle.close >= f.bottom - (f.top - f.bottom) * 0.1) ||
        (f.invertedAtIndex !== null && lastIndex - f.invertedAtIndex <= 5)
      )
    );

    const bearInversionRetest = activeInversions.find(f => 
      f.invertedType === 'bullish_to_bearish' && (
        (currentCandle.high >= f.bottom && currentCandle.close <= f.top + (f.top - f.bottom) * 0.1) ||
        (f.invertedAtIndex !== null && lastIndex - f.invertedAtIndex <= 5)
      )
    );

    if (bullInversionRetest && recentBullishIDMSweep) {
      const levels = getLevelsForBuy();
      const isSslConfirmed = isNearSSL;
      const isRecentFormation = bullInversionRetest.invertedAtIndex !== null && lastIndex - bullInversionRetest.invertedAtIndex <= 5;

      activeSignal = {
        id: `sig-ifvg-bull-${lastIndex}`,
        type: 'BUY',
        symbol,
        timeframe,
        entryRange: { min: Number(levels.entryMin.toFixed(4)), max: Number(levels.entryMax.toFixed(4)) },
        stopLoss: Number(levels.sl.toFixed(4)),
        takeProfit1: Number(levels.tp1.toFixed(4)),
        takeProfit2: Number(levels.tp2.toFixed(4)),
        takeProfit3: Number(levels.tp3.toFixed(4)),
        riskRewardRatio: levels.rrr,
        setupType: 'Inversion FVG Retest',
        explanation: isSslConfirmed 
          ? `🔥 [KONFIRMASI SIGNAL UTAMA]: Harga menyapu SSL (${SSL.toFixed(2)}) dan divalidasi oleh sapuan Inducement (IDM pada ${recentBullishIDMSweep.price.toFixed(2)}) beserta IFG aktif sebagai konfirmasi institusi baru. Probabilitas tinggi!`
          : isRecentFormation
            ? `🔥 [KONFIRMASI IFG INSTAN]: Terbentuk Inversion FVG (IFG) Bullish baru setelah menembus Bearish FVG sebelumnya ke arah atas dan menyapu Inducement (IDM pada ${recentBullishIDMSweep.price.toFixed(2)}). Momentum pembeli sangat kuat.`
            : `Harga menembus Bearish FVG sebelumnya ke atas (Inversion FVG) dan mengaktifkan level diskon setelah menyapu Inducement (IDM pada ${recentBullishIDMSweep.price.toFixed(2)}). Retest area divalidasi di zona OTE diskon.`,
        timestamp: Date.now(),
        status: 'pending',
        priceActionConfirmation: isSslConfirmed
          ? `IFG + SSL Sweep + IDM Sweep ✓`
          : isRecentFormation
            ? `Pembentukan IFG Bullish + IDM Sweep ✓`
            : `Retest IFG + IDM Sweep ✓`,
        oteZone: calculateOteZone('BUY', levels.entryPrice, levels.sl, candles),
        bsl: Number(BSL.toFixed(4)),
        ssl: Number(SSL.toFixed(4)),
      };
    } else if (bearInversionRetest && recentBearishIDMSweep) {
      const levels = getLevelsForSell();
      const isBslConfirmed = isNearBSL;
      const isRecentFormation = bearInversionRetest.invertedAtIndex !== null && lastIndex - bearInversionRetest.invertedAtIndex <= 5;

      activeSignal = {
        id: `sig-ifvg-bear-${lastIndex}`,
        type: 'SELL',
        symbol,
        timeframe,
        entryRange: { min: Number(levels.entryMin.toFixed(4)), max: Number(levels.entryMax.toFixed(4)) },
        stopLoss: Number(levels.sl.toFixed(4)),
        takeProfit1: Number(levels.tp1.toFixed(4)),
        takeProfit2: Number(levels.tp2.toFixed(4)),
        takeProfit3: Number(levels.tp3.toFixed(4)),
        riskRewardRatio: levels.rrr,
        setupType: 'Inversion FVG Retest',
        explanation: isBslConfirmed
          ? `🔥 [KONFIRMASI SIGNAL UTAMA]: Harga menyapu BSL (${BSL.toFixed(2)}) dan divalidasi oleh sapuan Inducement (IDM pada ${recentBearishIDMSweep.price.toFixed(2)}) beserta IFG aktif sebagai konfirmasi institusi baru. Probabilitas tinggi!`
          : isRecentFormation
            ? `🔥 [KONFIRMASI IFG INSTAN]: Terbentuk Inversion FVG (IFG) Bearish baru setelah menembus Bullish FVG sebelumnya ke arah bawah dan menyapu Inducement (IDM pada ${recentBearishIDMSweep.price.toFixed(2)}). Momentum penjual sangat kuat.`
            : `Harga menembus Bullish FVG sebelumnya ke bawah (Inversion FVG) dan mengaktifkan level premium setelah menyapu Inducement (IDM pada ${recentBearishIDMSweep.price.toFixed(2)}). Retest area divalidasi di zona OTE premium.`,
        timestamp: Date.now(),
        status: 'pending',
        priceActionConfirmation: isBslConfirmed
          ? `IFG + BSL Sweep + IDM Sweep ✓`
          : isRecentFormation
            ? `Pembentukan IFG Bearish + IDM Sweep ✓`
            : `Retest IFG + IDM Sweep ✓`,
        oteZone: calculateOteZone('SELL', levels.entryPrice, levels.sl, candles),
        bsl: Number(BSL.toFixed(4)),
        ssl: Number(SSL.toFixed(4)),
      };
    }
  }

  // High-Probability Confirmation Check: Price approaches BSL/SSL and an IFG exists within recent candles
  if (!activeSignal) {
    const hasBullishIFG = activeInversions.some(f => 
      f.invertedType === 'bearish_to_bullish' && 
      f.invertedAtIndex !== null && 
      lastIndex - f.invertedAtIndex <= 10
    );
    const hasBearishIFG = activeInversions.some(f => 
      f.invertedType === 'bullish_to_bearish' && 
      f.invertedAtIndex !== null && 
      lastIndex - f.invertedAtIndex <= 10
    );

    if (isNearSSL && hasBullishIFG && recentBullishIDMSweep) {
      const levels = getLevelsForBuy();
      const matchingIFG = activeInversions.find(f => f.invertedType === 'bearish_to_bullish');

      activeSignal = {
        id: `sig-ifvg-ssl-sweep-${lastIndex}`,
        type: 'BUY',
        symbol,
        timeframe,
        entryRange: { 
          min: matchingIFG ? Number((matchingIFG.bottom * 0.999).toFixed(4)) : Number(levels.entryMin.toFixed(4)), 
          max: matchingIFG ? Number((matchingIFG.top * 1.001).toFixed(4)) : Number(levels.entryMax.toFixed(4)) 
        },
        stopLoss: Number(levels.sl.toFixed(4)),
        takeProfit1: Number(levels.tp1.toFixed(4)),
        takeProfit2: Number(levels.tp2.toFixed(4)),
        takeProfit3: Number(levels.tp3.toFixed(4)),
        riskRewardRatio: levels.rrr,
        setupType: 'Inversion FVG Retest',
        explanation: `🔥 [KONFIRMASI SIGNAL UTAMA]: Harga menyapu SSL (${SSL.toFixed(2)}) dan terkonfirmasi menyapu Inducement (IDM pada ${recentBullishIDMSweep.price.toFixed(2)}) beserta adanya IFG aktif sebagai tanda pembalikan arah institusional berprobabilitas sangat tinggi!`,
        timestamp: Date.now(),
        status: 'pending',
        priceActionConfirmation: `IFG + SSL Sweep + IDM Sweep ✓`,
        oteZone: calculateOteZone('BUY', levels.entryPrice, levels.sl, candles),
        bsl: Number(BSL.toFixed(4)),
        ssl: Number(SSL.toFixed(4)),
      };
    } else if (isNearBSL && hasBearishIFG && recentBearishIDMSweep) {
      const levels = getLevelsForSell();
      const matchingIFG = activeInversions.find(f => f.invertedType === 'bullish_to_bearish');

      activeSignal = {
        id: `sig-ifvg-bsl-sweep-${lastIndex}`,
        type: 'SELL',
        symbol,
        timeframe,
        entryRange: { 
          min: matchingIFG ? Number((matchingIFG.bottom * 0.999).toFixed(4)) : Number(levels.entryMin.toFixed(4)), 
          max: matchingIFG ? Number((matchingIFG.top * 1.001).toFixed(4)) : Number(levels.entryMax.toFixed(4)) 
        },
        stopLoss: Number(levels.sl.toFixed(4)),
        takeProfit1: Number(levels.tp1.toFixed(4)),
        takeProfit2: Number(levels.tp2.toFixed(4)),
        takeProfit3: Number(levels.tp3.toFixed(4)),
        riskRewardRatio: levels.rrr,
        setupType: 'Inversion FVG Retest',
        explanation: `🔥 [KONFIRMASI SIGNAL UTAMA]: Harga menyapu BSL (${BSL.toFixed(2)}) dan terkonfirmasi menyapu Inducement (IDM pada ${recentBearishIDMSweep.price.toFixed(2)}) beserta adanya IFG aktif sebagai tanda pembalikan arah institusional berprobabilitas sangat tinggi!`,
        timestamp: Date.now(),
        status: 'pending',
        priceActionConfirmation: `IFG + BSL Sweep + IDM Sweep ✓`,
        oteZone: calculateOteZone('SELL', levels.entryPrice, levels.sl, candles),
        bsl: Number(BSL.toFixed(4)),
        ssl: Number(SSL.toFixed(4)),
      };
    }
  }

  // Fallback Check 2: Order Block Retest Setup
  if (!activeSignal) {
    const bullOBRetest = activeOBs.find(ob => 
      ob.type === 'bullish' && 
      currentCandle.low <= ob.top && 
      currentCandle.close >= ob.bottom
    );

    const bearOBRetest = activeOBs.find(ob => 
      ob.type === 'bearish' && 
      currentCandle.high >= ob.bottom && 
      currentCandle.close <= ob.top
    );

    if (bullOBRetest && recentBullishIDMSweep) {
      const levels = getLevelsForBuy();

      activeSignal = {
        id: `sig-ob-bull-${lastIndex}`,
        type: 'BUY',
        symbol,
        timeframe,
        entryRange: { min: Number(levels.entryMin.toFixed(4)), max: Number(levels.entryMax.toFixed(4)) },
        stopLoss: Number(levels.sl.toFixed(4)),
        takeProfit1: Number(levels.tp1.toFixed(4)),
        takeProfit2: Number(levels.tp2.toFixed(4)),
        takeProfit3: Number(levels.tp3.toFixed(4)),
        riskRewardRatio: levels.rrr,
        setupType: 'FVG + Order Block mitigation',
        explanation: `Harga memitigasi Bullish Order Block setelah menyapu Inducement (IDM pada ${recentBullishIDMSweep.price.toFixed(2)}) untuk menjerat breakout retail. Entry diset di zona diskon OTE divalidasi oleh sapuan likuiditas.`,
        timestamp: Date.now(),
        status: 'pending',
        priceActionConfirmation: `Mitigasi OB + IDM Sweep ✓`,
        oteZone: calculateOteZone('BUY', levels.entryPrice, levels.sl, candles),
        bsl: Number(BSL.toFixed(4)),
        ssl: Number(SSL.toFixed(4)),
      };
    } else if (bearOBRetest && recentBearishIDMSweep) {
      const levels = getLevelsForSell();

      activeSignal = {
        id: `sig-ob-bear-${lastIndex}`,
        type: 'SELL',
        symbol,
        timeframe,
        entryRange: { min: Number(levels.entryMin.toFixed(4)), max: Number(levels.entryMax.toFixed(4)) },
        stopLoss: Number(levels.sl.toFixed(4)),
        takeProfit1: Number(levels.tp1.toFixed(4)),
        takeProfit2: Number(levels.tp2.toFixed(4)),
        takeProfit3: Number(levels.tp3.toFixed(4)),
        riskRewardRatio: levels.rrr,
        setupType: 'FVG + Order Block mitigation',
        explanation: `Harga memitigasi Bearish Order Block setelah menyapu Inducement (IDM pada ${recentBearishIDMSweep.price.toFixed(2)}) untuk menjerat breakout retail. Entry diset di zona premium OTE divalidasi oleh sapuan likuiditas.`,
        timestamp: Date.now(),
        status: 'pending',
        priceActionConfirmation: `Mitigasi OB + IDM Sweep ✓`,
        oteZone: calculateOteZone('SELL', levels.entryPrice, levels.sl, candles),
        bsl: Number(BSL.toFixed(4)),
        ssl: Number(SSL.toFixed(4)),
      };
    }
  }

  // Fallback Check 3: Simple Liquidity sweep + MSS (within recent candles)
  if (!activeSignal && marketStructures.length > 0) {
    const lastMS = marketStructures[marketStructures.length - 1];
    // If we had a recent MSS in the last 6 candles, generate a trigger limit signal
    if (lastIndex - lastMS.candleIndex <= 6 && lastMS.style === 'MSS') {
      const expansionFvg = fvgs.find(f => f.candleIndex === lastMS.candleIndex - 1 || f.candleIndex === lastMS.candleIndex);
      
      if (lastMS.type === 'bullish' && expansionFvg && !expansionFvg.isMitigated && recentBullishIDMSweep) {
        const levels = getLevelsForBuy();

        activeSignal = {
          id: `sig-mss-bull-${lastIndex}`,
          type: 'BUY',
          symbol,
          timeframe,
          entryRange: { min: Number(levels.entryMin.toFixed(4)), max: Number(levels.entryMax.toFixed(4)) },
          stopLoss: Number(levels.sl.toFixed(4)),
          takeProfit1: Number(levels.tp1.toFixed(4)),
          takeProfit2: Number(levels.tp2.toFixed(4)),
          takeProfit3: Number(levels.tp3.toFixed(4)),
          riskRewardRatio: levels.rrr,
          setupType: 'MSS on Liquidity Sweep',
          explanation: `Market Structure Shift (MSS) ke arah Bullish terkonfirmasi kuat setelah divalidasi oleh sapuan Inducement (IDM pada ${recentBullishIDMSweep.price.toFixed(2)}). Entry diposisikan di zona diskon OTE.`,
          timestamp: Date.now(),
          status: 'pending',
          priceActionConfirmation: `MSS + IDM Sweep ✓`,
          oteZone: calculateOteZone('BUY', levels.entryPrice, levels.sl, candles),
          bsl: Number(BSL.toFixed(4)),
          ssl: Number(SSL.toFixed(4)),
        };
      } else if (lastMS.type === 'bearish' && expansionFvg && !expansionFvg.isMitigated && recentBearishIDMSweep) {
        const levels = getLevelsForSell();

        activeSignal = {
          id: `sig-mss-bear-${lastIndex}`,
          type: 'SELL',
          symbol,
          timeframe,
          entryRange: { min: Number(levels.entryMin.toFixed(4)), max: Number(levels.entryMax.toFixed(4)) },
          stopLoss: Number(levels.sl.toFixed(4)),
          takeProfit1: Number(levels.tp1.toFixed(4)),
          takeProfit2: Number(levels.tp2.toFixed(4)),
          takeProfit3: Number(levels.tp3.toFixed(4)),
          riskRewardRatio: levels.rrr,
          setupType: 'MSS on Liquidity Sweep',
          explanation: `Market Structure Shift (MSS) ke arah Bearish terkonfirmasi kuat setelah divalidasi oleh sapuan Inducement (IDM pada ${recentBearishIDMSweep.price.toFixed(2)}). Entry diposisikan di zona premium OTE.`,
          timestamp: Date.now(),
          status: 'pending',
          priceActionConfirmation: `MSS + IDM Sweep ✓`,
          oteZone: calculateOteZone('SELL', levels.entryPrice, levels.sl, candles),
          bsl: Number(BSL.toFixed(4)),
          ssl: Number(SSL.toFixed(4)),
        };
      }
    }
  }

  // --- 5. OTE INVALIDATION: CHANGE TREND IF PRICE EXCEEDS OTE ZONE ---
  if (activeSignal && activeSignal.oteZone) {
    const currentPrice = candles[candles.length - 1].close;
    if (activeSignal.type === 'BUY') {
      // In BUY setup, OTE zone represents deep discount support. 
      // Exceeding OTE (dropping below the 79% Fibonacci retracement level) breaks structure.
      if (currentPrice < activeSignal.oteZone.fib79) {
        trend = 'bearish';
        const levels = getLevelsForSell();
        
        activeSignal.type = 'SELL';
        activeSignal.entryRange = { min: Number(levels.entryMin.toFixed(4)), max: Number(levels.entryMax.toFixed(4)) };
        activeSignal.stopLoss = Number(levels.sl.toFixed(4));
        activeSignal.takeProfit1 = Number(levels.tp1.toFixed(4));
        activeSignal.takeProfit2 = Number(levels.tp2.toFixed(4));
        activeSignal.takeProfit3 = Number(levels.tp3.toFixed(4));
        activeSignal.riskRewardRatio = levels.rrr;
        activeSignal.setupType = 'OTE Breakout (SMC Reversal)';
        activeSignal.explanation = `🛑 [SMC BREAK: SELL] Harga menembus di bawah batas OTE 79.0% (${activeSignal.oteZone.fib79.toFixed(2)}). Struktur diskon terlampaui, merubah bias tren menjadi BEARISH dan memicu sinyal SELL breakout dengan SL di BSL dan TP di level ekstensi Fibonacci.`;
        activeSignal.priceActionConfirmation = detectPriceActionConfirmation(candles, 'SELL');
        activeSignal.bsl = Number(BSL.toFixed(4));
        activeSignal.ssl = Number(SSL.toFixed(4));
      }
    } else if (activeSignal.type === 'SELL') {
      // In SELL setup, OTE zone represents deep premium resistance. 
      // Exceeding OTE (rising above the 79% Fibonacci retracement level) breaks structure.
      if (currentPrice > activeSignal.oteZone.fib79) {
        trend = 'bullish';
        const levels = getLevelsForBuy();
        
        activeSignal.type = 'BUY';
        activeSignal.entryRange = { min: Number(levels.entryMin.toFixed(4)), max: Number(levels.entryMax.toFixed(4)) };
        activeSignal.stopLoss = Number(levels.sl.toFixed(4));
        activeSignal.takeProfit1 = Number(levels.tp1.toFixed(4));
        activeSignal.takeProfit2 = Number(levels.tp2.toFixed(4));
        activeSignal.takeProfit3 = Number(levels.tp3.toFixed(4));
        activeSignal.riskRewardRatio = levels.rrr;
        activeSignal.setupType = 'OTE Breakout (SMC Reversal)';
        activeSignal.explanation = `🚀 [SMC BREAK: BUY] Harga menembus di atas batas OTE 79.0% (${activeSignal.oteZone.fib79.toFixed(2)}). Struktur premium terlampaui, merubah bias tren menjadi BULLISH dan memicu sinyal BUY breakout dengan SL di SSL dan TP di level ekstensi Fibonacci.`;
        activeSignal.priceActionConfirmation = detectPriceActionConfirmation(candles, 'BUY');
        activeSignal.bsl = Number(BSL.toFixed(4));
        activeSignal.ssl = Number(SSL.toFixed(4));
      }
    }
  }

  return {
    symbol,
    timeframe,
    candles,
    fvgs,
    orderBlocks,
    marketStructures,
    inducements,
    cisds,
    activeSignal,
    trend,
    htfContext,
    scannedAt: Date.now(),
  };
}

// Generates highly realistic candle simulations for sandbox or offline mode
export function generateMockCandles(patternType: 'standard' | 'ifvg_bullish' | 'ifvg_bearish' | 'mss_sweep', count = 100, basePrice = 50000): Candle[] {
  const candles: Candle[] = [];
  let currentPrice = basePrice;
  const now = Date.now();
  const step = 15 * 60 * 1000; // 15m

  // Build standard random walk first
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.49) * (currentPrice * 0.003); // slight upward bias
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * (currentPrice * 0.001);
    const low = Math.min(open, close) - Math.random() * (currentPrice * 0.001);
    const time = now - (count - i) * step;
    
    candles.push({
      time,
      timeString: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      open,
      high,
      low,
      close,
      volume: Math.round(100 + Math.random() * 1000),
    });
    
    currentPrice = close;
  }

  // Modify the end of the candle array to strictly embed the user's requested pattern!
  if (patternType === 'ifvg_bullish') {
    // Inject a Bearish FVG, then price rallies hard to close ABOVE it (creating a Bullish Inversion FVG), then retraces back to retest it
    const startIdx = count - 15;
    let price = candles[startIdx].close;
    
    // 1. Establish swing high
    candles[startIdx]     = { ...candles[startIdx], open: price, close: price + 100, high: price + 150, low: price - 50 }; price += 100;
    candles[startIdx + 1] = { ...candles[startIdx + 1], open: price, close: price - 150, high: price + 50, low: price - 200 }; price -= 150;
    
    // 2. Strong Bearish FVG (Candles startIdx + 2, +3, +4)
    // Candle 1 (c1)
    candles[startIdx + 2] = { ...candles[startIdx + 2], open: price, close: price - 200, high: price + 20, low: price - 250 }; price -= 200;
    // Candle 2 (c2 - the strong drop)
    const c1Low = candles[startIdx + 2].low;
    candles[startIdx + 3] = { ...candles[startIdx + 3], open: price, close: price - 500, high: price + 10, low: price - 520 }; price -= 500;
    // Candle 3 (c3 - leaves gap)
    candles[startIdx + 4] = { ...candles[startIdx + 4], open: price, close: price - 100, high: price - 150, low: price - 250 }; price -= 100;
    // Bearish FVG is now between: c1.low (c1Low) and c3.high (price - 150). e.g. a gap of ~200 points.
    
    // 3. Consolidation at bottom
    candles[startIdx + 5] = { ...candles[startIdx + 5], open: price, close: price + 50, high: price + 80, low: price - 50 }; price += 50;
    candles[startIdx + 6] = { ...candles[startIdx + 6], open: price, close: price - 30, high: price + 20, low: price - 60 }; price -= 30;

    // 4. Sweep of lows
    candles[startIdx + 7] = { ...candles[startIdx + 7], open: price, close: price + 100, high: price + 120, low: price - 300 }; price += 100; // wick sweeps low
    
    // 5. Strong Rally breaking above the FVG top (Inverting it!)
    candles[startIdx + 8] = { ...candles[startIdx + 8], open: price, close: price + 400, high: price + 420, low: price - 20 }; price += 400;
    candles[startIdx + 9] = { ...candles[startIdx + 9], open: price, close: price + 500, high: price + 550, low: price - 10 }; price += 500;
    
    // Bring it above c1Low
    const targetInversionClose = c1Low + 150;
    candles[startIdx + 10] = { ...candles[startIdx + 10], open: price, close: targetInversionClose, high: targetInversionClose + 50, low: price - 50 };
    price = targetInversionClose;
    // Candle startIdx + 10 body closed above Bearish FVG top (c1Low), creating the Bullish Inversion FVG!

    // 6. Retracement to retest the Inversion zone as Support (Optimal Buy Setup!)
    const fvgTop = c1Low;
    const fvgBottom = candles[startIdx + 4].high;
    const midFvg = (fvgTop + fvgBottom) / 2;
    
    candles[startIdx + 11] = { ...candles[startIdx + 11], open: price, close: price - 100, high: price + 20, low: price - 120 }; price -= 100;
    candles[startIdx + 12] = { ...candles[startIdx + 12], open: price, close: price - 150, high: price + 10, low: price - 180 }; price -= 150;
    
    // Retest candle - wick touches midFvg, closes bullish near top
    candles[startIdx + 13] = { ...candles[startIdx + 13], open: price, close: midFvg + 80, high: price + 30, low: midFvg - 10 }; price = midFvg + 80;
    
    // Trigger signal candle (final latest candle)
    candles[startIdx + 14] = { ...candles[startIdx + 14], open: price, close: price + 150, high: price + 180, low: price - 10 };
  } 
  else if (patternType === 'ifvg_bearish') {
    // Inject a Bullish FVG, then price collapses BELOW it (creating Bearish Inversion FVG), then bounces to retest it as resistance
    const startIdx = count - 15;
    let price = candles[startIdx].close;

    // 1. Establish swing low
    candles[startIdx]     = { ...candles[startIdx], open: price, close: price - 100, high: price + 50, low: price - 150 }; price -= 100;
    candles[startIdx + 1] = { ...candles[startIdx + 1], open: price, close: price + 150, high: price + 200, low: price - 50 }; price += 150;

    // 2. Strong Bullish FVG (Candles startIdx + 2, +3, +4)
    // Candle 1 (c1)
    candles[startIdx + 2] = { ...candles[startIdx + 2], open: price, close: price + 200, high: price + 250, low: price - 20 }; price += 200;
    const c1High = candles[startIdx + 2].high;
    // Candle 2 (c2 - the strong rally)
    candles[startIdx + 3] = { ...candles[startIdx + 3], open: price, close: price + 500, high: price + 520, low: price - 10 }; price += 500;
    // Candle 3 (c3 - leaves gap)
    candles[startIdx + 4] = { ...candles[startIdx + 4], open: price, close: price + 100, high: price + 250, low: price + 150 }; price += 100;
    // Bullish FVG is now between: c3.low (price + 150) and c1.high (c1High). e.g. gap of ~200 points.

    // 3. Consolidation at top
    candles[startIdx + 5] = { ...candles[startIdx + 5], open: price, close: price - 50, high: price + 50, low: price - 80 }; price -= 50;
    candles[startIdx + 6] = { ...candles[startIdx + 6], open: price, close: price + 30, high: price + 60, low: price - 20 }; price += 30;

    // 4. Sweep of highs
    candles[startIdx + 7] = { ...candles[startIdx + 7], open: price, close: price - 100, high: price + 300, low: price - 120 }; price -= 100; // wick sweeps high

    // 5. Strong Drop below FVG bottom (Inverting it!)
    candles[startIdx + 8] = { ...candles[startIdx + 8], open: price, close: price - 400, high: price + 20, low: price - 420 }; price -= 400;
    candles[startIdx + 9] = { ...candles[startIdx + 9], open: price, close: price - 500, high: price + 10, low: price - 550 }; price -= 500;

    // Close below c1High
    const targetInversionClose = c1High - 150;
    candles[startIdx + 10] = { ...candles[startIdx + 10], open: price, close: targetInversionClose, high: price + 50, low: targetInversionClose - 50 };
    price = targetInversionClose;

    // 6. Retrace to retest the Inversion zone as Resistance (Optimal Short Setup!)
    const fvgBottom = c1High;
    const fvgTop = candles[startIdx + 4].low;
    const midFvg = (fvgTop + fvgBottom) / 2;

    candles[startIdx + 11] = { ...candles[startIdx + 11], open: price, close: price + 100, high: price + 120, low: price - 20 }; price += 100;
    candles[startIdx + 12] = { ...candles[startIdx + 12], open: price, close: price + 150, high: price + 180, low: price - 10 }; price += 150;

    // Retest candle - wick touches midFvg, closes bearish near bottom
    candles[startIdx + 13] = { ...candles[startIdx + 13], open: price, close: midFvg - 80, high: midFvg + 10, low: price - 30 }; price = midFvg - 80;

    // Final candle
    candles[startIdx + 14] = { ...candles[startIdx + 14], open: price, close: price - 150, high: price + 10, low: price - 180 };
  }

  return candles;
}
