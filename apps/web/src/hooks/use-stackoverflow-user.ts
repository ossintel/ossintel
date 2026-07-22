import type { NormalizedStackOverflowUser } from "@ossintel/stackoverflow";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchWithCache } from "@/lib/api-client";

export const useStackOverflowUser = (userId: string) => {
  const cleanId = userId?.trim();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const query = useQuery({
    queryKey: ["stackoverflow-user", cleanId],
    queryFn: async () => {
      try {
        const data = await fetchWithCache<NormalizedStackOverflowUser>(
          `stackoverflow-user:${cleanId}`,
          "/api/stackoverflow/user",
          {
            query: cleanId,
          },
          isRefreshing,
        );
        return data;
      } finally {
        setIsRefreshing(false);
      }
    },
    enabled: !!cleanId,
    retry: false,
  });

  const refresh = async () => {
    if (!cleanId) return;
    setIsRefreshing(true);
    await query.refetch();
  };

  return { ...query, refresh };
};
