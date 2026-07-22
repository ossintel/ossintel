import type { NormalizedNpmUser } from "@ossintel/npm";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchWithCache } from "@/lib/api-client";

export const useNpmUser = (username: string) => {
  const cleanUsername = username?.trim();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const query = useQuery({
    queryKey: ["npm-user", cleanUsername?.toLowerCase()],
    queryFn: async () => {
      try {
        const data = await fetchWithCache<NormalizedNpmUser>(
          `npm-user:${cleanUsername.toLowerCase()}`,
          "/api/npm/user",
          {
            query: cleanUsername,
          },
          isRefreshing,
        );
        return data;
      } finally {
        setIsRefreshing(false);
      }
    },
    enabled: !!cleanUsername,
    retry: false,
  });

  const refresh = async () => {
    if (!cleanUsername) return;
    setIsRefreshing(true);
    await query.refetch();
  };

  return { ...query, refresh };
};
