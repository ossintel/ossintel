import { deleteCacheItem, getCacheItem, setCacheItem } from "@/lib/cache";

export async function fetchWithCache<T>(
  cacheKey: string,
  endpoint: string,
  payload: Record<string, unknown>,
  ttlSeconds = 60,
): Promise<T> {
  const cached = await getCacheItem<T>(cacheKey);
  if (cached) return cached;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  await setCacheItem(cacheKey, data, ttlSeconds);
  return data;
}

export async function saveSecureToken(
  token: string,
  type: "github" | "stackoverflow",
): Promise<void> {
  if (typeof window !== "undefined") {
    if (token) {
      await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ token, type }),
      });
    } else {
      await fetch(`/api/auth/token?type=${type}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
    }
  }
}

export async function savePatCookie(token: string): Promise<void> {
  await saveSecureToken(token, "github");
}

export async function clearCacheItem(cacheKey: string) {
  await deleteCacheItem(cacheKey);
}
