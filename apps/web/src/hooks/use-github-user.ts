import type {
  LinkedIdentitySuggestions,
  NormalizedContribution,
  NormalizedDeveloper,
  NormalizedOrganization,
  NormalizedRepository,
} from "@ossintel/github-normalizer";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchWithCache } from "@/lib/api-client";

export interface UserResponse {
  type: "user" | "org";
  metadata: NormalizedDeveloper & {
    organizations: NormalizedOrganization[];
    suggestions: LinkedIdentitySuggestions;
    readme: string;
  };
  repositories: NormalizedRepository[];
  externalContributions: NormalizedContribution[];
  cachedAt?: number;
  pinnedRepositories?: string[];
}

export const useGithubUser = (username: string, limit = 10) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const query = useQuery({
    queryKey: ["user", username?.toLowerCase(), limit],
    queryFn: async () => {
      try {
        const data = await fetchWithCache<UserResponse>(
          `user:${username.toLowerCase()}:${limit}`,
          "/api/github/user",
          {
            query: username,
            limit,
          },
          isRefreshing,
        );
        return data;
      } finally {
        setIsRefreshing(false);
      }
    },
    enabled: !!username,
    retry: false,
  });

  const refresh = async () => {
    setIsRefreshing(true);
    await query.refetch();
  };

  return { ...query, refresh };
};
