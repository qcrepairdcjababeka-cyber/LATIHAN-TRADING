/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Candle {
  time: number; // timestamp in ms or string converted to unix
  timeString: string; // readable time
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FVG {
  id: string;
  type: 'bullish' | 'bearish';
  top: number;
  bottom: number;
  candleIndex: number; // Middle candle index (the expansion candle)
  startIndex: number;  // Candle index of LHS (Candle 1)
  endIndex: number;    // Candle index of RHS (Candle 3)
  isMitigated: boolean;
  mitigatedByIndex: number | null;
  
  // IFVG Properties
  isInverted: boolean;
  invertedAtIndex: number | null;
  invertedType: 'bullish_to_bearish' | 'bearish_to_bullish' | null;

  // Touch & Retest Tracking
  touchCount: number; // Number of times price entered/touched this gap range (if >= 3, gap is exhausted and removed from chart)
}

export interface OrderBlock {
  id: string;
  type: 'bullish' | 'bearish';
  top: number;
  bottom: number;
  candleIndex: number; // index of the OB candle itself
  strength: 'weak' | 'medium' | 'strong';
}

export interface MarketStructure {
  id: string;
  type: 'bullish' | 'bearish';
  style: 'MSS' | 'BOS';
  price: number;
  candleIndex: number;  // index where the break occurred
  levelIndex: number;   // index where the swing high/low was established
}

export interface Inducement {
  id: string;
  type: 'bullish' | 'bearish'; // 'bullish' means a minor low (swept before a rally), 'bearish' means a minor high (swept before a drop)
  price: number;
  candleIndex: number; // index of the candle that formed the inducement peak
  sweptAtIndex: number | null; // index of the candle that swept/took out this level
  isSwept: boolean;
}

export interface CISD {
  id: string;
  type: 'bullish' | 'bearish'; // 'bullish' = delivery flipped to buy-side; 'bearish' = delivery flipped to sell-side
  price: number; // price level where change in state of delivery occurred
  candleIndex: number; // candle index where CISD occurred (closing candle)
  sweptType: 'BSL' | 'SSL'; // Liquidity pool swept before CISD
  sweptPrice: number; // Exact price level of BSL or SSL that was swept
}

export interface HTFContext {
  htfTimeframe: 'D1' | 'H4' | 'H1';
  ltfEntryTimeframe: 'M15' | 'M5';
  bias: 'bullish_retrace' | 'bearish_retrace';
  htfZoneName: string;
  explanation: string;
}

export interface OteZone {
  low: number;
  high: number;
  fib62: number;
  fib705: number;
  fib79: number;
  swingLow: number;
  swingHigh: number;
}

export interface TradingSignal {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  timeframe: string;
  entryRange: { min: number; max: number };
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: number;
  setupType: 
    | 'BSL/SSL Swept + CISD + FVG Retrace'
    | 'BSL Sweep + Bearish CISD + FVG Retrace'
    | 'SSL Sweep + Bullish CISD + FVG Retrace'
    | 'Inversion FVG Retest' 
    | 'FVG + Order Block mitigation' 
    | 'MSS on Liquidity Sweep' 
    | 'OTE Breakout (SMC Reversal)' 
    | 'Inversion FVG + Order Block Convergence' 
    | 'Inversion FVG (IFG) Instan' 
    | 'IDM + IFG Confirmation';
  explanation: string;
  timestamp: number;
  status: 'pending' | 'active' | 'hit_tp' | 'hit_sl';
  priceActionConfirmation?: string; // e.g. "Bullish Engulfing", "Rejection Block", "Hammer candle"
  oteZone?: OteZone;
  bsl?: number;
  ssl?: number;
  cisd?: CISD;
  htfContext?: HTFContext;
}

export interface ScanResult {
  symbol: string;
  timeframe: string;
  candles: Candle[];
  fvgs: FVG[];
  orderBlocks: OrderBlock[];
  marketStructures: MarketStructure[];
  inducements: Inducement[];
  cisds: CISD[];
  activeSignal: TradingSignal | null;
  trend: 'bullish' | 'bearish' | 'sideways';
  htfContext?: HTFContext;
  scannedAt: number;
}
