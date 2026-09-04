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

// 1. SIFIR TIME FRAME (STF) TYPES
export type STFTimeframe = '1d' | '4h' | '1h' | '15m' | '5m' | '1m';

export interface SifirTFHierarchy {
  htf: STFTimeframe; // Daily atau H4 untuk Storyline & Major Engulfing
  mtf: STFTimeframe; // H1 atau M15 untuk Struktur & 6C/9C Cycles
  ltf: STFTimeframe; // M5 atau M1 untuk Zero Floating Zona & Eksekusi Sniper
  htfTrend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  cycleRatio: string; // e.g. "1D = 6 x 4H | 1 x 4H = 16 x 15M"
  statusDescription: string;
}

// 2. VALID BREAKOUT & ENGULFING TYPES
export type EngulfingType = 'BULLISH_ENGULFING' | 'BEARISH_ENGULFING';

export interface EngulfingZone {
  id: string;
  type: EngulfingType;
  timeframe: string;
  candleIndex: number;
  motherCandle: Candle;
  engulfingCandle: Candle;
  top: number; // High zone
  bottom: number; // Low zone
  bodyTop: number;
  bodyBottom: number;
  isFresh: boolean; // True jika belum pernah diretest
  isValidBreakout: boolean; // True jika body break SNR sebelumnya secara utuh (VBO)
  breakoutLevel: number;
  volumeConfirmed: boolean;
}

// 3. ZERO FLOATING ZONA (ZFZ)
export interface ZeroFloatingZone {
  id: string;
  type: 'BUY_ZFZ' | 'SELL_ZFZ';
  timeframe: string;
  priceZoneHigh: number;
  priceZoneLow: number;
  wickSniperLevel: number; // Titik paling presisi (pucuk/akar)
  originDescription: string; // e.g. "Extreme Wick Shadow Bullish Engulfing H4"
  isHit: boolean;
  status: 'PENDING_RETEST' | 'TRIGGERED_ACTIVE' | 'MITIGATED';
}

// 4. KODE 6C.9C (CANDLE CYCLE COUNTING)
export interface CycleCount6C9C {
  currentCount: number; // 1 s/d 9
  lastCycleTriggerIndex: number;
  is6C: boolean; // Candle ke-6 (Ekspansi / Siklus 6 Candle)
  is9C: boolean; // Candle ke-9 (Turning Point / Exhaustion Siklus 9 Candle)
  cyclePhase: 'COUNTING' | 'KODE_6C_CONFIRMED' | 'KODE_9C_CONFIRMED' | 'CYCLE_RESET';
  explanation: string;
}

// 5. ZONA 1 LOT [FM] (FULL MARGIN / SNIPER CONFLUENCE)
export interface Zona1LotFM {
  isEligible: boolean;
  confluenceScore: number; // Skala 1 - 100%
  confluencePoints: string[];
  setupGrade: 'TIER_1_FULL_MARGIN' | 'TIER_2_HIGH_CONFIRM' | 'STANDARD';
  riskRewardRatio: number;
  recommendedLeverageTip: string;
}

// 6. STORYLINE (ALUR PERJALANAN HARGA)
export interface Storyline {
  direction: 'BULLISH' | 'BEARISH';
  origin: string; // Misal "Reject Support Bullish Engulfing Daily / H4"
  currentPhase: 'RETEST_HTF' | 'BREAKOUT_STRUCTURE' | 'SNIPER_ENTRY' | 'RUNNING_TO_TARGET' | 'EXHAUSTION';
  destination: string; // Misal "Target Menuju Resistance Bearish Engulfing H4"
  narrativeText: string;
  targetPrice: number;
}

// 7. GUN NUMBER (GANN / PSYCHOLOGICAL KEY ROUND NUMBERS)
export interface GunNumberInfo {
  nearestGunNumber: number;
  allLevels: number[];
  distanceToNearest: number;
  isAtGunNumber: boolean; // Harga sedang tepat di level Gun Number (+- 0.15%)
  levelType: 'MAJOR_GANN_000' | 'PSYCHOLOGICAL_500' | 'KEY_PIVOT_200_800';
}

// COMPLETE UNIFIED SIGNAL FOR THE 7-STRATEGY SYSTEM
export interface TradingSignal {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  timeframe: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number; // TP1: Target Mid / Next SNR
  takeProfit2: number; // TP2: Target Storyline Major Zone
  takeProfit3?: number;
  riskRewardRatio: number;
  setupType: 'ZONA_1_LOT_FM' | 'ZERO_FLOATING_ENTRY' | 'VBO_ENGULFING_RETEST' | 'KODE_6C_PULLBACK' | 'KODE_9C_REVERSAL';
  explanation: string;
  timestamp: number;
  status: 'pending' | 'active' | 'hit_tp' | 'hit_sl' | 'cancelled_and_flipped';

  // 7 STRATEGY PILLARS DATA
  stf: SifirTFHierarchy;
  engulfing: EngulfingZone;
  zeroFloatingZone: ZeroFloatingZone;
  cycle6C9C: CycleCount6C9C;
  zona1Lot: Zona1LotFM;
  storyline: Storyline;
  gunNumber: GunNumberInfo;

  // Compatibility flags
  confirmation: string;
  bodyRatioPercent?: number;
  isFlipped?: boolean;
  flippedFrom?: 'BUY' | 'SELL';
  invalidationReason?: string;
  targetBoxName?: string;
  targetBoxNumber?: 2 | 3;
  isLocked?: boolean;
  pnlR?: number;
}

// SCAN RESULT FOR INDIVIDUAL PAIR
export interface ScanResult {
  symbol: string;
  scannedAt: number;
  trend: 'bullish' | 'bearish' | 'sideways';

  // Candle datasets
  htfCandles: Candle[]; // Daily / H4
  mtfCandles: Candle[]; // H1 / M15
  ltfCandles: Candle[]; // M5 / M1
  fiveMinCandles: Candle[]; // Alias for LTF

  // 7 Strategy Analysis Objects
  stfHierarchy: SifirTFHierarchy;
  activeEngulfingZones: EngulfingZone[];
  zeroFloatingZones: ZeroFloatingZone[];
  currentCycle: CycleCount6C9C;
  zona1Lot: Zona1LotFM;
  storyline: Storyline;
  gunNumber: GunNumberInfo;

  // Signal Output
  activeSignal: TradingSignal | null;
  signalBox2?: TradingSignal | null; // Compatibility alias
  signalBox3?: TradingSignal | null; // Compatibility alias
  signal15mBox2?: TradingSignal | null;
  signal15mBox3?: TradingSignal | null;

  // Backward compatibility mock boxes if needed
  h4Box?: any;
  latest5mAnalysis?: any;
  latest5mAnalysisBox2?: any;
  latest5mAnalysisBox3?: any;
  latest15mAnalysisBox2?: any;
  latest15mAnalysisBox3?: any;
}

