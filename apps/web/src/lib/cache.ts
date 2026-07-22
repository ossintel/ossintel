import { type IDBPDatabase, openDB } from "idb";

export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  lastAccessed: number;
  size: number;
  version: number;
  expiresAt: number; // Kept for compatibility
}

export interface CacheSettings {
  quotaMb: number; // default: 100 MB
  staleDays: number; // default: 7 days
}

const DB_NAME = "ossintel-db";
const STORE_NAME = "cache";
const DB_VERSION = 3;

const DEFAULT_SETTINGS: CacheSettings = {
  quotaMb: 100,
  staleDays: 7,
};

export const getCacheSettings = (): CacheSettings => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const quota = localStorage.getItem("ossintel:settings:cache-quota");
    const stale = localStorage.getItem("ossintel:settings:stale-time");
    return {
      quotaMb: quota ? parseInt(quota, 10) : 100,
      staleDays: stale ? parseInt(stale, 10) : 7,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveCacheSettings = (settings: CacheSettings): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      "ossintel:settings:cache-quota",
      settings.quotaMb.toString(),
    );
    localStorage.setItem(
      "ossintel:settings:stale-time",
      settings.staleDays.toString(),
    );
  } catch (e) {
    console.warn("Failed to save cache settings", e);
  }
};

let dbPromise: Promise<IDBPDatabase<unknown>> | undefined;

const getDB = (): Promise<IDBPDatabase<unknown>> => {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser");
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
};

let writeCounter = 0;
const CLEANUP_THRESHOLD = 15;

const cleanExpiredEntriesOpportunistically = (): void => {
  writeCounter++;
  if (writeCounter >= CLEANUP_THRESHOLD) {
    writeCounter = 0;
    cleanExpiredEntries().catch((e) =>
      console.warn("Opportunistic IndexedDB cache cleanup failed", e),
    );
  }
};

const estimateSize = (val: unknown): number => {
  try {
    return JSON.stringify(val).length * 2; // UTF-16 characters are 2 bytes each
  } catch {
    return 0;
  }
};

const evictToQuota = async (
  db: IDBPDatabase<unknown>,
  limitBytes: number,
): Promise<void> => {
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const entries = (await store.getAll()) as CacheEntry<unknown>[];

  let totalSize = entries.reduce((acc, entry) => acc + (entry.size || 0), 0);
  if (totalSize <= limitBytes) return;

  // Sort by lastAccessed ascending (oldest first)
  entries.sort((a, b) => a.lastAccessed - b.lastAccessed);

  for (const entry of entries) {
    if (totalSize <= limitBytes) break;
    await store.delete(entry.key);
    totalSize -= entry.size || 0;
  }
  await tx.done;
};

export const getCacheItem = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await getDB();
    const result = (await db.get(STORE_NAME, key)) as CacheEntry<T> | undefined;
    if (!result) return null;

    const settings = getCacheSettings();
    if (
      Date.now() - result.timestamp >
      settings.staleDays * 24 * 60 * 60 * 1000
    ) {
      await db.delete(STORE_NAME, key);
      return null;
    }

    // Update lastAccessed for LRU
    result.lastAccessed = Date.now();
    await db.put(STORE_NAME, result);

    return result.data;
  } catch (e) {
    console.warn("IndexedDB cache get error for key:", key, e);
    return null;
  }
};

export const getCacheTimestamp = async (
  key: string,
): Promise<number | null> => {
  try {
    const db = await getDB();
    const result = (await db.get(STORE_NAME, key)) as
      | CacheEntry<unknown>
      | undefined;
    return result?.timestamp ?? null;
  } catch (e) {
    console.warn("IndexedDB timestamp fetch error:", e);
    return null;
  }
};

export const setCacheItem = async <T>(key: string, data: T): Promise<void> => {
  try {
    const db = await getDB();
    const now = Date.now();
    const settings = getCacheSettings();
    const size = estimateSize(data);

    // Evict items if adding this new item exceeds limit
    const quotaBytes = settings.quotaMb * 1024 * 1024;
    await evictToQuota(db, quotaBytes - size);

    const expiresAt = now + settings.staleDays * 24 * 60 * 60 * 1000;
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: now,
      lastAccessed: now,
      size,
      version: DB_VERSION,
      expiresAt,
    };
    await db.put(STORE_NAME, entry);
    cleanExpiredEntriesOpportunistically();
  } catch (e) {
    console.warn("IndexedDB cache set failed for key:", key, e);
  }
};

export const deleteCacheItem = async (key: string): Promise<void> => {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, key);
  } catch (e) {
    console.warn("IndexedDB cache delete failed for key:", key, e);
  }
};

// --- Batch Operations ---

export const getMany = async <T>(
  keys: string[],
): Promise<Record<string, T>> => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const results: Record<string, T> = {};
    const now = Date.now();
    const settings = getCacheSettings();

    await Promise.all(
      keys.map(async (key) => {
        const entry = (await store.get(key)) as CacheEntry<T> | undefined;
        if (entry) {
          if (
            now - entry.timestamp >
            settings.staleDays * 24 * 60 * 60 * 1000
          ) {
            await store.delete(key);
          } else {
            results[key] = entry.data;
            entry.lastAccessed = now;
            await store.put(entry);
          }
        }
      }),
    );
    await tx.done;
    return results;
  } catch (e) {
    console.warn("IndexedDB batch get failed", e);
    return {};
  }
};

export const putMany = async (
  entries: { key: string; data: unknown }[],
): Promise<void> => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const now = Date.now();
    const settings = getCacheSettings();
    const expiresAt = now + settings.staleDays * 24 * 60 * 60 * 1000;

    let incomingSize = 0;
    for (const { data } of entries) {
      incomingSize += estimateSize(data);
    }

    const quotaBytes = settings.quotaMb * 1024 * 1024;
    await evictToQuota(db, quotaBytes - incomingSize);

    for (const { key, data } of entries) {
      const size = estimateSize(data);
      const entry: CacheEntry<unknown> = {
        key,
        data,
        timestamp: now,
        lastAccessed: now,
        size,
        version: DB_VERSION,
        expiresAt,
      };
      await store.put(entry);
    }
    await tx.done;
    cleanExpiredEntriesOpportunistically();
  } catch (e) {
    console.warn("IndexedDB batch put failed", e);
  }
};

export const deleteMany = async (keys: string[]): Promise<void> => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    for (const key of keys) {
      await store.delete(key);
    }
    await tx.done;
  } catch (e) {
    console.warn("IndexedDB batch delete failed", e);
  }
};

// --- Maintenance / Cleanup APIs ---

export const clearCache = async (): Promise<void> => {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
  } catch (e) {
    console.warn("IndexedDB clearCache failed", e);
  }
};

export const cleanExpiredEntries = async (): Promise<void> => {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const now = Date.now();
    const settings = getCacheSettings();

    let cursor = await store.openCursor();
    while (cursor) {
      const entry = cursor.value as CacheEntry<unknown>;
      if (now - entry.timestamp > settings.staleDays * 24 * 60 * 60 * 1000) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }
    await tx.done;
  } catch (e) {
    console.warn("IndexedDB cleanExpiredEntries failed", e);
  }
};
