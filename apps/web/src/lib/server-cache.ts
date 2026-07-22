import {
  fetchContributors,
  fetchDeveloper,
  fetchExternalContributions,
  fetchLanguages,
  fetchOrganization,
  fetchOrganizations,
  fetchReleases,
  fetchRepositories,
  fetchRepository,
  type NormalizedContribution,
  type NormalizedContributor,
  type NormalizedLanguage,
  type NormalizedRelease,
  suggestLinkedIdentities,
} from "@ossintel/github-normalizer";
import { revalidateTag, unstable_cache } from "next/cache";
import { formatOrgResponse, formatUserResponse } from "./api-helpers";

// Cache version
const BACKEND_CACHE_VERSION = 3;

// Auto-update threshold: 7 days
const AUTO_UPDATE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

interface FetchOptions {
  token?: string;
}

// ----------------------------------------------------
// 1. DEVELOPER DATA CACHE
// ----------------------------------------------------

async function fetchDeveloperDataRaw(
  username: string,
  limit: number,
  options: FetchOptions,
) {
  const developer = await fetchDeveloper(username, options);
  const personalRepos = await fetchRepositories(username, {
    ...options,
    allPages: true,
    perPage: 100,
  });
  const organizations = await fetchOrganizations(username, options);
  let externalContributions: NormalizedContribution[] = [];
  try {
    externalContributions = await fetchExternalContributions(
      username,
      limit,
      options,
    );
  } catch (e) {
    console.error("Failed to fetch external contributions in server-cache", e);
  }

  let readme = "";
  try {
    const readmeRes = await fetch(
      `https://api.github.com/repos/${username}/${username}/readme`,
      {
        headers: options.token
          ? { Authorization: `token ${options.token}` }
          : {},
      },
    );
    if (readmeRes.ok) {
      const readmeData = await readmeRes.json();
      if (readmeData.content && readmeData.encoding === "base64") {
        readme = Buffer.from(readmeData.content, "base64").toString("utf-8");
      }
    }
  } catch (e) {
    console.error("Failed to fetch readme in server-cache", e);
  }

  const suggestions = suggestLinkedIdentities(developer, personalRepos);
  return formatUserResponse(
    developer,
    personalRepos,
    organizations,
    externalContributions,
    suggestions,
    readme,
  );
}

export async function getCachedDeveloperData(
  username: string,
  limit: number,
  options: FetchOptions,
  forceRefresh = false,
) {
  const cacheTag = `github:user:${username.toLowerCase()}`;

  const wrapped = unstable_cache(
    async () => {
      const data = await fetchDeveloperDataRaw(username, limit, options);
      return {
        data,
        fetchedAt: Date.now(),
        version: BACKEND_CACHE_VERSION,
      };
    },
    [`github-user-${username.toLowerCase()}-${limit}`],
    {
      revalidate: 365 * 24 * 60 * 60, // 365 days safety net
      tags: [cacheTag],
    },
  );

  if (forceRefresh) {
    // 1. Fetch fresh data first to verify it succeeds
    const fresh = await fetchDeveloperDataRaw(username, limit, options);
    // 2. If it succeeds, invalidate and write to cache
    revalidateTag(cacheTag, { expire: 0 });
    // Trigger write by executing the cached query
    await wrapped();
    return {
      ...fresh,
      cachedAt: Date.now(),
    };
  }

  // Read from cache
  const cached = await wrapped();
  const isStale = Date.now() - cached.fetchedAt > AUTO_UPDATE_THRESHOLD_MS;

  if (isStale) {
    // Trigger background refresh
    (async () => {
      try {
        await fetchDeveloperDataRaw(username, limit, options);
        revalidateTag(cacheTag, { expire: 0 });
        await wrapped();
      } catch (err) {
        console.error(
          `Auto-update failed for user ${username}, serving stale cache`,
          err,
        );
      }
    })();
  }

  return {
    ...cached.data,
    cachedAt: cached.fetchedAt,
  };
}

// ----------------------------------------------------
// 2. ORGANIZATION DATA CACHE
// ----------------------------------------------------

