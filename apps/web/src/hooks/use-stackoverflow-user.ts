import type { NormalizedStackOverflowUser } from "@ossintel/stackoverflow";
import { useQuery } from "@tanstack/react-query";
import { clearCacheItem, fetchWithCache } from "@/lib/api-client";

export const useStackOverflowUser = (userId: string) => {
  const cleanId = userId?.trim();

  const query = useQuery({
    queryKey: ["stackoverflow-user", cleanId],
    queryFn: () =>
      fetchWithCache<NormalizedStackOverflowUser>(
        `stackoverflow-user:${cleanId}`,
        "/api/stackoverflow/user",
        {
          query: cleanId,
        },
      ),
    enabled: !!cleanId,
    retry: false,
  });

  const refresh = async () => {
    if (!cleanId) return;
    const cacheKey = `stackoverflow-user:${cleanId}`;
    await clearCacheItem(cacheKey);
    await query.refetch();
  };

  return { ...query, refresh };
};
