"use client";

import type {
  NormalizedLanguage,
  NormalizedRepository,
} from "@ossintel/github-normalizer";
import type {
  Finding,
  PromptContext,
  Recommendation,
} from "@ossintel/insights";
import type { RepositoryScores } from "@ossintel/scoring";
import { useQueries, useQuery } from "@tanstack/react-query";
import { clearCacheItem, fetchWithCache } from "@/lib/api-client";

export interface OrgResponse {
  type: "org";
  metadata: {
    login: string;
    name: string | null;
    avatarUrl: string;
    htmlUrl: string;
    location: string | null;
    email: string | null;
    blog: string | null;
    publicRepos: number;
    followers: number;
    description: string | null;
  };
  repositories: NormalizedRepository[];
}

export interface RepoResponse {
  type: "repo";
  metadata: NormalizedRepository;
  scores: RepositoryScores;
  findings: Finding[];
  recommendations: Recommendation[];
  promptContext: PromptContext;
  languages: NormalizedLanguage[];
  contributorsCount: number;
}

export const useGithubOrg = (orgName: string) => {
  const query = useQuery({
    queryKey: ["org", orgName?.toLowerCase()],
    queryFn: () =>
      fetchWithCache<OrgResponse>(`org:${orgName.toLowerCase()}`, {
        type: "org",
        query: orgName,
      }),
    enabled: !!orgName,
    retry: false,
  });

  const refresh = async () => {
    const cacheKey = `org:${orgName.toLowerCase()}`;
    await clearCacheItem(cacheKey);
    await query.refetch();
  };

  return { ...query, refresh };
};

export const useGithubOrgs = (orgNames: string[]) => {
  const queries = useQueries({
    queries: orgNames.map((orgName) => ({
      queryKey: ["org", orgName.toLowerCase()],
      queryFn: () =>
        fetchWithCache<OrgResponse>(`org:${orgName.toLowerCase()}`, {
          type: "org",
          query: orgName,
        }),
      enabled: !!orgName,
      retry: false,
    })),
  });

  const refreshAll = async () => {
    const refetchPromises = orgNames.map(async (orgName) => {
      const cacheKey = `org:${orgName.toLowerCase()}`;
      await clearCacheItem(cacheKey);
    });
    await Promise.all(refetchPromises);

    // Invalidate/refetch all queries
    const queriesRefetch = queries.map((q) => q.refetch());
    await Promise.all(queriesRefetch);
  };

  return {
    queries,
    isLoading: queries.some((q) => q.isLoading),
    isFetching: queries.some((q) => q.isFetching),
    error: queries.find((q) => q.error)?.error || null,
    refreshAll,
  };
};

export const useGithubRepo = (owner: string, repo: string) => {
  const query = useQuery({
    queryKey: ["repo", owner?.toLowerCase(), repo?.toLowerCase()],
    queryFn: () =>
      fetchWithCache<RepoResponse>(
        `repo:${owner.toLowerCase()}:${repo.toLowerCase()}`,
        { type: "repo", owner, repo },
      ),
    enabled: !!owner && !!repo,
    retry: false,
  });

  const refresh = async () => {
    const cacheKey = `repo:${owner.toLowerCase()}:${repo.toLowerCase()}`;
    await clearCacheItem(cacheKey);
    await query.refetch();
  };

  return { ...query, refresh };
};
