/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { FreshSignalAlert } from '../types';
import { formatPrice } from '../utils/stfStrategyScanner';
import {
  TrendingUp,
  TrendingDown,
  X,
  ExternalLink,
  Volume2,
  Sparkles,
  ShieldAlert,
  Clock,
  Target
} from 'lucide-react';

interface AlertNotificationToastProps {
  alerts: FreshSignalAlert[];
  onDismiss: (id: string) => void;
  onOpenChart: (symbol: string) => void;
}

export default function AlertNotificationToast({
  alerts,
  onDismiss,
  onOpenChart,
}: AlertNotificationToastProps) {
  // Only display the 3 most recent active alerts in toast stack
  const visibleAlerts = alerts.slice(0, 3);

  if (visibleAlerts.length === 0) return null;

  return (
    <div
      id="fresh-signal-toasts-container"
      className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none"
    >
      {visibleAlerts.map((alert) => (
        <SingleToastItem
          key={alert.id}
          alert={alert}
          onDismiss={onDismiss}
          onOpenChart={onOpenChart}
        />
      ))}
    </div>
  );
}

function SingleToastItem({
  alert,
  onDismiss,
  onOpenChart,
}: {
  alert: FreshSignalAlert;
  onDismiss: (id: string) => void;
  onOpenChart: (symbol: string) => void;
}) {
  const [progress, setProgress] = useState<number>(100);
  const isBuy = alert.type === 'BUY';
  const onDismissRef = React.useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const duration = 9000; // 9 seconds
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 100);

    const timeout = setTimeout(() => {
      onDismissRef.current(alert.id);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [alert.id]);

  return (
    <div
      id={`toast-alert-${alert.id}`}
      className={`pointer-events-auto relative overflow-hidden rounded-xl border shadow-2xl backdrop-blur-xl transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-top-4 ${
        isBuy
          ? 'bg-slate-950/95 border-emerald-500/60 shadow-emerald-950/50 text-emerald-100 ring-1 ring-emerald-500/30'
          : 'bg-slate-950/95 border-rose-500/60 shadow-rose-950/50 text-rose-100 ring-1 ring-rose-500/30'
      }`}
    >
      {/* Top auto-dismiss progress bar */}
      <div className="w-full bg-slate-800/60 h-1">
        <div
          className={`h-full transition-all duration-100 ease-linear ${
            isBuy ? 'bg-emerald-400' : 'bg-rose-400'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-3.5 sm:p-4">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-lg flex items-center justify-center font-black text-xs ${
                isBuy
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}
            >
              {isBuy ? (
                <TrendingUp className="w-4 h-4 text-emerald-400 animate-bounce" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-400 animate-bounce" />
              )}
            </span>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-black text-white text-base tracking-wide">
                  {alert.symbol}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    isBuy
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-rose-500 text-slate-950'
                  }`}
                >
                  FRESH {alert.type}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span>Model ICT + CRT Institutional</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onDismiss(alert.id)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Tutup Notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Change description */}
        <p className="text-xs text-slate-300 mb-2.5 font-medium leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800/70">
          {alert.changeDescription}
        </p>

        {/* Parameter Grid: Entry, SL, TP1, TP2 */}
        <div className="grid grid-cols-4 gap-1.5 mb-3 text-center">
          <div className="bg-slate-900/80 border border-slate-800 p-1.5 rounded">
            <span className="block text-[9px] text-slate-400 font-bold uppercase">ENTRY FVG</span>
            <span className="font-mono text-xs font-bold text-sky-400">
              ${formatPrice(alert.entryPrice)}
            </span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-1.5 rounded">
            <span className="block text-[9px] text-rose-400 font-bold uppercase">STOP LOSS</span>
            <span className="font-mono text-xs font-bold text-rose-300">
              ${formatPrice(alert.stopLoss)}
            </span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-1.5 rounded">
            <span className="block text-[9px] text-emerald-400 font-bold uppercase">TP1 (50% EQ)</span>
            <span className="font-mono text-xs font-bold text-emerald-300">
              ${formatPrice(alert.takeProfit1)}
            </span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-1.5 rounded">
            <span className="block text-[9px] text-emerald-400 font-bold uppercase">TP2 (DOL)</span>
            <span className="font-mono text-xs font-black text-emerald-400">
              ${formatPrice(alert.takeProfit2)}
            </span>
          </div>
        </div>

        {/* Area Key Level Info Row */}
        {alert.keyLevelZone && (
          <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-sky-950/60 border border-sky-500/30 flex flex-wrap items-center justify-between gap-1 text-[10.5px] font-mono">
            <span className="text-sky-300 font-bold flex items-center gap-1">
              <Target className="w-3 h-3 text-sky-400" />
              <span>Key Level: ${formatPrice(alert.keyLevelZone.low)} - ${formatPrice(alert.keyLevelZone.high)}</span>
            </span>
            <span className="text-amber-300 font-bold">
              ★ Sweet Spot: ${formatPrice(alert.keyLevelZone.sweetSpot)}
            </span>
          </div>
        )}

        {/* Action Button: Buka di Chart */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            {alert.timeFormatted}
          </span>

          <button
            type="button"
            onClick={() => {
              onOpenChart(alert.symbol);
              onDismiss(alert.id);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
              isBuy
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-rose-500/20'
            }`}
          >
            <span>Buka Chart {alert.symbol}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
