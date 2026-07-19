import { openDB } from "idb";

export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
}

const DB_NAME = "ossintel-db";
const STORE_NAME = "analyses";
const DB_VERSION = 1;

const getDB = async () => {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser");
  }
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    },
  });
};

export const getCacheItem = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await getDB();
    const result = (await db.get(STORE_NAME, key)) as CacheEntry<T> | undefined;
    if (!result) return null;
    if (Date.now() > result.expiresAt) {
      await db.delete(STORE_NAME, key);
      return null;
    }
    return result.data;
  } catch (e) {
    console.error("IndexedDB cache get error for key:", key, e);
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
    console.error("IndexedDB timestamp fetch error:", e);
    return null;
  }
};

export const setCacheItem = async <T>(
  key: string,
  data: T,
  ttlMinutes = 60,
): Promise<void> => {
  try {
    const db = await getDB();
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt,
    };
    await db.put(STORE_NAME, entry);
  } catch (e) {
    console.error("IndexedDB cache set failed for key:", key, e);
  }
};

export const deleteCacheItem = async (key: string): Promise<void> => {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, key);
  } catch (e) {
    console.error("IndexedDB cache delete failed for key:", key, e);
  }
};
