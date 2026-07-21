import { deleteCacheItem, getCacheItem, setCacheItem } from "@/lib/cache";

export async function fetchWithCache<T>(
  cacheKey: string,
  payload: Record<string, unknown>,
  ttlSeconds = 60,
): Promise<T> {
  const cached = await getCacheItem<T>(cacheKey);
  if (cached) return cached;

  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("github_token") || ""
      : "";
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, token }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  await setCacheItem(cacheKey, data, ttlSeconds);
  return data;
}

export async function clearCacheItem(cacheKey: string) {
  await deleteCacheItem(cacheKey);
}
