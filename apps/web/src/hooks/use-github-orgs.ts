"use client";

import type {
  NormalizedContributor,
  NormalizedLanguage,
  NormalizedRelease,
  NormalizedRepository,
} from "@ossintel/github-normalizer";
import type {
  Finding,
  PromptContext,
  Recommendation,
} from "@ossintel/insights";
import { generateInsights } from "@ossintel/insights";
import type { RepositoryScores } from "@ossintel/scoring";
import { calculateRepositoryScore } from "@ossintel/scoring";
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
      fetchWithCache<OrgResponse>(
        `org:${orgName.toLowerCase()}`,
        "/api/github/org",
        {
          query: orgName,
        },
      ),
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
        fetchWithCache<OrgResponse>(
          `org:${orgName.toLowerCase()}`,
          "/api/github/org",
          {
            query: orgName,
          },
        ),
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

export interface RepoRawResponse {
  repository: NormalizedRepository;
  contributors: NormalizedContributor[];
  releases: NormalizedRelease[];
  languages: NormalizedLanguage[];
}

export const useGithubRepo = (owner: string, repo: string) => {
  const query = useQuery({
    queryKey: ["repo", owner?.toLowerCase(), repo?.toLowerCase()],
    queryFn: async () => {
      const raw = await fetchWithCache<RepoRawResponse>(
        `repo:${owner.toLowerCase()}:${repo.toLowerCase()}`,
        "/api/github/repo",
        { owner, repo },
      );
      const scores = calculateRepositoryScore({ repository: raw.repository });
      const insightsResult = generateInsights(
        {
          repository: raw.repository,
          releases: raw.releases,
          contributors: raw.contributors,
          languages: raw.languages,
        },
        scores,
      );
      return {
        type: "repo" as const,
        metadata: raw.repository,
        scores,
        findings: insightsResult.findings,
        recommendations: insightsResult.recommendations,
        promptContext: insightsResult.promptContext,
        languages: raw.languages,
        contributorsCount: raw.contributors.length,
      };
    },
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