async function fetchOrganizationDataRaw(login: string, options: FetchOptions) {
  const org = await fetchOrganization(login, options);
  const repositories = await fetchRepositories(login, {
    ...options,
    allPages: true,
    perPage: 100,
  });
  return formatOrgResponse(org, repositories);
}

export async function getCachedOrganizationData(
  login: string,
  options: FetchOptions,
  forceRefresh = false,
) {
  const cacheTag = `github:org:${login.toLowerCase()}`;

  const wrapped = unstable_cache(
    async () => {
      const data = await fetchOrganizationDataRaw(login, options);
      return {
        data,
        fetchedAt: Date.now(),
        version: BACKEND_CACHE_VERSION,
      };
    },
    [`github-org-${login.toLowerCase()}`],
    {
      revalidate: 365 * 24 * 60 * 60,
      tags: [cacheTag],
    },
  );

  if (forceRefresh) {
    const fresh = await fetchOrganizationDataRaw(login, options);
    revalidateTag(cacheTag, { expire: 0 });
    await wrapped();
    return {
      ...fresh,
      cachedAt: Date.now(),
    };
  }

  const cached = await wrapped();
  const isStale = Date.now() - cached.fetchedAt > AUTO_UPDATE_THRESHOLD_MS;

  if (isStale) {
    (async () => {
      try {
        await fetchOrganizationDataRaw(login, options);
        revalidateTag(cacheTag, { expire: 0 });
        await wrapped();
      } catch (err) {
        console.error(
          `Auto-update failed for org ${login}, serving stale cache`,
          err,
        );
      }
    })();
  }

  return {
    ...cached.data,
    cachedAt: cached.fetchedAt,
  };
}

// ----------------------------------------------------
// 3. REPOSITORY DATA CACHE
// ----------------------------------------------------

async function fetchRepositoryDataRaw(
  owner: string,
  repo: string,
  options: FetchOptions,
) {
  const repository = await fetchRepository(owner, repo, options);

  let contributors: NormalizedContributor[] = [];
  try {
    contributors = await fetchContributors(owner, repo, options);
  } catch (e) {
    console.error("Failed to fetch contributors in server-cache", e);
  }

  let releases: NormalizedRelease[] = [];
  try {
    releases = await fetchReleases(owner, repo, options);
  } catch (e) {
    console.error("Failed to fetch releases in server-cache", e);
  }

  let languages: NormalizedLanguage[] = [];
  try {
    languages = await fetchLanguages(owner, repo, options);
  } catch (e) {
    console.error("Failed to fetch languages in server-cache", e);
  }

  return {
    repository,
    contributors,
    releases,
    languages,
  };
}

export async function getCachedRepositoryData(
  owner: string,
  repo: string,
  options: FetchOptions,
  forceRefresh = false,
) {
  const key = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
  const cacheTag = `github:repo:${key}`;

  const wrapped = unstable_cache(
    async () => {
      const data = await fetchRepositoryDataRaw(owner, repo, options);
      return {
        data,
        fetchedAt: Date.now(),
        version: BACKEND_CACHE_VERSION,
      };
    },
    [`github-repo-${key}`],
    {
      revalidate: 365 * 24 * 60 * 60,
      tags: [cacheTag],
    },
  );

  if (forceRefresh) {
    const fresh = await fetchRepositoryDataRaw(owner, repo, options);
    revalidateTag(cacheTag, { expire: 0 });
    await wrapped();
    return {
      ...fresh,
      cachedAt: Date.now(),
    };
  }

  const cached = await wrapped();
  const isStale = Date.now() - cached.fetchedAt > AUTO_UPDATE_THRESHOLD_MS;

  if (isStale) {
    (async () => {
      try {
        await fetchRepositoryDataRaw(owner, repo, options);
        revalidateTag(cacheTag, { expire: 0 });
        await wrapped();
      } catch (err) {
        console.error(
          `Auto-update failed for repo ${key}, serving stale cache`,
          err,
        );
      }
    })();
  }

  return {
    ...cached.data,
    cachedAt: cached.fetchedAt,
  };
}
