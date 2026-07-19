"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { deleteCacheItem, getCacheItem, setCacheItem } from "@/lib/cache";

export const useGithubOrg = (orgName: string) => {
  const query = useQuery({
    queryKey: ["org", orgName?.toLowerCase()],
    queryFn: async () => {
      const cacheKey = `org:${orgName.toLowerCase()}`;
      const cached = await getCacheItem<unknown>(cacheKey);
      if (cached) return cached;

      const token = sessionStorage.getItem("github_token") || "";
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "org", query: orgName, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch org");
      }
      await setCacheItem(cacheKey, data, 60);
      return data;
    },
    enabled: !!orgName,
    retry: false,
  });

  const refresh = async () => {
    const cacheKey = `org:${orgName.toLowerCase()}`;
    await deleteCacheItem(cacheKey);
    await query.refetch();
  };

  return { ...query, refresh };
};

export const useGithubOrgs = (orgNames: string[]) => {
  const queries = useQueries({
    queries: orgNames.map((orgName) => ({
      queryKey: ["org", orgName.toLowerCase()],
      queryFn: async () => {
        const cacheKey = `org:${orgName.toLowerCase()}`;
        const cached = await getCacheItem<unknown>(cacheKey);
        if (cached) return cached;

        const token = sessionStorage.getItem("github_token") || "";
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "org", query: orgName, token }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Failed to fetch org ${orgName}`);
        }
        await setCacheItem(cacheKey, data, 60);
        return data;
      },
      enabled: !!orgName,
      retry: false,
    })),
  });

  const refreshAll = async () => {
    const refetchPromises = orgNames.map(async (orgName) => {
      const cacheKey = `org:${orgName.toLowerCase()}`;
      await deleteCacheItem(cacheKey);
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
    queryFn: async () => {
      const cacheKey = `repo:${owner.toLowerCase()}:${repo.toLowerCase()}`;
      const cached = await getCacheItem<unknown>(cacheKey);
      if (cached) return cached;

      const token = sessionStorage.getItem("github_token") || "";
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "repo", owner, repo, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch repo");
      }
      await setCacheItem(cacheKey, data, 60);
      return data;
    },
    enabled: !!owner && !!repo,
    retry: false,
  });

  const refresh = async () => {
    const cacheKey = `repo:${owner.toLowerCase()}:${repo.toLowerCase()}`;
    await deleteCacheItem(cacheKey);
    await query.refetch();
  };

  return { ...query, refresh };
};
