import type {
  LinkedIdentitySuggestions,
  NormalizedContribution,
  NormalizedOrganization,
  NormalizedRepository,
} from "@ossintel/github-normalizer";
import { useQuery } from "@tanstack/react-query";
import { clearCacheItem, fetchWithCache } from "@/lib/api-client";

export interface UserResponse {
  type: "user";
  metadata: {
    login: string;
    name: string | null;
    avatarUrl: string;
    htmlUrl: string;
    company: string | null;
    blog: string | null;
    location: string | null;
    bio: string | null;
    followers: number;
    following: number;
    publicRepos: number;
    createdAt: string;
    organizations: NormalizedOrganization[];
    suggestions: LinkedIdentitySuggestions;
    readme: string;
    twitterUsername?: string | null;
    email?: string | null;
  };
  repositories: NormalizedRepository[];
  externalContributions: NormalizedContribution[];
}

export const useGithubUser = (username: string, limit = 10) => {
  const query = useQuery({
    queryKey: ["user", username?.toLowerCase(), limit],
    queryFn: () =>
      fetchWithCache<UserResponse>(`user:${username.toLowerCase()}:${limit}`, {
        type: "user",
        query: username,
        limit,
      }),
    enabled: !!username,
    retry: false,
  });

  const refresh = async () => {
    const cacheKey = `user:${username.toLowerCase()}:${limit}`;
    await clearCacheItem(cacheKey);
    await query.refetch();
  };

  return { ...query, refresh };
};
