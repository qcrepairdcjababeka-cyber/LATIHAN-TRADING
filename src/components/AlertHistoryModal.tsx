/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FreshSignalAlert } from '../types';
import { formatPrice } from '../utils/stfStrategyScanner';
import { alertSoundManager, requestDesktopNotificationPermission, sendDesktopNotification } from '../utils/alertSound';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Play,
  TrendingUp,
  TrendingDown,
  X,
  Trash2,
  CheckCheck,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
  Info,
  Target
} from 'lucide-react';

interface AlertHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: FreshSignalAlert[];
  onClearAll: () => void;
  onMarkAllRead: () => void;
  onOpenChart: (symbol: string) => void;
  onTriggerTestAlert?: (type: 'BUY' | 'SELL') => void;
}

export default function AlertHistoryModal({
  isOpen,
  onClose,
  alerts,
  onClearAll,
  onMarkAllRead,
  onOpenChart,
  onTriggerTestAlert,
}: AlertHistoryModalProps) {
  const [isMuted, setIsMuted] = useState<boolean>(alertSoundManager.getMuted());
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, [isOpen]);

  const handleToggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    alertSoundManager.setMuted(nextState);
  };

  const handleTestChime = (type: 'BUY' | 'SELL') => {
    if (type === 'BUY') {
      alertSoundManager.playBuyChime();
    } else {
      alertSoundManager.playSellChime();
    }
    if (onTriggerTestAlert) {
      onTriggerTestAlert(type);
    }
  };

  const handleRequestNotif = async () => {
    const res = await requestDesktopNotificationPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      sendDesktopNotification(
        '🔔 Notifikasi Sinyal ICT + CRT Aktif!',
        'Anda akan menerima peringatan desktop instan saat muncul perubahan sinyal Fresh BUY/SELL.'
      );
    }
  };

  if (!isOpen) return null;

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div
      id="alert-history-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="alert-history-modal-dialog"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <BellRing className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Pusat Notifikasi Alert Sinyal Fresh
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-xs">
                    {unreadCount} Baru
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Peringatan audio &amp; visual saat terkonfirmasi perubahan BUY / SELL pada model ICT + CRT
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Bar: Audio Controls & Permissions */}
        <div className="p-4 bg-slate-950/30 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Sound Mute Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSound}
              className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-2 transition-all ${
                isMuted
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span>{isMuted ? 'Suara Alert: Bisu (Muted)' : 'Suara Alert: Aktif (Chime)'}</span>
            </button>

            {/* Test Sound Buttons */}
            <button
              type="button"
              onClick={() => handleTestChime('BUY')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 border border-slate-700 font-semibold flex items-center gap-1.5 text-slate-300 transition-colors"
              title="Tes Bunyi Chime Fresh BUY"
            >
              <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
              <span>Tes Chime BUY</span>
            </button>

            <button
              type="button"
              onClick={() => handleTestChime('SELL')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 border border-slate-700 font-semibold flex items-center gap-1.5 text-slate-300 transition-colors"
              title="Tes Bunyi Chime Fresh SELL"
            >
              <Play className="w-3 h-3 text-rose-400 fill-rose-400" />
              <span>Tes Chime SELL</span>
            </button>
          </div>

          {/* Desktop Push Notifications */}
          <div className="flex items-center gap-2">
            {notifPermission === 'granted' ? (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Notifikasi Desktop Aktif</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestNotif}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Aktifkan Notifikasi Desktop</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Header for History */}
        <div className="px-4 py-2.5 bg-slate-900 flex items-center justify-between border-b border-slate-800 text-xs">
          <span className="font-semibold text-slate-400">
            Daftar Sinyal Fresh Terbaru ({alerts.length})
          </span>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai Semua Dibaca</span>
              </button>
            )}

            {alerts.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline font-medium ml-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Riwayat</span>
              </button>
            )}
          </div>
        </div>

        {/* Alert Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-800/50">
          {alerts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-300 mb-1">
                Belum Ada Alert Sinyal Fresh
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Sistem sedang memantau lilin acuan 8-9 AM, sweep likuiditas Turtle Soup, dan pergeseran struktur 5M MSS secara real-time.
              </p>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTestChime('BUY')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold"
                >
                  Simulasikan Fresh BUY Alert
                </button>
                <button
                  type="button"
                  onClick={() => handleTestChime('SELL')}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold"
                >
                  Simulasikan Fresh SELL Alert
                </button>
              </div>
            </div>
          ) : (
            alerts.map((alert) => {
              const isBuy = alert.type === 'BUY';
              return (
                <div
                  key={alert.id}
                  className={`pt-3 first:pt-0 p-3 rounded-xl transition-colors ${
                    !alert.read ? 'bg-slate-800/40 border border-slate-700/60' : 'hover:bg-slate-800/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`p-1.5 rounded-lg font-black text-xs ${
                          isBuy
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {isBuy ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-white text-sm">
                            {alert.symbol}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                              isBuy ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            FRESH {alert.type}
                          </span>
                          {!alert.read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-slate-500" />
                          {alert.timeFormatted} • Sumber: {alert.source === 'MULTICHART' ? 'Multi-Chart 5M' : 'Multi-Pair Scanner'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenChart(alert.symbol);
                        onClose();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                        isBuy
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                          : 'bg-rose-600 hover:bg-rose-500 text-slate-950'
                      }`}
                    >
                      <span>Buka Chart</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 mb-2 font-medium">
                    {alert.changeDescription}
                  </p>

                  <div className="grid grid-cols-4 gap-2 text-center bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">ENTRY FVG</span>
                      <span className="font-mono text-xs font-bold text-sky-400">
                        ${formatPrice(alert.entryPrice)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-rose-400 font-bold uppercase">STOP LOSS</span>
                      <span className="font-mono text-xs font-bold text-rose-300">
                        ${formatPrice(alert.stopLoss)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-emerald-400 font-bold uppercase">TP1 (50% EQ)</span>
                      <span className="font-mono text-xs font-bold text-emerald-300">
                        ${formatPrice(alert.takeProfit1)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-emerald-400 font-bold uppercase">TP2 (DOL)</span>
                      <span className="font-mono text-xs font-black text-emerald-400">
                        ${formatPrice(alert.takeProfit2)}
                      </span>
                    </div>
                  </div>

                  {/* Key Level Zone display if available */}
                  {alert.keyLevelZone && (
                    <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-sky-950/50 border border-sky-500/30 flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono">
                      <span className="text-sky-300 font-bold flex items-center gap-1">
                        <Target className="w-3 h-3 text-sky-400" />
                        <span>Key Level: ${formatPrice(alert.keyLevelZone.low)} - ${formatPrice(alert.keyLevelZone.high)}</span>
                      </span>
                      <span className="text-amber-300 font-bold">
                        ★ Sweet Spot: ${formatPrice(alert.keyLevelZone.sweetSpot)} ({alert.keyLevelZone.precisionScore}%)
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Model ICT x CRT: Deteksi Otomatis &amp; Real-Time</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
