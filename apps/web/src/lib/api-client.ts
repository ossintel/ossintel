import { deleteCacheItem, getCacheItem, setCacheItem } from "@/lib/cache";

export const fetchWithCache = async <T>(
  cacheKey: string,
  endpoint: string,
  payload: Record<string, unknown>,
  forceRefresh = false,
): Promise<T> => {
  if (!forceRefresh) {
    const cached = await getCacheItem<T>(cacheKey);
    if (cached && typeof cached === "object") {
      const isProfile =
        "type" in cached &&
        ((cached as { type: string }).type === "user" ||
          (cached as { type: string }).type === "org");
      const hasAppInstalledField = "isAppInstalled" in cached;
      // Stale browser cache entry validation (pre-GitHub App version)
      if (!isProfile || hasAppInstalledField) {
        return cached;
      }
    }
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ ...payload, forceRefresh }),
  });
  const data = await res.json();
  if (!res.ok) {
    const message = data.message || data.error || "Request failed";
    const errorObj = new Error(message);
    if (
      data.error === "rate_limit" ||
      message.includes("Rate Limit Exceeded")
    ) {
      (errorObj as { isRateLimit?: boolean; resetTime?: string }).isRateLimit =
        true;
      (errorObj as { isRateLimit?: boolean; resetTime?: string }).resetTime =
        data.resetTime;
    }
    throw errorObj;
  }
  await setCacheItem(cacheKey, data);
  return data;
};

export const clearCacheItem = async (cacheKey: string) => {
  await deleteCacheItem(cacheKey);
};
