import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Database, CheckCircle2, AlertCircle, ArrowUpRight, X, Clock } from 'lucide-react';
import { offlineSyncService } from '../../services/offlineSync';
import { getSyncQueue, SyncQueueItem } from '../../lib/idb';
import { useNotification } from '../../context/NotificationContext';

export const OfflineSyncStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(offlineSyncService.isOnline());
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showQueueModal, setShowQueueModal] = useState<boolean>(false);
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
  const { showToast } = useNotification();

  const reloadQueue = async () => {
    const items = await getSyncQueue();
    setQueueItems(items);
    setPendingCount(items.length);
  };

  useEffect(() => {
    setIsOnline(offlineSyncService.isOnline());
    reloadQueue();

    const unsubscribe = offlineSyncService.subscribe((count, syncing, lastResult) => {
      setPendingCount(count);
      setIsSyncing(syncing);
      setIsOnline(offlineSyncService.isOnline());
      reloadQueue();

      if (lastResult && lastResult.synced > 0) {
        showToast(
          'Offline Data Synchronized',
          `Successfully synchronized ${lastResult.synced} offline mutation(s) with server.`,
          'SUCCESS'
        );
      }
    });

    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const handleTriggerSync = async () => {
    if (!navigator.onLine) {
      showToast('Offline Mode Active', 'Cannot synchronize while offline. Please connect to internet.', 'WARNING');
      return;
    }

    setIsSyncing(true);
    const result = await offlineSyncService.processSyncQueue();
    setIsSyncing(false);
    reloadQueue();

    if (result.synced > 0) {
      showToast('Sync Complete', `Synchronized ${result.synced} items from IndexedDB sync queue.`, 'SUCCESS');
    } else if (result.failed > 0) {
      showToast('Sync Warning', `${result.failed} items failed to sync. Check sync queue for details.`, 'ERROR');
    } else {
      showToast('Already Up-To-Date', 'No pending offline queue items in IndexedDB.', 'INFO');
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Offline / Online Status Badge */}
        <button
          onClick={() => setShowQueueModal(true)}
          className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border ${
            !isOnline
              ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300'
              : pendingCount > 0
              ? 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-300'
              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300'
          }`}
          title="Click to view IndexedDB Offline Sync Queue"
        >
          {!isOnline ? (
            <>
              <WifiOff className="h-3.5 w-3.5 text-amber-500 animate-pulse shrink-0" />
              <span className="hidden md:inline">Offline Mode (IndexedDB Active)</span>
              <span className="md:hidden">Offline</span>
            </>
          ) : (
            <>
              <Wifi className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="hidden md:inline">Online (IDB Synced)</span>
              <span className="md:hidden">Online</span>
            </>
          )}

          {pendingCount > 0 && (
            <span className="flex h-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-slate-950">
              {pendingCount}
            </span>
          )}
        </button>

        {/* Sync Now Button */}
        {pendingCount > 0 && isOnline && (
          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50"
            title="Sync pending IndexedDB items to server"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        )}
      </div>

      {/* Sync Queue Modal */}
      {showQueueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 p-6 text-white shadow-2xl border border-blue-500/30 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    IndexedDB Offline Storage & Sync Queue
                  </h3>
                  <p className="text-xs text-slate-400">
                    Stores local HRMS records and queues mutations when operating offline.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQueueModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Connectivity</div>
                <div className="mt-1 font-extrabold flex items-center gap-1.5">
                  {isOnline ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Network Connected
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <WifiOff className="h-3.5 w-3.5" /> Offline Mode Active
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Sync Items</div>
                <div className="mt-1 font-extrabold text-amber-400 text-sm">{pendingCount} actions queued</div>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">IndexedDB Database</div>
                <div className="mt-1 font-mono text-slate-300 text-[11px]">THEIAKSHI_HRMS_IDB</div>
              </div>
            </div>

            {/* Queue Items Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Queued Offline Mutations ({queueItems.length})</span>
                {isOnline && pendingCount > 0 && (
                  <button
                    onClick={handleTriggerSync}
                    disabled={isSyncing}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px]"
                  >
                    <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    Process Queue Now
                  </button>
                )}
              </div>

              {queueItems.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  No pending offline mutations in queue. All data is synchronized!
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                  {queueItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-blue-500/20 text-blue-300 px-1.5 py-0.5 font-mono text-[10px] font-bold">
                            {item.method}
                          </span>
                          <span className="font-bold text-white">{item.module}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.url}</span>
                        </div>
                        <p className="text-[11px] text-slate-300">{item.description}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            item.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : item.status === 'SYNCING'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 text-right">
              <button
                onClick={() => setShowQueueModal(false)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
