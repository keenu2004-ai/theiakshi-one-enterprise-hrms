// IndexedDB Storage Layer for THEIAKSHI HRMS
// Provides offline persistence for Auth, Employees, Attendance, Leaves, Payroll, and Sync Queue.

const DB_NAME = 'THEIAKSHI_HRMS_IDB';
const DB_VERSION = 1;

export const STORES = {
  AUTH_SESSION: 'auth_session',
  EMPLOYEES: 'employees',
  ATTENDANCE: 'attendance',
  LEAVES: 'leaves',
  PAYROLL: 'payroll',
  SYNC_QUEUE: 'sync_queue',
} as const;

export type StoreName = typeof STORES[keyof typeof STORES];

export interface SyncQueueItem {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body: any;
  headers?: Record<string, string>;
  module: string;
  description: string;
  timestamp: string;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  retryCount: number;
  errorMessage?: string;
}

let dbInstance: IDBDatabase | null = null;

export function openHRMSDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      return resolve(dbInstance);
    }

    if (!('indexedDB' in window)) {
      return reject(new Error('IndexedDB is not supported in this browser environment.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.AUTH_SESSION)) {
        db.createObjectStore(STORES.AUTH_SESSION, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.EMPLOYEES)) {
        db.createObjectStore(STORES.EMPLOYEES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.ATTENDANCE)) {
        db.createObjectStore(STORES.ATTENDANCE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.LEAVES)) {
        db.createObjectStore(STORES.LEAVES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.PAYROLL)) {
        db.createObjectStore(STORES.PAYROLL, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
        syncStore.createIndex('status', 'status', { unique: false });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('Failed to open IndexedDB:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// Generic IndexedDB Helper CRUD
export async function getRecord<T>(storeName: StoreName, id: string): Promise<T | null> {
  try {
    const db = await openHRMSDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);

      req.onsuccess = () => resolve((req.result as T) || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.error(`IDB Read Error [${storeName}]:`, err);
    return null;
  }
}

export async function getAllRecords<T>(storeName: StoreName): Promise<T[]> {
  try {
    const db = await openHRMSDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.error(`IDB Read All Error [${storeName}]:`, err);
    return [];
  }
}

export async function putRecord<T extends { id: string }>(storeName: StoreName, data: T): Promise<boolean> {
  try {
    const db = await openHRMSDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(data);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error(`IDB Put Error [${storeName}]:`, err);
    return false;
  }
}

export async function putRecords<T extends { id: string }>(storeName: StoreName, items: T[]): Promise<boolean> {
  if (!items || items.length === 0) return true;
  try {
    const db = await openHRMSDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      items.forEach((item) => store.put(item));

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error(`IDB Put Batch Error [${storeName}]:`, err);
    return false;
  }
}

export async function deleteRecord(storeName: StoreName, id: string): Promise<boolean> {
  try {
    const db = await openHRMSDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error(`IDB Delete Error [${storeName}]:`, err);
    return false;
  }
}

export async function clearStore(storeName: StoreName): Promise<boolean> {
  try {
    const db = await openHRMSDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error(`IDB Clear Error [${storeName}]:`, err);
    return false;
  }
}

// Sync Queue specific operations
export async function queueOfflineAction(action: Omit<SyncQueueItem, 'id' | 'status' | 'retryCount' | 'timestamp'>): Promise<SyncQueueItem> {
  const item: SyncQueueItem = {
    ...action,
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    status: 'PENDING',
    retryCount: 0,
  };

  await putRecord(STORES.SYNC_QUEUE, item);
  return item;
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const items = await getAllRecords<SyncQueueItem>(STORES.SYNC_QUEUE);
  return items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export async function removeSyncQueueItem(id: string): Promise<boolean> {
  return deleteRecord(STORES.SYNC_QUEUE, id);
}

export async function updateSyncQueueItem(item: SyncQueueItem): Promise<boolean> {
  return putRecord(STORES.SYNC_QUEUE, item);
}
