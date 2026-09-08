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

// 8. PDL SWEEP & MITIGATION BLOCK ENTRY MODEL (SMC / ICT INSTITUTIONAL)
export interface PdlSweepModel {
  sweepType: 'PDL_SWEEP_BUY' | 'PDH_SWEEP_SELL';
  sweepSpotPrice: number; // Low/High yang disweep (PDL/PDH)
  sweepSpotCandleIndex: number;
  sweepSpotTime?: number;
  orderBlock: {
    top: number;
    bottom: number;
    candleIndex: number;
  };
  mssLevel: number; // Market Structure Shift Level
  mssCandleIndex?: number;
  idmLevel: number; // Inducement Pullback Level
  idmCandleIndex?: number;
  bosLevel: number; // Break of Structure Level (Horizontal line)
  bosCandleIndex?: number;
  mitigationBlock: {
    top: number;
    bottom: number;
    startIndex: number;
    endIndex: number;
  };
  entryPrice: number; // Exact retest at Mitigation Block
  stopLoss: number; // Below/above Mitigation Block / Swing
  takeProfit1: number; // TP1: Target Liquidity Pool 1
  takeProfit2: number; // TP2: Major Target / Extreme Liquidity (R:R 1:4 - 1:10+)
  status: 'SWEEP_DETECTED' | 'MSS_FORMED' | 'BOS_CONFIRMED' | 'MITIGATION_ENTRY_ACTIVE' | 'RUNNING_TO_TARGET';
  narrative: string;
}

// 9. ICT + CRT HYBRID INSTITUTIONAL ENTRY MODEL (INNER CIRCLE TRADER x CANDLE RANGE THEORY)
export type StrategyModelMode = 'ICT_CRT' | 'CRT_9AM';

export interface CrtBenchmarkRange {
  timeLabel: string; // "08:00 - 09:00 AM NY" / "Benchmark Mother Range"
  rangeHigh: number; // Buy-Side Liquidity pool above
  rangeLow: number;  // Sell-Side Liquidity pool below
  equilibrium: number; // 50% Fair Value Midpoint (RH + RL) / 2
  rangeSize: number;
  candleIndex: number;
}

export interface IctLiquiditySweep {
  type: 'SSL_SWEEP_BULLISH' | 'BSL_SWEEP_BEARISH';
  liquidityPool: 'SELL_SIDE_LIQUIDITY' | 'BUY_SIDE_LIQUIDITY';
  sweepPrice: number;
  sweepCandleIndex: number;
  sweepWickExcess: number;
  turtleSoupConfirmed: boolean;
}

export interface IctFairValueGap {
  type: 'BISI' | 'SIBI'; // Buyside Imbalance Sellside Inefficiency (BULLISH) vs Sellside Imbalance Buyside Inefficiency (BEARISH)
  top: number;
  bottom: number;
  midpoint: number;
  startIndex: number;
}

export interface IctOrderBlock {
  top: number;
  bottom: number;
  candleIndex: number;
}

export interface KeyLevelZone {
  high: number;           // Batas atas area key level valid
  low: number;            // Batas bawah area key level valid
  sweetSpot: number;      // Titik presisi maksimal (Sweet Spot OTE 70.5% & FVG Mean Threshold)
  oteFib62: number;       // Level Fibonacci 62%
  oteFib705: number;      // Level Fibonacci 70.5% (Golden Pocket)
  oteFib79: number;       // Level Fibonacci 79%
  zoneType: 'BISI_OTE_KEY_LEVEL' | 'SIBI_OTE_KEY_LEVEL';
  label: string;          // e.g. "Area Key Level FVG BISI + OTE 70.5%"
  confluences: string[];  // e.g. ["Retest FVG BISI", "Golden OTE 70.5%", "Order Block Base", "CRT Range Confluence"]
  status: 'IN_ZONE' | 'APPROACHING' | 'SWEET_SPOT_HIT' | 'REJECTED_RUNNING';
  precisionScore: number; // e.g. 96 (%)
}

