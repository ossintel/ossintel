import { useQuery } from "@tanstack/react-query";
import { deleteCacheItem, getCacheItem, setCacheItem } from "@/lib/cache";

export const useGithubUser = (username: string) => {
  const query = useQuery({
    queryKey: ["user", username?.toLowerCase()],
    queryFn: async () => {
      const cacheKey = `user:${username.toLowerCase()}`;
      const cached = await getCacheItem<unknown>(cacheKey);
      if (cached) return cached;

      const token = sessionStorage.getItem("github_token") || "";
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "user", query: username, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch user");
      }
      await setCacheItem(cacheKey, data, 60);
      return data;
    },
    enabled: !!username,
    retry: false,
  });

  const refresh = async () => {
    const cacheKey = `user:${username.toLowerCase()}`;
    await deleteCacheItem(cacheKey);
    await query.refetch();
  };

  return { ...query, refresh };
};
