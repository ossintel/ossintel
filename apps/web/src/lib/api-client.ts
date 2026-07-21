import { deleteCacheItem, getCacheItem, setCacheItem } from "@/lib/cache";

export async function fetchWithCache<T>(
  cacheKey: string,
  endpoint: string,
  payload: Record<string, unknown>,
  ttlSeconds = 60,
): Promise<T> {
  const cached = await getCacheItem<T>(cacheKey);
  if (cached) return cached;

  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("github_token") || ""
      : "";
  const res = await fetch(endpoint, {
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

export async function savePatCookie(token: string): Promise<void> {
  if (typeof window !== "undefined") {
    if (token) {
      sessionStorage.setItem("github_token", token);
      await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    } else {
      sessionStorage.removeItem("github_token");
      await fetch("/api/auth/token", {
        method: "DELETE",
      });
    }
  }
}

export async function clearCacheItem(cacheKey: string) {
  await deleteCacheItem(cacheKey);
}