export interface IctCrtModel {
  session: 'CURRENT_RUNNING_CANDLE' | 'NY_OPEN_KILLZONE' | 'LONDON_KILLZONE' | 'OVERALL';
  benchmark: CrtBenchmarkRange;
  liquiditySweep: IctLiquiditySweep;
  reEntryConfirmed: boolean;
  displacementMss: {
    level: number;
    candleIndex: number;
    isConfirmed: boolean;
  };
  fairValueGap: IctFairValueGap;
  orderBlock: IctOrderBlock;
  oteRetestZone: {
    fib62: number;
    fib79: number;
    optimalEntry: number;
  };
  keyLevelZone?: KeyLevelZone; // Area Key Level untuk Entri Valid dan Presisi
  entryPrice: number; // Sniper entry at FVG / CRT Boundary retest
  stopLoss: number;   // Locked behind ICT Turtle Soup extreme wick
  takeProfit1: number; // TP1: 50% CRT Equilibrium (Partial scale-out 50% + BEP)
  takeProfit2: number; // TP2: Opposing CRT Boundary (Major DOL)
  takeProfit3?: number; // TP3: External Liquidity Pool
  riskRewardRatio: number;
  phase: 'BENCHMARK_MAPPED' | 'TURTLE_SOUP_SWEEP' | 'DISPLACEMENT_MSS' | 'FVG_OTE_ENTRY_ACTIVE' | 'RUNNING_TO_DOL';
  narrative: string;

  // Compatibility aliases
  sweepType: 'BULLISH_ICT_CRT' | 'BEARISH_ICT_CRT' | 'BULLISH_SWEEP' | 'BEARISH_SWEEP' | 'BULLISH_CRT_9AM' | 'BEARISH_CRT_9AM';
  sweepPrice: number;
  sweepCandleIndex: number;
  sweepWickExcess: number;
  mssLevel: number;
  mssCandleIndex?: number;
  mssConfirmed?: boolean;
  fvgMitigated?: boolean;
  fvgMitigationZone: {
    top: number;
    bottom: number;
    startIndex: number;
  };
}

// Backward compatibility alias for CRT 9AM
export type Crt9AmModel = IctCrtModel;
export type Crt9AmBenchmarkRange = CrtBenchmarkRange;

// COMPLETE UNIFIED SIGNAL FOR INSTITUTIONAL ENTRY MODELS
export interface TradingSignal {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  timeframe: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number; // TP1: 50% CRT Equilibrium (Konsisten Terkunci)
  takeProfit2: number; // TP2: Opposing CRT Boundary / Major DOL (Konsisten Terkunci)
  takeProfit3?: number; // TP3: External Liquidity Pool
  riskRewardRatio: number;
  setupType: 'ICT_CRT_BULLISH' | 'ICT_CRT_BEARISH' | 'CRT_9AM_BULLISH' | 'CRT_9AM_BEARISH' | 'PDL_SWEEP_MITIGATION' | 'PDH_SWEEP_MITIGATION';
  strategyMode?: StrategyModelMode;
  explanation: string;
  timestamp: number;
  status: 'pending' | 'active' | 'hit_tp' | 'hit_sl' | 'cancelled_and_flipped';

  // STRATEGY ENGINE DATA
  keyLevelZone?: KeyLevelZone;
  ictCrt?: IctCrtModel;
  crt9Am?: IctCrtModel;
  pdlSweep?: PdlSweepModel;

  // 7 STRATEGY PILLARS DATA
  stf: SifirTFHierarchy;
  engulfing: EngulfingZone;
  zeroFloatingZone: ZeroFloatingZone;
  cycle6C9C: CycleCount6C9C;
  zona1Lot: Zona1LotFM;
  storyline: Storyline;

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

  // 7 Strategy Analysis Objects & PDL Sweep Engine
  stfHierarchy: SifirTFHierarchy;
  activeEngulfingZones: EngulfingZone[];
  zeroFloatingZones: ZeroFloatingZone[];
  currentCycle: CycleCount6C9C;
  zona1Lot: Zona1LotFM;
  storyline: Storyline;
  pdlSweepModel: PdlSweepModel | null;
  crt9AmModel: Crt9AmModel | null;
  ictCrtModel: IctCrtModel | null;
  strategyMode?: StrategyModelMode;

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

// FRESH BUY & SELL SIGNAL ALERT NOTIFICATION
export interface FreshSignalAlert {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  setupType: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskRewardRatio: number;
  timestamp: number;
  timeFormatted: string;
  source: 'MULTICHART' | 'RADAR_SCANNER';
  read: boolean;
  changeDescription: string;
  confirmation: string;
  keyLevelZone?: KeyLevelZone;
}


