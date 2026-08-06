// Offline Sync Service using IndexedDB
import {
  STORES,
  StoreName,
  SyncQueueItem,
  getRecord,
  getAllRecords,
  putRecord,
  putRecords,
  queueOfflineAction,
  getSyncQueue,
  removeSyncQueueItem,
  updateSyncQueueItem,
} from '../lib/idb';

type SyncListener = (pendingCount: number, isSyncing: boolean, lastSyncResult?: { synced: number; failed: number }) => void;

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://final-32yd.onrender.com";

const resolveApiUrl = (url: string): string => {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${API_BASE}${url}`;
};

class OfflineSyncService {
  private isOnlineStatus: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private listeners: Set<SyncListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleConnectivityChange(true));
      window.addEventListener('offline', () => this.handleConnectivityChange(false));
      // Auto attempt sync on initialization if online
      setTimeout(() => {
        if (this.isOnlineStatus) {
          this.processSyncQueue();
        }
      }, 3000);
    }
  }

  public isOnline(): boolean {
    return this.isOnlineStatus;
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.notifyListeners();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async notifyListeners(lastResult?: { synced: number; failed: number }) {
    const pending = await getSyncQueue();
    this.listeners.forEach((listener) => {
      listener(pending.length, this.isSyncing, lastResult);
    });
  }

  private handleConnectivityChange(online: boolean) {
    this.isOnlineStatus = online;
    console.log(`[OfflineSyncService] Network status changed: ${online ? 'ONLINE' : 'OFFLINE'}`);
    this.notifyListeners();

    if (online) {
      this.processSyncQueue();
    }
  }

  // Synchronize queued offline mutations with backend
  public async processSyncQueue(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || !this.isOnlineStatus) {
      const queue = await getSyncQueue();
      return { synced: 0, failed: queue.length };
    }

    this.isSyncing = true;
    this.notifyListeners();

    const queue = await getSyncQueue();
    let synced = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        item.status = 'SYNCING';
        await updateSyncQueueItem(item);

        const targetUrl = resolveApiUrl(item.url);
        const response = await fetch(targetUrl, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            ...(item.headers || {}),
          },
          body: item.body ? JSON.stringify(item.body) : undefined,
        });

        if (response.ok || response.status === 201 || response.status === 200) {
          await removeSyncQueueItem(item.id);
          synced++;
        } else {
          item.status = 'FAILED';
          item.retryCount += 1;
          item.errorMessage = `Server returned status ${response.status}`;
          await updateSyncQueueItem(item);
          failed++;
        }
      } catch (err: any) {
        item.status = 'FAILED';
        item.retryCount += 1;
        item.errorMessage = err?.message || 'Network fetch failed during sync';
        await updateSyncQueueItem(item);
        failed++;
      }
    }

    this.isSyncing = false;
    this.notifyListeners({ synced, failed });
    return { synced, failed };
  }

  // Wrapper for API calls with IndexedDB caching and offline mutation queueing
  public async apiFetch<T>(
    url: string,
    options: RequestInit = {},
    cacheConfig?: {
      store: StoreName;
      key?: string; // If key specified, stores single item; else array
      description?: string;
      module?: string;
    }
  ): Promise<{ data: T | null; fromOffline: boolean; queued: boolean; error?: string }> {
    const method = (options.method || 'GET').toUpperCase();
    const targetUrl = resolveApiUrl(url);

    // Attach Auth token automatically if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('theiakshi_auth_token') : null;
    const requestHeaders: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };
    const reqOptions = { ...options, headers: requestHeaders };

    // GET Request Flow
    if (method === 'GET') {
      try {
        const response = await fetch(targetUrl, reqOptions);
        if (response.ok) {
          const rawData = await response.json();
          const data = (rawData && typeof rawData === 'object' && 'data' in rawData && rawData.data !== undefined)
            ? rawData.data
            : rawData;

          // Cache response in IndexedDB
          if (cacheConfig?.store) {
            if (cacheConfig.key) {
              await putRecord(cacheConfig.store, { ...data, id: cacheConfig.key });
            } else if (Array.isArray(data)) {
              await putRecords(cacheConfig.store, data);
            }
          }

          return { data, fromOffline: false, queued: false };
        }
      } catch (err) {
        console.warn(`[OfflineSyncService] GET ${url} failed. Attempting IndexedDB fallback...`, err);
      }

      // Offline / Network Failure Fallback
      if (cacheConfig?.store) {
        if (cacheConfig.key) {
          const cached = await getRecord<T>(cacheConfig.store, cacheConfig.key);
          if (cached) return { data: cached, fromOffline: true, queued: false };
        } else {
          const cachedList = await getAllRecords<any>(cacheConfig.store);
          if (cachedList && cachedList.length > 0) {
            return { data: cachedList as unknown as T, fromOffline: true, queued: false };
          }
        }
      }

      return { data: null, fromOffline: true, queued: false, error: 'Network unavailable and no cached data in IndexedDB.' };
    }

    // Mutation Request Flow (POST, PUT, DELETE)
    if (!this.isOnlineStatus) {
      // Offline mutation -> queue into IndexedDB
      const body = options.body ? JSON.parse(options.body as string) : {};
      await queueOfflineAction({
        url,
        method: method as any,
        body,
        module: cacheConfig?.module || 'General',
        description: cacheConfig?.description || `${method} request to ${url}`,
      });

      this.notifyListeners();

      return {
        data: body as T,
        fromOffline: true,
        queued: true,
      };
    }

    // Online mutation -> try network directly
    try {
      const response = await fetch(targetUrl, reqOptions);
      const rawData = await response.json().catch(() => ({ success: true }));
      const data = (rawData && typeof rawData === 'object' && 'data' in rawData && rawData.data !== undefined)
        ? rawData.data
        : rawData;

      if (response.ok) {
        // Also update IndexedDB cache if store specified
        if (cacheConfig?.store && data) {
          if (Array.isArray(data)) {
            await putRecords(cacheConfig.store, data);
          } else if (typeof data === 'object') {
            await putRecord(cacheConfig.store, data);
          }
        }
        return { data, fromOffline: false, queued: false };
      } else {
        return { data: null, fromOffline: false, queued: false, error: rawData?.error || rawData?.message || 'Server error' };
      }
    } catch (err: any) {
      // If network fails unexpectedly mid-request, queue mutation
      const body = options.body ? JSON.parse(options.body as string) : {};
      await queueOfflineAction({
        url,
        method: method as any,
        body,
        module: cacheConfig?.module || 'General',
        description: cacheConfig?.description || `${method} request to ${url}`,
      });

      this.notifyListeners();

      return {
        data: body as T,
        fromOffline: true,
        queued: true,
      };
    }
  }
}

export const offlineSyncService = new OfflineSyncService();
