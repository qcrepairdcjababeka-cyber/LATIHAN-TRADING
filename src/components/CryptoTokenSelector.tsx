import React, { useState, useMemo } from 'react';
import { 
  CRYPTO_TOKENS, 
  TokenInfo, 
  XAUUSD_TOKENS,
  TOP_10_TOKENS, 
  TOP_100_TOKENS, 
  TOP_500_TOKENS,
  ALPHA_TOKENS 
} from '../data/cryptoTokens';
import { 
  Search, 
  Sparkles, 
  Flame, 
  Layers, 
  TrendingUp, 
  Check, 
  Zap, 
  Rocket, 
  Star,
  ChevronDown,
  X,
  Coins,
  Globe
} from 'lucide-react';

interface CryptoTokenSelectorProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export default function CryptoTokenSelector({
  selectedSymbol,
  onSelectSymbol,
}: CryptoTokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'xauusd' | 'top10' | 'top100' | 'top500' | 'alpha'>('all');
  const [activeSector, setActiveSector] = useState<string>('all');

  const currentToken = useMemo(() => {
    return (
      CRYPTO_TOKENS.find((t) => t.symbol === selectedSymbol) || {
        symbol: selectedSymbol,
        base: selectedSymbol.replace('USDT', ''),
        name: selectedSymbol,
        category: 'top10',
        sector: 'Layer 1/2',
      }
    );
  }, [selectedSymbol]);

  const sectors = useMemo(() => {
    const set = new Set<string>();
    CRYPTO_TOKENS.forEach((t) => set.add(t.sector));
    return ['all', ...Array.from(set)];
  }, []);

  const filteredTokens = useMemo(() => {
    return CRYPTO_TOKENS.filter((t) => {
      // Category filter
      if (activeCategory === 'xauusd' && t.category !== 'xauusd') return false;
      if (activeCategory === 'top10' && t.category !== 'top10') return false;
      if (activeCategory === 'top100' && t.category !== 'top10' && t.category !== 'top100') return false;
      if (activeCategory === 'top500' && t.category !== 'top10' && t.category !== 'top100' && t.category !== 'top500' && t.category !== 'alpha') return false;
      if (activeCategory === 'alpha' && t.category !== 'alpha') return false;

      // Sector filter
      if (activeSector !== 'all' && t.sector !== activeSector) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return (
          t.symbol.toLowerCase().includes(query) ||
          t.base.toLowerCase().includes(query) ||
          t.name.toLowerCase().includes(query) ||
          t.sector.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [activeCategory, activeSector, searchQuery]);

  return (
    <div className="relative inline-block font-sans text-xs">
      {/* Trigger Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2.5 bg-slate-950 hover:bg-slate-900 border px-3.5 py-2 rounded-xl text-slate-100 transition shadow-sm cursor-pointer group ${
            currentToken.category === 'xauusd'
              ? 'border-amber-500/60 bg-amber-950/20 hover:border-amber-400'
              : 'border-slate-800 hover:border-indigo-500/50'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              currentToken.category === 'xauusd' ? 'bg-amber-400' : 'bg-emerald-400'
            }`}></span>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">ASET:</span>
            <span className={`text-sm font-black transition ${
              currentToken.category === 'xauusd' ? 'text-amber-300 group-hover:text-amber-200' : 'text-white group-hover:text-indigo-300'
            }`}>
              {currentToken.symbol === 'XAUUSD' ? 'XAU/USD (Gold)' : `${currentToken.base}/USDT`}
            </span>
          </div>

          <span className={`hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full font-bold border ${
            currentToken.category === 'xauusd'
              ? 'bg-amber-950/90 text-amber-300 border-amber-500/40'
              : currentToken.category === 'alpha' 
              ? 'bg-amber-950/80 text-amber-300 border-amber-500/30' 
              : currentToken.category === 'top10' 
              ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30' 
              : currentToken.category === 'top100'
              ? 'bg-blue-950/80 text-blue-300 border-blue-500/30'
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
          }`}>
            {currentToken.category === 'xauusd' 
              ? '🏆 Gold Spot (XAU)' 
              : currentToken.category === 'alpha' 
              ? '🚀 Binance Alpha' 
              : currentToken.category === 'top10' 
              ? '⚡ Top 10' 
              : currentToken.category === 'top100'
              ? '💎 Top 100'
              : '🌐 Top 500 Altcoin'}
          </span>

          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} />
        </button>

        {/* Quick Shortcut Buttons */}
        <div className="hidden xl:flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
          {/* Quick Gold Button */}
          <button
            onClick={() => onSelectSymbol('XAUUSD')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              selectedSymbol === 'XAUUSD' || selectedSymbol === 'PAXGUSDT'
                ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-400/50'
                : 'text-amber-300 hover:bg-amber-500/10 border border-amber-500/30'
            }`}
          >
            <Coins className="w-3 h-3 text-amber-400" />
            <span>XAU/USD (Gold)</span>
          </button>

          {['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT', 'PEPEUSDT', 'NEIROUSDT'].map((sym) => {
            const tok = CRYPTO_TOKENS.find((t) => t.symbol === sym);
            const isSel = selectedSymbol === sym;
            const isAlpha = tok?.category === 'alpha';
            return (
              <button
                key={sym}
                onClick={() => onSelectSymbol(sym)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  isSel
                    ? 'bg-indigo-600 text-white shadow-md'
                    : isAlpha
                    ? 'text-amber-300 hover:bg-amber-500/10 border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                {isAlpha && <Rocket className="w-3 h-3 text-amber-400" />}
                <span>{tok?.base || sym.replace('USDT', '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal / Popover Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs" 
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div className="absolute left-0 top-full mt-2 z-50 w-[340px] sm:w-[540px] md:w-[680px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Header with Search */}
            <div className="p-3.5 bg-slate-950/90 border-b border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-sm font-black text-white">Pilih Aset Trading: Gold (XAUUSD) & Top Crypto 1 - 500</h4>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Emas, Ticker atau Nama (misal: XAU, Gold, BTC, SOL, SUI, ARKM, PEPE, CAKE)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Main Category Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  onClick={() => { setActiveCategory('all'); setActiveSector('all'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeCategory === 'all'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Semua ({CRYPTO_TOKENS.length})</span>
                </button>

                <button
                  onClick={() => { setActiveCategory('xauusd'); setActiveSector('all'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeCategory === 'xauusd'
                      ? 'bg-amber-600 text-white shadow ring-1 ring-amber-400/50'
                      : 'bg-slate-900 text-amber-400 hover:text-amber-300 border border-amber-500/30'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gold (XAU/USD)</span>
                </button>

                <button
                  onClick={() => { setActiveCategory('top10'); setActiveSector('all'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeCategory === 'top10'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Top 10 ({TOP_10_TOKENS.length})</span>
                </button>

                <button
                  onClick={() => { setActiveCategory('top100'); setActiveSector('all'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeCategory === 'top100'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 text-blue-400" />
                  <span>Top 100 ({TOP_100_TOKENS.length})</span>
                </button>

                <button
                  onClick={() => { setActiveCategory('top500'); setActiveSector('all'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeCategory === 'top500'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Top 100 - 500 ({TOP_500_TOKENS.length})</span>
                </button>

                <button
                  onClick={() => { setActiveCategory('alpha'); setActiveSector('all'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeCategory === 'alpha'
                      ? 'bg-amber-600 text-white shadow ring-1 ring-amber-400/50'
                      : 'bg-slate-900 text-amber-400 hover:text-amber-300 border border-amber-500/30'
                  }`}
                >
                  <Rocket className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                  <span>Binance Alpha ({ALPHA_TOKENS.length})</span>
                </button>
              </div>
            </div>

            {/* Token List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar min-h-[280px] max-h-[420px]">
              {filteredTokens.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Tidak ditemukan aset atau token yang sesuai kriteria pencarian.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {filteredTokens.map((token) => {
                    const isSelected = selectedSymbol === token.symbol;
                    const isGold = token.category === 'xauusd';
                    const isAlpha = token.category === 'alpha';
                    return (
                      <button
                        key={token.symbol}
                        onClick={() => {
                          onSelectSymbol(token.symbol);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? isGold
                              ? 'bg-amber-950/80 border-amber-400 text-white shadow-md'
                              : 'bg-indigo-950/80 border-indigo-500 text-white shadow-md'
                            : isGold
                            ? 'bg-amber-950/30 border-amber-500/30 hover:border-amber-400/60 hover:bg-amber-950/50 text-amber-200'
                            : isAlpha
                            ? 'bg-slate-950/60 border-amber-500/20 hover:border-amber-500/50 hover:bg-slate-800/80 text-slate-200'
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                            isGold
                              ? 'bg-amber-500 text-slate-950 font-black shadow'
                              : isAlpha 
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30' 
                              : token.category === 'top10'
                              ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30'
                              : token.category === 'top100'
                              ? 'bg-blue-950/80 text-blue-300 border border-blue-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {isGold ? <Coins className="w-4 h-4 text-slate-950" /> : token.rank ? `#${token.rank}` : <Rocket className="w-4 h-4 text-amber-400" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-extrabold text-xs tracking-wide truncate ${
                                isGold ? 'text-amber-300' : 'text-white'
                              }`}>
                                {token.symbol === 'XAUUSD' ? 'XAU/USD' : token.base}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {token.symbol === 'XAUUSD' ? '(Gold)' : '/USDT'}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-slate-400 truncate max-w-[140px]">
                              {token.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                          <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold ${
                            isGold
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : isAlpha
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : token.category === 'top10'
                              ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {token.sector}
                          </span>

                          {isSelected && (
                            <Check className={`w-4 h-4 ml-1 ${isGold ? 'text-amber-400' : 'text-indigo-400'}`} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 px-4">
              <span>Menampilkan <strong>{filteredTokens.length}</strong> dari {CRYPTO_TOKENS.length} aset pasar terindeks</span>
              <span className="text-slate-500">Live Dual 4H & 5M Streaming</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
