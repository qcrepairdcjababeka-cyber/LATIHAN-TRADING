/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { scanCandles, generateMockCandles } from './utils/ictScanner';
import { Candle, FVG, OrderBlock, MarketStructure, TradingSignal, Inducement, CISD } from './types';
import IctChart from './components/IctChart';
import SimulationSandbox from './components/SimulationSandbox';
import EducationalPortal from './components/EducationalPortal';
import MultiPanelGrid from './components/MultiPanelGrid';
import { 
  LineChart, 
  Bot, 
  Play, 
  HelpCircle, 
  Sparkles, 
  RefreshCw, 
  Plus, 
  TrendingUp, 
  ArrowRight, 
  BookOpen, 
  AlertTriangle,
  History,
  Copy,
  Check,
  TrendingDown,
  DollarSign,
  LayoutGrid,
  Maximize2,
  Minimize2
} from 'lucide-react';

export default function App() {
  // Asset state
  const [symbol, setSymbol] = useState<string>('BTCUSDT');
  const [timeframe, setTimeframe] = useState<string>('15m');
  const [customLabel, setCustomLabel] = useState<string>('Real-Time: BTCUSDT - 15m');

  // Scanner states
  const [candles, setCandles] = useState<Candle[]>([]);
  const [fvgs, setFvgs] = useState<FVG[]>([]);
  const [orderBlocks, setOrderBlocks] = useState<OrderBlock[]>([]);
  const [marketStructures, setMarketStructures] = useState<MarketStructure[]>([]);
  const [inducements, setInducements] = useState<Inducement[]>([]);
  const [cisds, setCisds] = useState<CISD[]>([]);
  const [activeSignal, setActiveSignal] = useState<TradingSignal | null>(null);
  const [pulseActive, setPulseActive] = useState<boolean>(false);
  const prevSignalRef = useRef<{ id: string; status: string } | null>(null);

  useEffect(() => {
    if (activeSignal) {
      const prev = prevSignalRef.current;
      const currentId = activeSignal.id;
      const currentStatus = activeSignal.status;

      if (!prev || prev.id !== currentId || prev.status !== currentStatus) {
        setPulseActive(true);
        const timer = setTimeout(() => {
          setPulseActive(false);
        }, 4000); // Pulse effect runs for 4 seconds
        
        prevSignalRef.current = { id: currentId, status: currentStatus };
        return () => clearTimeout(timer);
      }
    } else {
      prevSignalRef.current = null;
      setPulseActive(false);
    }
  }, [activeSignal?.id, activeSignal?.status]);
  const [trend, setTrend] = useState<'bullish' | 'bearish' | 'sideways'>('sideways');
  
  // App modes / views
  const [viewMode, setViewMode] = useState<'realtime' | 'sandbox'>('realtime');
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chart' | 'multichart' | 'scanner' | 'sandbox'>('chart');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Fullscreen toggle handler
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch((err) => {
        console.error('Fullscreen request error:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Statuses
  const [loading, setLoading] = useState<boolean>(true);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock Trading ledger (persists to localStorage)
  const [simulatedTrades, setSimulatedTrades] = useState<any[]>(() => {
    const saved = localStorage.getItem('ict_sim_trades');
    return saved ? JSON.parse(saved) : [];
  });

  // Popular tickers config
  const tickers = [
    // Majors
    { value: 'BTCUSDT', label: 'BTC / USDT (Bitcoin)' },
    { value: 'ETHUSDT', label: 'ETH / USDT (Ethereum)' },
    { value: 'BNBUSDT', label: 'BNB / USDT (Binance Coin)' },
    { value: 'SOLUSDT', label: 'SOL / USDT (Solana)' },
    { value: 'XRPUSDT', label: 'XRP / USDT (Ripple)' },
    { value: 'ADAUSDT', label: 'ADA / USDT (Cardano)' },
    { value: 'TONUSDT', label: 'TON / USDT (Toncoin)' },
    { value: 'LTCUSDT', label: 'LTC / USDT (Litecoin)' },
    { value: 'BCHUSDT', label: 'BCH / USDT (Bitcoin Cash)' },
    { value: 'LINKUSDT', label: 'LINK / USDT (Chainlink)' },
    { value: 'DOTUSDT', label: 'DOT / USDT (Polkadot)' },
    { value: 'TRXUSDT', label: 'TRX / USDT (TRON)' },
    
    // Layer 1 & 2 Ecosystem
    { value: 'SUIUSDT', label: 'SUI / USDT (Sui)' },
    { value: 'APTUSDT', label: 'APT / USDT (Aptos)' },
    { value: 'AVAXUSDT', label: 'AVAX / USDT (Avalanche)' },
    { value: 'NEARUSDT', label: 'NEAR / USDT (Near Protocol)' },
    { value: 'OPUSDT', label: 'OP / USDT (Optimism)' },
    { value: 'ARBUSDT', label: 'ARB / USDT (Arbitrum)' },
    { value: 'FTMUSDT', label: 'FTM / USDT (Fantom)' },
    { value: 'SEIUSDT', label: 'SEI / USDT (Sei)' },
    { value: 'INJUSDT', label: 'INJ / USDT (Injective)' },
    { value: 'STRKUSDT', label: 'STRK / USDT (Starknet)' },
    { value: 'IMXUSDT', label: 'IMX / USDT (Immutable)' },
    { value: 'STXUSDT', label: 'STX / USDT (Stacks)' },
    { value: 'ALGOUSDT', label: 'ALGO / USDT (Algorand)' },
    { value: 'VETUSDT', label: 'VET / USDT (VeChain)' },
    { value: 'EGLDUSDT', label: 'EGLD / USDT (MultiversX)' },
    { value: 'ATOMUSDT', label: 'ATOM / USDT (Cosmos)' },
    { value: 'THETAUSDT', label: 'THETA / USDT (Theta Network)' },

    // AI & Web3 / DePIN
    { value: 'FETUSDT', label: 'FET / USDT (Artificial Superintelligence)' },
    { value: 'RENDERUSDT', label: 'RENDER / USDT (Render Network)' },
    { value: 'TAOUSDT', label: 'TAO / USDT (Bittensor)' },
    { value: 'WLDUSDT', label: 'WLD / USDT (Worldcoin)' },
    { value: 'ICPUSDT', label: 'ICP / USDT (Internet Computer)' },
    { value: 'GRTUSDT', label: 'GRT / USDT (The Graph)' },
    { value: 'ARUSDT', label: 'AR / USDT (Arweave)' },
    { value: 'FILUSDT', label: 'FIL / USDT (Filecoin)' },
    { value: 'JASMYUSDT', label: 'JASMY / USDT (JasmyCoin)' },

    // DeFi & Infrastructure
    { value: 'AAVEUSDT', label: 'AAVE / USDT (Aave)' },
    { value: 'UNIUSDT', label: 'UNI / USDT (Uniswap)' },
    { value: 'LDOUSDT', label: 'LDO / USDT (Lido DAO)' },
    { value: 'JUPUSDT', label: 'JUP / USDT (Jupiter)' },
    { value: 'PYTHUSDT', label: 'PYTH / USDT (Pyth Network)' },
    { value: 'PENDLEUSDT', label: 'PENDLE / USDT (Pendle)' },
    { value: 'MKRUSDT', label: 'MKR / USDT (Maker)' },
    { value: 'RUNEUSDT', label: 'RUNE / USDT (THORChain)' },
    { value: 'CRVUSDT', label: 'CRV / USDT (Curve DAO)' },
    { value: 'ENAUSDT', label: 'ENA / USDT (Ethena)' },
    { value: 'ETHFIUSDT', label: 'ETHFI / USDT (ether.fi)' },
    { value: 'TIAUSDT', label: 'TIA / USDT (Celestia)' },

    // Memecoins & Community Tokens
    { value: 'DOGEUSDT', label: 'DOGE / USDT (Dogecoin)' },
    { value: 'SHIBUSDT', label: 'SHIB / USDT (Shiba Inu)' },
    { value: 'PEPEUSDT', label: 'PEPE / USDT (Pepe)' },
    { value: 'WIFUSDT', label: 'WIF / USDT (dogwifhat)' },
    { value: 'BONKUSDT', label: 'BONK / USDT (Bonk)' },
    { value: 'FLOKIUSDT', label: 'FLOKI / USDT (Floki)' },
    { value: 'NOTUSDT', label: 'NOT / USDT (Notcoin)' },
    { value: 'BOMEUSDT', label: 'BOME / USDT (BOOK OF MEME)' },
    { value: 'ORDIUSDT', label: 'ORDI / USDT (Ordinals)' },
    { value: 'PEOPLEUSDT', label: 'PEOPLE / USDT (ConstitutionDAO)' },
  ];

  // Timeframes config
  const timeframes = [
    { value: '5m', label: '5 Menit (Scalping)' },
    { value: '15m', label: '15 Menit (Intraday)' },
    { value: '1h', label: '1 Jam (Swing)' },
    { value: '4h', label: '4 Jam (Sesi H4)' },
    { value: '1d', label: '1 Hari (Harian)' },
  ];

  // Update active signal keeping its levels static and consistent, only updating status
  const updateSignalWithPrice = (
    prev: TradingSignal | null,
    newScanned: TradingSignal | null,
    currentPrice: number,
    sym: string,
    tf: string,
    force = false
  ): TradingSignal | null => {
    if (force || !prev || prev.symbol !== sym || prev.timeframe !== tf) {
      return newScanned;
    }
    if (prev.status === 'hit_sl' || prev.status === 'hit_tp') {
      return prev;
    }

    let nextStatus: 'pending' | 'active' | 'hit_tp' | 'hit_sl' = prev.status;
    if (prev.type === 'BUY') {
      if (currentPrice <= prev.stopLoss) {
        nextStatus = 'hit_sl';
      } else if (currentPrice >= prev.takeProfit3) {
        nextStatus = 'hit_tp';
      } else if (prev.status === 'pending' && currentPrice >= prev.entryRange.min && currentPrice <= prev.entryRange.max) {
        nextStatus = 'active';
      }
    } else { // SELL
      if (currentPrice >= prev.stopLoss) {
        nextStatus = 'hit_sl';
      } else if (currentPrice <= prev.takeProfit3) {
        nextStatus = 'hit_tp';
      } else if (prev.status === 'pending' && currentPrice >= prev.entryRange.min && currentPrice <= prev.entryRange.max) {
        nextStatus = 'active';
      }
    }

    if (nextStatus !== prev.status) {
      return { ...prev, status: nextStatus };
    }
    return prev;
  };

  // Fetch real-time market candles
  const fetchMarketData = async (sym: string, tf: string, silent = false, forceNew = false) => {
    if (!silent) {
      setLoading(true);
      setSelectedPatternId(null);
      setAiAnalysis('');
    }
    
    try {
      const response = await fetch(`/api/binance/candles?symbol=${sym}&interval=${tf}&limit=120`);
      const data = await response.json();
      
      if (data.success && data.candles && data.candles.length > 0) {
        setCandles(data.candles);
        setCustomLabel(`Real-Time: ${sym} (${tf})`);
        
        // Process candles through our ICT scanner
        const scanResult = scanCandles(sym, tf, data.candles);
        setFvgs(scanResult.fvgs);
        setOrderBlocks(scanResult.orderBlocks);
        setMarketStructures(scanResult.marketStructures);
        setInducements(scanResult.inducements);
        setCisds(scanResult.cisds || []);
        
        const lastCandle = data.candles[data.candles.length - 1];
        const currentPrice = lastCandle ? lastCandle.close : 0;
        setActiveSignal((prev) => updateSignalWithPrice(prev, scanResult.activeSignal, currentPrice, sym, tf, forceNew));
        
        setTrend(scanResult.trend);
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error || 'Zero candles returned');
      }
    } catch (error) {
      console.warn('API error, falling back to offline simulations:', error);
      // Fallback: generate high fidelity mock candle sequences to avoid app failure
      const mockType = sym.includes('BTC') ? 'ifvg_bullish' : 'ifvg_bearish';
      const mock = generateMockCandles(mockType, 100);
      setCandles(mock);
      setCustomLabel(`DEMO AUTONOMOUS: ${sym} (${tf})`);
      
      const scanResult = scanCandles(sym, tf, mock);
      setFvgs(scanResult.fvgs);
      setOrderBlocks(scanResult.orderBlocks);
      setMarketStructures(scanResult.marketStructures);
      setInducements(scanResult.inducements);
      setCisds(scanResult.cisds || []);
      
      const lastCandle = mock[mock.length - 1];
      const currentPrice = lastCandle ? lastCandle.close : 0;
      setActiveSignal((prev) => updateSignalWithPrice(prev, scanResult.activeSignal, currentPrice, sym, tf, forceNew));
      
      setTrend(scanResult.trend);
      setLastUpdated(new Date());
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Initial trigger & Real-time update loop (10-second polling interval)
  useEffect(() => {
    if (viewMode === 'realtime') {
      // First fetch
      fetchMarketData(symbol, timeframe, false);

      // Refresh every 10 seconds silently
      const intervalId = setInterval(() => {
        fetchMarketData(symbol, timeframe, true);
      }, 10000);

      return () => clearInterval(intervalId);
    }
  }, [symbol, timeframe, viewMode]);

  // High-frequency live price ticking simulator (TradingView-style real-time ticks)
  useEffect(() => {
    if (viewMode === 'realtime' && !loading && candles.length > 0) {
      const tickInterval = setInterval(() => {
        setCandles((prevCandles) => {
          if (prevCandles.length === 0) return prevCandles;
          
          const nextCandles = [...prevCandles];
          const lastIndex = nextCandles.length - 1;
          const lastCandle = { ...nextCandles[lastIndex] };
          
          // Generate a highly realistic price tick
          // 0.015% max volatility per tick to replicate fast real-time order matching
          const volatility = 0.00015; 
          const changePercent = (Math.random() - 0.5) * volatility;
          
          const prevClose = lastCandle.close;
          const nextClose = Number((prevClose * (1 + changePercent)).toFixed(2));
          
          // High and low must accommodate the new close price
          const nextHigh = Number(Math.max(lastCandle.high, nextClose).toFixed(2));
          const nextLow = Number(Math.min(lastCandle.low, nextClose).toFixed(2));
          
          lastCandle.close = nextClose;
          lastCandle.high = nextHigh;
          lastCandle.low = nextLow;
          
          // Slightly fluctuate volume on tick to look dynamic
          const volChange = Math.round((Math.random() - 0.3) * 8);
          lastCandle.volume = Math.max(1, lastCandle.volume + volChange);
          
          nextCandles[lastIndex] = lastCandle;
          
          // Dynamic Scan Update: Instantly re-run ICT logic on live ticks to trigger levels
          const scanResult = scanCandles(symbol, timeframe, nextCandles);
          setFvgs(scanResult.fvgs);
          setOrderBlocks(scanResult.orderBlocks);
          setMarketStructures(scanResult.marketStructures);
          setInducements(scanResult.inducements);
          setCisds(scanResult.cisds || []);
          setActiveSignal((prev) => updateSignalWithPrice(prev, scanResult.activeSignal, nextClose, symbol, timeframe, false));
          setTrend(scanResult.trend);
          
          return nextCandles;
        });
      }, 1000); // 1-second ticks

      return () => clearInterval(tickInterval);
    }
  }, [viewMode, loading, symbol, timeframe, candles.length]);

  // Load sandbox candle data into the main chart
  const handleLoadSimulatedCandles = (customCandles: Candle[], label: string) => {
    setCandles(customCandles);
    setCustomLabel(label);
    setViewMode('sandbox'); // Keep it frozen on sandbox candles so they don't get overwritten
    setActiveTab('chart'); // Switch to the chart tab to view the widescreen candles
    
    // Scan custom candles
    const scanResult = scanCandles('SIMULATION', timeframe, customCandles);
    setFvgs(scanResult.fvgs);
    setOrderBlocks(scanResult.orderBlocks);
    setMarketStructures(scanResult.marketStructures);
    setInducements(scanResult.inducements);
    setCisds(scanResult.cisds || []);
    setActiveSignal(scanResult.activeSignal);
    setTrend(scanResult.trend);
    setAiAnalysis('');
    setSelectedPatternId(null);
  };

  // Call server-side Gemini AI for institutional market report
  const handleGetAiAnalysis = async () => {
    if (candles.length === 0) return;
    setAiLoading(true);
    setAiAnalysis('');
    
    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          timeframe,
          trend,
          fvgsCount: fvgs.length,
          ifvgsCount: fvgs.filter(f => f.isInverted).length,
          obsCount: orderBlocks.length,
          structures: marketStructures.slice(-8), // Send last 8 structures
          activeSignal,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setAiAnalysis(data.analysis);
      } else {
        setAiAnalysis(`## Gagal Memproses Laporan\n\n${data.error || 'Server mengalami kendala.'}`);
      }
    } catch (error) {
      console.error(error);
      setAiAnalysis(`## Gangguan Koneksi\n\nGagal memanggil mesin analis kecerdasan buatan Gemini. Silakan coba kembali beberapa saat lagi.`);
    } finally {
      setAiLoading(false);
    }
  };

  // Log active signal into simulated trades database
  const handleExecuteSimTrade = () => {
    if (!activeSignal) return;
    
    const entryPrice = (activeSignal.entryRange.min + activeSignal.entryRange.max) / 2;
    const size = activeSignal.type === 'BUY' ? 0.5 : 1.0; // dummy BTC sizes
    
    const newTrade = {
      id: `sim-trade-${Date.now()}`,
      symbol: activeSignal.symbol,
      timeframe: activeSignal.timeframe,
      type: activeSignal.type,
      entryPrice,
      stopLoss: activeSignal.stopLoss,
      takeProfit: activeSignal.takeProfit3,
      timestamp: Date.now(),
      status: 'TERBUKA',
      currentPrice: candles[candles.length - 1].close,
      profit: 0,
    };

    // Calculate initial profit
    const pnl = newTrade.type === 'BUY' 
      ? (newTrade.currentPrice - entryPrice) * size * 100 
      : (entryPrice - newTrade.currentPrice) * size * 100;
    newTrade.profit = pnl;

    const updated = [newTrade, ...simulatedTrades];
    setSimulatedTrades(updated);
    localStorage.setItem('ict_sim_trades', JSON.stringify(updated));
  };

  // Clear simulated trades log
  const handleClearTradesLog = () => {
    setSimulatedTrades([]);
    localStorage.removeItem('ict_sim_trades');
  };

  // Copy AI Analysis text to clipboard
  const handleCopyAnalysis = () => {
    navigator.clipboard.writeText(aiAnalysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Custom regex-based Markdown-to-HTML parser (bulletproof against React 19 package mismatches)
  const renderParsedMarkdown = (markdownText: string) => {
    if (!markdownText) return null;
    
    const lines = markdownText.split('\n');
    return lines.map((line, index) => {
      // Remove trailing/leading whitespaces
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('## ')) {
        return <h2 key={index} className="text-md font-bold text-gray-100 border-b border-gray-800 pb-1 mt-4 mb-2">{trimmedLine.replace('## ', '')}</h2>;
      }
      if (trimmedLine.startsWith('### ') || trimmedLine.startsWith('📌 ') || trimmedLine.startsWith('🌀 ') || trimmedLine.startsWith('💼 ') || trimmedLine.startsWith('🎯 ') || trimmedLine.startsWith('🛡️ ')) {
        return <h3 key={index} className="text-sm font-semibold text-emerald-400 mt-3 mb-1">{trimmedLine.replace('### ', '')}</h3>;
      }
      if (trimmedLine.startsWith('1. ') || trimmedLine.startsWith('2. ') || trimmedLine.startsWith('3. ') || trimmedLine.startsWith('4. ') || trimmedLine.startsWith('5. ')) {
        return <p key={index} className="text-xs font-semibold text-gray-200 mt-2 pl-1">{trimmedLine}</p>;
      }
      if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
        const itemText = trimmedLine.substring(2);
        
        // Parse simple bold tag **text**
        const boldParts = itemText.split('**');
        if (boldParts.length >= 3) {
          return (
            <li key={index} className="text-xs text-gray-300 ml-4 list-disc pl-1 py-0.5">
              <strong className="text-gray-100">{boldParts[1]}</strong>
              {boldParts.slice(2).join('')}
            </li>
          );
        }
        return <li key={index} className="text-xs text-gray-300 ml-4 list-disc pl-1 py-0.5">{itemText}</li>;
      }
      if (trimmedLine.startsWith('> ')) {
        return (
          <blockquote key={index} className="border-l-2 border-purple-500 bg-purple-950/10 text-purple-300 text-xs p-2 rounded my-2 italic">
            {trimmedLine.replace('> ', '')}
          </blockquote>
        );
      }
      if (trimmedLine === '') {
        return <div key={index} className="h-1.5" />;
      }
      
      // Default normal paragraph
      const boldParts = trimmedLine.split('**');
      if (boldParts.length >= 3) {
        return (
          <p key={index} className="text-xs text-gray-300 py-0.5 leading-relaxed">
            {boldParts[0]}
            <strong className="text-gray-100">{boldParts[1]}</strong>
            {boldParts.slice(2).join('')}
          </p>
        );
      }

      return <p key={index} className="text-xs text-gray-300 py-0.5 leading-relaxed">{trimmedLine}</p>;
    });
  };

  // Find selected pattern details to showcase at the bottom of the chart
  const selectedPatternDetail = useMemo(() => {
    if (!selectedPatternId) return null;
    
    const foundFvg = fvgs.find(f => f.id === selectedPatternId);
    if (foundFvg) {
      return {
        title: foundFvg.isInverted ? `Inversion FVG (${foundFvg.invertedType === 'bearish_to_bullish' ? 'Bullish' : 'Bearish'})` : `Fair Value Gap (${foundFvg.type === 'bullish' ? 'Bullish' : 'Bearish'})`,
        desc: foundFvg.isInverted 
          ? `Lilin #${foundFvg.candleIndex + 1} membentuk ketidakseimbangan harga yang kemudian dijebol pada lilin #${(foundFvg.invertedAtIndex || 0) + 1}. Zona ini telah terbalik murni menjadi Inversion FVG.` 
          : `Area celah harga antara High Lilin #${foundFvg.startIndex + 1} dan Low Lilin #${foundFvg.endIndex + 1} akibat ketidakseimbangan order flow. Area ini ${foundFvg.isMitigated ? 'telah termitigasi (disentuh kembali).' : 'masih aktif (belum terisi).'}`,
        range: `${foundFvg.bottom.toFixed(2)} - ${foundFvg.top.toFixed(2)}`,
        status: foundFvg.isInverted ? 'INVERTED (FLIPPED)' : (foundFvg.isMitigated ? 'MITIGATED (FILLED)' : 'ACTIVE (UNFILLED)'),
        colorClass: foundFvg.isInverted ? 'text-purple-400' : (foundFvg.isMitigated ? 'text-gray-400' : (foundFvg.type === 'bullish' ? 'text-emerald-400' : 'text-rose-400')),
      };
    }

    const foundOb = orderBlocks.find(o => o.id === selectedPatternId);
    if (foundOb) {
      return {
        title: `${foundOb.type === 'bullish' ? 'Bullish' : 'Bearish'} Order Block (OB)`,
        desc: `Candle ${foundOb.type === 'bullish' ? 'bearish' : 'bullish'} terakhir pada lilin #${foundOb.candleIndex + 1} sebelum ekspansi masif terjadi. Bank sentral mengantrekan limit order di rentang ini untuk mempertahankan bias harga.`,
        range: `${foundOb.bottom.toFixed(2)} - ${foundOb.top.toFixed(2)}`,
        status: `MITIGATION LEVEL (${foundOb.strength.toUpperCase()})`,
        colorClass: foundOb.type === 'bullish' ? 'text-blue-400' : 'text-rose-400',
      };
    }

    const foundMs = marketStructures.find(m => m.id === selectedPatternId);
    if (foundMs) {
      return {
        title: `${foundMs.style} (${foundMs.type === 'bullish' ? 'Bullish Shift' : 'Bearish Shift'})`,
        desc: `Struktur pasar terkonfirmasi bergeser di lilin #${foundMs.candleIndex + 1} dengan penutupan badan lilin tegas melewati level swing ${foundMs.type === 'bullish' ? 'high' : 'low'} yang dibentuk sebelumnya pada lilin #${foundMs.levelIndex + 1}.`,
        range: `Harga Level Break: ${foundMs.price.toFixed(2)}`,
        status: 'CONFIRMED STRUCTURE BREAK',
        colorClass: foundMs.type === 'bullish' ? 'text-emerald-400' : 'text-rose-400',
      };
    }

    return null;
  }, [selectedPatternId, fvgs, orderBlocks, marketStructures]);

  return (
    <div id="ict-app-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* 1. BRANDING HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md py-4 px-4 md:px-8 sticky top-0 z-40 w-full">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 w-10 h-10 rounded-sm flex items-center justify-center shadow-lg shadow-indigo-600/10">
              <LineChart className="text-white w-5.5 h-5.5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white font-sans">
                  ICT <span className="text-indigo-400 font-light">INSTITUTIONAL</span>
                </h1>
                <span className="text-[10px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-sm font-bold tracking-wider uppercase">
                  IFG & SMC ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400">Algorithmic scanning for Inversion Fair Value Gaps, Order Blocks, and Market Shifts</p>
            </div>
          </div>

          {/* Time, Fullscreen & Server Status */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            {viewMode === 'realtime' ? (
              <span className="flex items-center gap-1.5 bg-indigo-950/40 px-3 py-1.5 rounded border border-indigo-900/40 text-indigo-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE UPDATING: <span className="text-slate-200">{lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-amber-950/30 px-3 py-1.5 rounded border border-amber-900/30 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                SANDBOX DATA ACTIVE
              </span>
            )}
            {viewMode === 'sandbox' && (
              <button
                onClick={() => {
                  setViewMode('realtime');
                  fetchMarketData(symbol, timeframe, false, true);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm text-xs font-bold transition shadow-sm flex items-center gap-1 cursor-pointer font-sans"
              >
                <RefreshCw className="w-3 h-3" /> Hubungkan Live
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullScreen}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-sm text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer font-sans"
              title={isFullscreen ? "Keluar Fullscreen" : "Layar Penuh (Fullscreen)"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Keluar Layar Penuh</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Layar Penuh</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN HUB CONTENT */}
      <main className="flex-1 w-full px-4 md:px-8 py-4 md:py-6 space-y-6 max-w-none">

        {/* TAB NAVIGATION SYSTEM */}
        <div id="navigation-tabs" className="border-b border-slate-800 flex flex-wrap gap-1 md:gap-2">
          <button
            id="tab-chart"
            onClick={() => setActiveTab('chart')}
            className={`flex items-center gap-2 py-3 px-4 text-xs md:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'chart'
                ? 'border-indigo-500 text-white bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
            }`}
          >
            <LineChart className="w-4 h-4 text-indigo-400" />
            <span>Grafik Single (1 Chart)</span>
            <span className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">Widescreen</span>
          </button>

          <button
            id="tab-multichart"
            onClick={() => setActiveTab('multichart')}
            className={`flex items-center gap-2 py-3 px-4 text-xs md:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'multichart'
                ? 'border-indigo-500 text-white bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-indigo-400" />
            <span>Multi-Panel (4 Chart Grid)</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">4 Panel</span>
          </button>

          <button
            id="tab-scanner"
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-2 py-3 px-4 text-xs md:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'scanner'
                ? 'border-indigo-500 text-white bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
            }`}
          >
            <Bot className="w-4 h-4 text-indigo-400" />
            <span>Radar Sinyal & Analisis AI</span>
            {activeSignal && (
              <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full ${
                activeSignal.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
              }`}>
                {activeSignal.type} ACTIVE
              </span>
            )}
          </button>

          <button
            id="tab-sandbox"
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-2 py-3 px-4 text-xs md:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'sandbox'
                ? 'border-indigo-500 text-white bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Sandbox Skenario</span>
          </button>
        </div>

        {/* Tab Content 1: Grafik Single */}
        {activeTab === 'chart' && (
          <div className="w-full space-y-4 animate-fade-in">
            {/* Compact Selector Bar for widescreen chart */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 px-4 py-3 rounded-lg border border-slate-800 shadow-md">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="ticker-select-chart" className="text-xs text-slate-400 font-semibold font-sans">Aset:</label>
                  <select
                    id="ticker-select-chart"
                    value={symbol}
                    onChange={(e) => {
                      setSymbol(e.target.value);
                      if (viewMode === 'sandbox') setViewMode('realtime');
                    }}
                    className="bg-slate-950 border border-slate-800 text-slate-200 rounded-sm py-1 px-2.5 text-xs font-bold focus:border-indigo-500 focus:outline-none"
                  >
                    {tickers.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold font-sans">Timeframe:</span>
                  <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800/80">
                    {timeframes.map((tf) => (
                      <button
                        key={tf.value}
                        onClick={() => {
                          setTimeframe(tf.value);
                          if (viewMode === 'sandbox') setViewMode('realtime');
                        }}
                        className={`px-3 py-1 text-[11px] font-bold rounded-sm transition-all ${
                          timeframe === tf.value
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tf.value}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeSignal && (
                  <div className="hidden sm:flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded">
                    <span className={`w-1.5 h-1.5 rounded-full ${activeSignal.type === 'BUY' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    <span className="text-[10px] font-extrabold text-slate-300 font-mono">
                      {activeSignal.type} @ {((activeSignal.entryRange.min + activeSignal.entryRange.max)/2).toFixed(1)}
                    </span>
                  </div>
                )}
                
                <button
                  onClick={() => setActiveTab('multichart')}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 font-bold text-xs rounded-sm transition flex items-center gap-1.5 cursor-pointer"
                  title="Buka 4 Chart Grid Sekaligus"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Mode 4 Chart Grid</span>
                </button>

                <button
                  onClick={() => {
                    if (viewMode === 'sandbox') setViewMode('realtime');
                    fetchMarketData(symbol, timeframe, false, true);
                  }}
                  className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-sm transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Pindai Ulang
                </button>
              </div>
            </div>

            {loading ? (
              <div className="bg-slate-900 rounded-lg border border-slate-800 h-[520px] flex flex-col items-center justify-center gap-4">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-sm font-mono text-slate-400">Memproses korelasi algoritma & liquidity pool...</p>
              </div>
            ) : (
              <IctChart
                candles={candles}
                fvgs={fvgs}
                orderBlocks={orderBlocks}
                marketStructures={marketStructures}
                inducements={inducements}
                cisds={cisds}
                activeSignal={activeSignal}
                selectedPatternId={selectedPatternId}
                onSelectPattern={setSelectedPatternId}
                timeframe={timeframe}
              />
            )}
          </div>
        )}

        {/* Tab Content 1.5: Multi-Panel Grid (4 Chart) */}
        {activeTab === 'multichart' && (
          <MultiPanelGrid
            currentSymbol={symbol}
            onSymbolChange={setSymbol}
            tickers={tickers}
            timeframes={timeframes}
            selectedPatternId={selectedPatternId}
            onSelectPattern={setSelectedPatternId}
          />
        )}

        {/* Tab Content 2: Radar Sinyal & Analisis AI */}
        {activeTab === 'scanner' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Controls and Active Signal Card (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Ticker & Timeframe Panel */}
              <div id="ticker-config-panel" className="bg-slate-900 rounded-lg border border-slate-800 p-5 shadow-lg">
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-indigo-400" /> Pengaturan Scanner
                </h3>
                
                <div className="space-y-4">
                  {/* Select Coin */}
                  <div className="space-y-1.5">
                    <label htmlFor="ticker-select" className="text-xs text-slate-400 font-medium">Pilih Aset Kripto / Forex</label>
                    <select
                      id="ticker-select"
                      value={symbol}
                      onChange={(e) => {
                        setSymbol(e.target.value);
                        if (viewMode === 'sandbox') setViewMode('realtime');
                      }}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-sm p-2.5 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                    >
                      {tickers.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Timeframe */}
                  <div className="space-y-1.5">
                    <label htmlFor="timeframe-select" className="text-xs text-slate-400 font-medium">Timeframe Sesi</label>
                    <div className="grid grid-cols-2 gap-2">
                      {timeframes.map((tf) => (
                        <button
                          key={tf.value}
                          id={`btn-tf-${tf.value}`}
                          onClick={() => {
                            setTimeframe(tf.value);
                            if (viewMode === 'sandbox') setViewMode('realtime');
                          }}
                          className={`px-3 py-2 text-xs font-medium rounded-sm border transition-all ${
                            timeframe === tf.value
                              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          {tf.value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    id="btn-scan-refresh"
                    onClick={() => {
                      if (viewMode === 'sandbox') setViewMode('realtime');
                      fetchMarketData(symbol, timeframe, false, true);
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-sm transition shadow-md shadow-indigo-900/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Pindai Ulang Arah Institusional
                  </button>
                  <p className="text-[10px] text-slate-500 text-center font-mono mt-1">
                    ⚡ Grafik & deteksi sinyal diperbarui otomatis setiap 10 detik
                  </p>
                </div>
              </div>

              {/* AUTOMATIC TRADE SIGNAL CARD */}
              <div 
                id="active-signal-card" 
                className={`bg-slate-900 rounded-lg border p-5 shadow-lg relative overflow-hidden transition-all duration-300 ${
                  pulseActive 
                    ? (activeSignal?.type === 'BUY' ? 'animate-border-pulse-buy border-emerald-500' : 'animate-border-pulse-sell border-rose-500') 
                    : 'border-slate-800'
                }`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Rekomendasi Sinyal SMC</h3>
                    <p className="text-[10px] text-slate-400 font-mono">{customLabel}</p>
                  </div>
                  {activeSignal && (
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold ${
                        activeSignal.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {activeSignal.type} SETUP
                      </span>
                      
                      {activeSignal.status === 'hit_tp' ? (
                        <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-emerald-500 text-slate-950 border border-emerald-600">
                          🎯 HIT TP
                        </span>
                      ) : activeSignal.status === 'hit_sl' ? (
                        <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-rose-500 text-slate-950 border border-rose-600">
                          🛑 HIT SL
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                    <span className="text-xs text-slate-400 font-mono">Memindai imbalances harga...</span>
                  </div>
                ) : activeSignal ? (
                  <div className="space-y-4">
                    {/* Setup badge & explanation */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase font-mono tracking-wider">
                        💡 Setup: {activeSignal.setupType}
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-sm border border-slate-800/50">
                        {activeSignal.explanation}
                      </p>
                    </div>

                    {activeSignal.status === 'hit_tp' && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-sm p-2.5 text-center">
                        <span className="text-[10px] font-bold text-emerald-400 font-mono block">
                          🎯 SINYAL SUKSES: TARGET TAKE PROFIT TERCAPAI
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          Struktur institusional berjalan dengan rasio 1:3 RRR. Tingkat target TP3 dipenuhi. Sinyal dikunci.
                        </span>
                      </div>
                    )}
                    {activeSignal.status === 'hit_sl' && (
                      <div className="bg-rose-500/10 border border-rose-500/30 rounded-sm p-2.5 text-center">
                        <span className="text-[10px] font-bold text-rose-400 font-mono block">
                          🛑 SINYAL BATAL: STOP LOSS TERKENA
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          Batas risiko terlewati oleh pergerakan harga pasar, membatalkan arah setup institusional. Sinyal dikunci.
                        </span>
                      </div>
                    )}

                    {/* Fibonacci OTE Zone Detail Card */}
                    {activeSignal.oteZone && (
                      <div className="bg-slate-950/80 border border-amber-500/20 rounded-sm p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-amber-400 uppercase font-mono tracking-wider">
                            🔑 Optimal Trade Entry (OTE) Zone
                          </span>
                          <span className="text-[8px] bg-amber-500/10 text-amber-400 font-bold px-1.5 py-0.5 rounded-sm">
                            62% - 79% Retracement
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                          <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                            <span className="text-[8px] text-slate-400 block mb-0.5 font-sans">FIB 62%</span>
                            <span className="font-bold text-slate-200">{activeSignal.oteZone.fib62}</span>
                          </div>
                          <div className="bg-amber-500/10 p-1.5 rounded border border-amber-500/30">
                            <span className="text-[8px] text-amber-400 block font-bold mb-0.5 font-sans">🎯 Sweet 70.5%</span>
                            <span className="font-extrabold text-amber-300">{activeSignal.oteZone.fib705}</span>
                          </div>
                          <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                            <span className="text-[8px] text-slate-400 block mb-0.5 font-sans">FIB 79%</span>
                            <span className="font-bold text-slate-200">{activeSignal.oteZone.fib79}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[8.5px] text-slate-500 font-mono">
                          <span>Impulse Low: {activeSignal.oteZone.swingLow}</span>
                          <span>Impulse High: {activeSignal.oteZone.swingHigh}</span>
                        </div>
                      </div>
                    )}

                    {/* Levels values block */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-sm text-center">
                        <span className="text-[9px] text-slate-400 block uppercase font-mono">Area Batas Entri</span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          {activeSignal.entryRange.min} - {activeSignal.entryRange.max}
                        </span>
                      </div>
                      <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-sm text-center">
                        <span className="text-[9px] text-slate-400 block uppercase font-mono">Stop Loss (Batal)</span>
                        <span className="text-xs font-bold text-rose-400 font-mono">
                          {activeSignal.stopLoss}
                        </span>
                      </div>
                    </div>

                    {/* Take Profits Target */}
                    <div className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-sm space-y-1.5">
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Target Likuiditas Institusi</span>
                      <div className="grid grid-cols-3 gap-2 font-mono text-center">
                        <div className="bg-slate-900/60 p-1.5 rounded-sm border border-slate-800">
                          <span className="text-[8px] text-slate-400 block">TP1</span>
                          <span className="text-xs font-bold text-slate-200">{activeSignal.takeProfit1}</span>
                        </div>
                        <div className="bg-slate-900/60 p-1.5 rounded-sm border border-slate-800">
                          <span className="text-[8px] text-slate-400 block">TP2</span>
                          <span className="text-xs font-bold text-slate-200">{activeSignal.takeProfit2}</span>
                        </div>
                        <div className="bg-slate-900/60 p-1.5 rounded-sm border border-slate-800">
                          <span className="text-[8px] text-slate-400 block">TP3</span>
                          <span className="text-xs font-bold text-slate-200">{activeSignal.takeProfit3}</span>
                        </div>
                      </div>
                    </div>

                    {/* Risk Reward Ratio and Execute */}
                    <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                      <div className="text-xs">
                        <span className="text-slate-400">Rasio R:R: </span>
                        <span className="font-bold text-emerald-400 font-mono">1 : {activeSignal.riskRewardRatio}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {(activeSignal.status === 'hit_sl' || activeSignal.status === 'hit_tp') ? (
                          <button
                            id="btn-scan-new-from-card"
                            onClick={() => {
                              if (viewMode === 'sandbox') setViewMode('realtime');
                              fetchMarketData(symbol, timeframe, false, true);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-sm shadow transition flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Cari Sinyal Baru
                          </button>
                        ) : (
                          <button
                            id="btn-execute-trade"
                            onClick={handleExecuteSimTrade}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-sm shadow transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Log Sim Trade
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center bg-slate-950/50 rounded-sm border border-slate-800">
                    <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                    <span className="text-xs text-slate-400 block font-medium px-4">
                      Belum terdeteksi konfirmasi IFG dekat BSL/SSL, retest FVG, atau mitigasi Order Block kuat pada lilin saat ini.
                    </span>
                    <span className="text-[10px] text-emerald-400 mt-1 block">
                      Pantau pergerakan atau coba beralih Timeframe.
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: AI Co-Pilot (8 cols) */}
            <div className="lg:col-span-8">
              
              {/* AI CO-PILOT MODULE */}
              <div id="ai-copilot-module" className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg h-full flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-indigo-600 rounded-sm">
                      <Bot className="text-white w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">AI Institutional Analyst Co-Pilot (Gemini)</h3>
                      <p className="text-[11px] text-slate-400">Mintalah penjelasan institutional berbasis SMC mendalam</p>
                    </div>
                  </div>

                  <button
                    id="btn-get-ai-analysis"
                    onClick={handleGetAiAnalysis}
                    disabled={aiLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm text-xs font-bold shadow-lg hover:shadow-indigo-500/10 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                    {aiLoading ? 'Menganalisis Pola...' : 'Dapatkan Analisis AI Institusional'}
                  </button>
                </div>

                {/* AI Output Window */}
                <div className="flex-1 flex flex-col justify-between">
                  {aiLoading ? (
                    <div className="py-24 flex-1 flex flex-col items-center justify-center gap-4 bg-slate-950/30 rounded-lg border border-slate-800/80">
                      <div className="relative">
                        <Bot className="w-10 h-10 text-indigo-400 animate-bounce" />
                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-xs font-semibold text-indigo-300">Menyusun Analisis Struktur Pasar Institusional...</p>
                        <p className="text-[10px] text-slate-500 font-mono">Mengkalkulasi FVG, Inversions, sweeps, dan invalidation levels</p>
                      </div>
                    </div>
                  ) : aiAnalysis ? (
                    <div className="bg-slate-950/50 rounded-lg border border-slate-800/80 p-5 space-y-4 relative text-left flex-1">
                      {/* Copy details */}
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button
                          id="btn-copy-analysis"
                          onClick={handleCopyAnalysis}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded transition border border-slate-800 bg-slate-950/90"
                          title="Salin analisis"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="prose prose-invert max-w-none text-left">
                        {renderParsedMarkdown(aiAnalysis)}
                      </div>
                    </div>
                  ) : (
                    <div className="py-24 text-center bg-slate-950/20 rounded-lg border border-dashed border-slate-800 flex-1 flex flex-col items-center justify-center">
                      <Bot className="w-7 h-7 text-slate-500 mx-auto mb-2" />
                      <span className="text-xs text-slate-400 block font-medium">Klik tombol di atas untuk merumuskan laporan arah institusi.</span>
                      <span className="text-[10px] text-indigo-400/80 mt-1 block">Analis Gemini akan mengevaluasi semua FVG, IFG, dan MSS dalam laporan tertulis profesional.</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab Content 3: Sandbox Skenario */}
        {activeTab === 'sandbox' && (
          <SimulationSandbox onLoadSimulatedCandles={handleLoadSimulatedCandles} />
        )}

        {/* 3. SIMULATED POSITIONS / SIGNALS HISTORY LEDGER */}
        {activeTab !== 'chart' && simulatedTrades.length > 0 && (
          <div id="trades-history-ledger" className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <History className="text-indigo-400 w-5 h-5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Buku Catatan Transaksi Simulasi (Performance Ledger)</h3>
                  <p className="text-xs text-slate-400">Lacak performa eksekusi sinyal ICT yang disimpan lokal</p>
                </div>
              </div>
              <button
                id="btn-clear-ledger"
                onClick={handleClearTradesLog}
                className="px-2.5 py-1 hover:bg-rose-950/40 text-rose-400 border border-transparent hover:border-rose-900/30 rounded-sm text-[11px] font-medium transition cursor-pointer"
              >
                Hapus Semua Log
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 font-semibold">
                    <th className="pb-2">Waktu Log</th>
                    <th className="pb-2">Pasangan</th>
                    <th className="pb-2">Tipe Setup</th>
                    <th className="pb-2">Harga Entri</th>
                    <th className="pb-2">Harga Sekarang</th>
                    <th className="pb-2">Batas Stop Loss</th>
                    <th className="pb-2 text-right">Sim. Profit/Loss (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-mono text-xs">
                  {simulatedTrades.map((trade) => {
                    const isBuy = trade.type === 'BUY';
                    const diff = trade.currentPrice - trade.entryPrice;
                    const pnlVal = isBuy ? diff : -diff;
                    const isProfit = pnlVal >= 0;

                    return (
                      <tr key={trade.id} className="text-slate-300">
                        <td className="py-2.5 text-slate-500">{new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-2.5">
                          <span className="font-bold text-slate-100">{trade.symbol}</span>
                          <span className="text-[10px] bg-slate-950 text-slate-400 px-1 py-0.5 rounded-sm ml-1.5">{trade.timeframe}</span>
                        </td>
                        <td className="py-2.5">
                          <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold ${isBuy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {trade.type}
                          </span>
                        </td>
                        <td className="py-2.5">{trade.entryPrice.toFixed(2)}</td>
                        <td className="py-2.5">{trade.currentPrice.toFixed(2)}</td>
                        <td className="py-2.5 text-rose-400">{trade.stopLoss.toFixed(2)}</td>
                        <td className={`py-2.5 text-right font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfit ? '+' : ''}{(pnlVal * 10).toFixed(2)} USD
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. EDUCATIONAL CHEAT SHEET PORTAL */}
        {activeTab !== 'chart' && <EducationalPortal />}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-6 px-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto space-y-1.5">
          <p>© 2026 ICT Institutional Signal Scanner. Hak Cipta Dilindungi Undang-Undang.</p>
          <p className="text-[11px] text-slate-400/60">DISCLAIMER: Konten dan modul ini semata-mata ditujukan untuk keperluan edukasi simulasi. Perdagangan aset kripto dan valuta asing melibatkan risiko tinggi. Analis kecerdasan buatan bukanlah saran penasihat finansial resmi.</p>
        </div>
      </footer>

    </div>
  );
}
