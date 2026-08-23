/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Candle {
  time: number;
  timeString: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SingleBox {
  candleIndex: number;
  candleNumber: number; // 2 or 3
  candle: Candle;
  top: number;
  bottom: number;
  bodyTop: number;
  bodyBottom: number;
  isBullish: boolean;
}

export interface H4Box {
  id: string;
  candle2Index: number;
  candle2: Candle; // Lilin H4 ke-2
  candle3Index: number;
  candle3: Candle; // Lilin H4 ke-3
  box2: SingleBox; // Box Lilin H4 #2
  box3: SingleBox; // Box Lilin H4 #3
  top: number; // High dari Lilin H4 #2 (default)
  bottom: number; // Low dari Lilin H4 #2 (default)
  bodyTop: number; // Max(Open, Close) Lilin H4 #2
  bodyBottom: number; // Min(Open, Close) Lilin H4 #2
  type: 'bullish' | 'bearish' | 'neutral';
  timeframe: string;
}

export interface FiveMinCandleAnalysis {
  candle: Candle;
  candleIndex: number;
  isStrong: boolean; // True if body ratio >= 50%
  bodyRatio: number; // Percentage of body vs total candle range
  bodySize: number;
  totalRange: number;
  direction: 'bullish' | 'bearish' | 'doji';
  isInsideBox: boolean; // True if candle is inside Box H4
  isBreakoutReentry: boolean; // True if candle entered box after a recent breakout outside
  breakoutSide: 'below' | 'above' | 'none'; // Which side was broken out prior to re-entry
  interactionType: 'reentered_from_breakout' | 'entered_box' | 'closed_in_box' | 'outside_box' | 'none';
  targetBoxNumber?: 2 | 3;
  // 2-Candle confirmation tracking
  consecutiveStrongCount?: number; // e.g. 1 or >=2 consecutive strong candles
  has2ConsecutiveStrong?: boolean; // True if current and previous candle both closed strongly in same direction
}

export interface TradingSignal {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  timeframe: string;
  h4Box: H4Box;
  targetBoxName: string; // e.g. 'Box H4 (Lilin #2)', 'Box H4 (Lilin #3)'
  targetBoxNumber?: 2 | 3;
  triggerCandle: Candle;
  firstConfirmCandle?: Candle;
  secondConfirmCandle?: Candle;
  confirmationCount: number; // Minimal 2 candle closing kuat
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: number;
  setupType: string;
  explanation: string;
  timestamp: number;
  status: 'pending' | 'active' | 'hit_tp' | 'hit_sl' | 'cancelled_and_flipped';
  confirmation: string;
  bodyRatioPercent: number;
  firstBodyRatioPercent?: number;
  isFlipped?: boolean;
  flippedFrom?: 'BUY' | 'SELL';
  invalidationReason?: string;
}

export interface ScanResult {
  symbol: string;
  h4Box: H4Box | null;
  h4Candles: Candle[];
  fiveMinCandles: Candle[];
  latest5mAnalysis: FiveMinCandleAnalysis | null;
  latest5mAnalysisBox2?: FiveMinCandleAnalysis | null;
  latest5mAnalysisBox3?: FiveMinCandleAnalysis | null;
  activeSignal: TradingSignal | null;
  signalBox2?: TradingSignal | null;
  signalBox3?: TradingSignal | null;
  trend: 'bullish' | 'bearish' | 'sideways';
  scannedAt: number;
}
