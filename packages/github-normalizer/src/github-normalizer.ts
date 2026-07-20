import { githubFetch, githubFetchAll } from "./client";
import type {
  GitHubFetchOptions,
  InputDetectionResult,
  LinkedIdentitySuggestions,
  NormalizedContribution,
  NormalizedContributor,
  NormalizedDeveloper,
  NormalizedLanguage,
  NormalizedOrganization,
  NormalizedRelease,
  NormalizedRepository,
  RawGitHubContributor,
  RawGitHubOrganization,
  RawGitHubRelease,
  RawGitHubRepository,
  RawGitHubSearchIssue,
  RawGitHubUser,
} from "./types";

function normalizeDeveloper(raw: RawGitHubUser): NormalizedDeveloper {
  return {
    id: raw.id,
    login: raw.login,
    name: raw.name ?? null,
    avatarUrl: raw.avatar_url,
    htmlUrl: raw.html_url,
    type: raw.type,
    company: raw.company ?? null,
    blog: raw.blog ?? null,
    location: raw.location ?? null,
    email: raw.email ?? null,
    bio: raw.bio ?? null,
    twitterUsername: raw.twitter_username ?? null,
    publicRepos: raw.public_repos ?? 0,
    publicGists: raw.public_gists ?? 0,
    followers: raw.followers ?? 0,
    following: raw.following ?? 0,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function normalizeRepository(raw: RawGitHubRepository): NormalizedRepository {
  return {
    id: raw.id,
    name: raw.name,
    fullName: raw.full_name,
    owner: {
      login: raw.owner?.login ?? "",
      id: raw.owner?.id ?? 0,
      avatarUrl: raw.owner?.avatar_url ?? "",
      type: raw.owner?.type ?? "",
    },
    htmlUrl: raw.html_url,
    description: raw.description ?? null,
    isFork: raw.fork ?? false,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    pushedAt: raw.pushed_at,
    homepage: raw.homepage ?? null,
    size: raw.size ?? 0,
    stargazersCount: raw.stargazers_count ?? 0,
    watchersCount: raw.watchers_count ?? 0,
    language: raw.language ?? null,
    forksCount: raw.forks_count ?? 0,
    openIssuesCount: raw.open_issues_count ?? 0,
    defaultBranch: raw.default_branch ?? "main",
    topics: raw.topics ?? [],
    isArchived: raw.archived ?? false,
  };
}

function normalizeOrganization(
  raw: RawGitHubOrganization,
): NormalizedOrganization {
  return {
    id: raw.id,
    login: raw.login,
    name: raw.name ?? null,
    description: raw.description ?? null,
    avatarUrl: raw.avatar_url,
    htmlUrl: raw.html_url,
    location: raw.location ?? null,
    email: raw.email ?? null,
    blog: raw.blog ?? null,
    twitterUsername: raw.twitter_username ?? null,
    publicRepos: raw.public_repos ?? 0,
    followers: raw.followers ?? 0,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function normalizeContributor(
  raw: RawGitHubContributor,
): NormalizedContributor {
  return {
    id: raw.id,
    login: raw.login,
    avatarUrl: raw.avatar_url,
    htmlUrl: raw.html_url,
    type: raw.type ?? "User",
    contributions: raw.contributions ?? 0,
  };
}

function normalizeRelease(raw: RawGitHubRelease): NormalizedRelease {
  return {
    id: raw.id,
    name: raw.name ?? null,
    tagName: raw.tag_name,
    targetCommitish: raw.target_commitish,
    body: raw.body ?? null,
    draft: raw.draft ?? false,
    prerelease: raw.prerelease ?? false,
    createdAt: raw.created_at,
    publishedAt: raw.published_at ?? null,
    htmlUrl: raw.html_url,
    author: raw.author
      ? {
          login: raw.author.login,
          id: raw.author.id,
          avatarUrl: raw.author.avatar_url,
        }
      : null,
  };
}

async function getOwnerType(
  owner: string,
  options?: GitHubFetchOptions,
): Promise<"User" | "Organization"> {
  try {
    const rawProfile = await githubFetch<RawGitHubUser>(
      `/users/${owner}`,
      options,
    );
    return rawProfile.type === "Organization" ? "Organization" : "User";
  } catch {
    return "User";
  }
}

export async function fetchDeveloper(
  username?: string,
  options?: GitHubFetchOptions,
): Promise<NormalizedDeveloper> {
  const endpoint = username ? `/users/${username}` : "/user";
  const raw = await githubFetch<RawGitHubUser>(endpoint, options);

  if (raw.type === "Organization") {
    throw new Error(
      `Requested entity '${username || "authenticated user"}' is an Organization, not a User.`,
    );
  }

  return normalizeDeveloper(raw);
}

export async function fetchRepositories(
  owner?: string,
  options?: GitHubFetchOptions,
): Promise<NormalizedRepository[]> {
  let endpoint: string;
  if (owner) {
    const ownerType = await getOwnerType(owner, options);
    endpoint =
      ownerType === "Organization"
        ? `/orgs/${owner}/repos`
        : `/users/${owner}/repos`;
  } else {
    endpoint = "/user/repos";
  }

  const raws = await githubFetchAll<RawGitHubRepository>(endpoint, options);
  return raws.map(normalizeRepository);
}

export async function fetchRepository(
  owner: string,
  repo: string,
  options?: GitHubFetchOptions,
): Promise<NormalizedRepository> {
  const raw = await githubFetch<RawGitHubRepository>(
    `/repos/${owner}/${repo}`,
    options,
  );
  return normalizeRepository(raw);
}

export async function fetchOrganizations(
  username?: string,
  options?: GitHubFetchOptions,
): Promise<NormalizedOrganization[]> {
  const endpoint = username ? `/users/${username}/orgs` : "/user/orgs";
  const briefOrgs = await githubFetchAll<RawGitHubOrganization>(
    endpoint,
    options,
  );

  const detailedOrgs = await Promise.all(
    briefOrgs.map((org) =>
      githubFetch<RawGitHubOrganization>(`/orgs/${org.login}`, options),
    ),
  );

  return detailedOrgs.map(normalizeOrganization);
}

export async function fetchContributors(
  owner: string,
  repo: string,
  options?: GitHubFetchOptions,
): Promise<NormalizedContributor[]> {
  const raws = await githubFetchAll<RawGitHubContributor>(
    `/repos/${owner}/${repo}/contributors`,
    options,
  );
  return raws.map(normalizeContributor);
}

export async function fetchLanguages(
  owner: string,
  repo: string,
  options?: GitHubFetchOptions,
): Promise<NormalizedLanguage[]> {
  const raw = await githubFetch<Record<string, number>>(
    `/repos/${owner}/${repo}/languages`,
    options,
  );
  return Object.entries(raw).map(([name, bytes]) => ({ name, bytes }));
}

export async function fetchReleases(
  owner: string,
  repo: string,
  options?: GitHubFetchOptions,
): Promise<NormalizedRelease[]> {
  const raws = await githubFetchAll<RawGitHubRelease>(
    `/repos/${owner}/${repo}/releases`,
    options,
  );
  return raws.map(normalizeRelease);
}

export async function fetchOrganization(
  login: string,
  options?: GitHubFetchOptions,
): Promise<NormalizedOrganization> {
  const raw = await githubFetch<RawGitHubOrganization>(
    `/orgs/${login}`,
    options,
  );
  return normalizeOrganization(raw);
}

export function detectInput(input: string): InputDetectionResult {
  const trimmed = input.trim();

  // 1. Check if it's a URL
  try {
    const url = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
    );
    const hostname = url.hostname.toLowerCase();

    if (hostname.includes("github.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length === 1) {
        return {
          platform: "github",
          type: "unknown",
          owner: parts[0],
          rawInput: trimmed,
        };
      }
      if (parts.length >= 2) {
        return {
          platform: "github",
          type: "repo",
          owner: parts[0],
          repo: parts[1],
          rawInput: trimmed,
        };
      }
    }

    if (hostname.includes("npmjs.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "package") {
        return {
          platform: "npm",
          type: "package",
          name: parts.slice(1).join("/"),
          rawInput: trimmed,
        };
      }
      if (parts[0].startsWith("~")) {
        return {
          platform: "npm",
          type: "user",
          name: parts[0].slice(1),
          rawInput: trimmed,
        };
      }
      if (parts[0].startsWith("@")) {
        if (parts.length === 1) {
          return {
            platform: "npm",
            type: "org",
            name: parts[0],
            rawInput: trimmed,
          };
        }
        return {
          platform: "npm",
          type: "package",
          name: `${parts[0]}/${parts[1]}`,
          rawInput: trimmed,
        };
      }
    }

    if (hostname.includes("stackoverflow.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "users" && parts[1]) {
        return {
          platform: "stackoverflow",
          type: "user",
          profileId: parts[1],
          name: parts[2] || undefined,
          rawInput: trimmed,
        };
      }
    }
  } catch {
    // Treat as non-URL text
  }

  if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    return {
      platform: "github",
      type: "repo",
      owner: parts[0],
      repo: parts[1],
      rawInput: trimmed,
    };
  }

  return {
    platform: "github",
    type: "unknown",
    owner: trimmed,
    rawInput: trimmed,
  };
}

export function suggestLinkedIdentities(
  developer: NormalizedDeveloper,
  _repositories: NormalizedRepository[],
): LinkedIdentitySuggestions {
  const suggestions: LinkedIdentitySuggestions = {};

  const searchTargets = [
    developer.blog,
    developer.bio,
    developer.company,
  ].filter(Boolean) as string[];
  const soRegex = /stackoverflow\.com\/users\/(\d+)\/([a-zA-Z0-9_-]+)?/;

  for (const target of searchTargets) {
    const match = target.match(soRegex);
    if (match) {
      suggestions.stackoverflow = {
        profileId: match[1],
        displayName: match[2] || developer.login,
        url: `https://stackoverflow.com/users/${match[1]}/${match[2] || ""}`,
      };
      break;
    }
  }

  suggestions.npm = {
    username: developer.login,
    url: `https://www.npmjs.com/~${developer.login}`,
  };

  return suggestions;
}

export async function fetchExternalContributions(
  username: string,
  limit = 10,
  options?: GitHubFetchOptions,
): Promise<NormalizedContribution[]> {
  try {
    const searchRes = await githubFetch<{ items: RawGitHubSearchIssue[] }>(
      `/search/issues?q=type:pr+author:${username}+-user:${username}+is:merged&per_page=100`,
      options,
    );

    const items = searchRes.items || [];
    const repoStarsMap = new Map<string, number>();
    const uniqueRepos = Array.from(
      new Set(
        items.map((item) => {
          const parts = item.repository_url.split("/");
          return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
        }),
      ),
    ).slice(0, limit);

    for (const repoFullName of uniqueRepos) {
      try {
        const rawRepo = await githubFetch<RawGitHubRepository>(
          `/repos/${repoFullName}`,
          options,
        );
        repoStarsMap.set(repoFullName, rawRepo.stargazers_count ?? 0);
      } catch (err) {
        console.error(`Failed to fetch repo metadata for ${repoFullName}`, err);
        repoStarsMap.set(repoFullName, 0);
      }
    }

    const contributions: NormalizedContribution[] = [];

    for (const item of items) {
      const parts = item.repository_url.split("/");
      const repoFullName = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;

      if (!repoStarsMap.has(repoFullName)) {
        continue;
      }

      const title = item.title.toLowerCase();
      const labels = (item.labels || []).map((l) => l.name.toLowerCase());

      let type: "code" | "docs" | "test" | "chore" = "code";

      const isDocs =
        title.includes("typo") ||
        title.includes("readme") ||
        title.includes("docs:") ||
        title.includes("documentation") ||
        title.includes("spelling") ||
        labels.some(
          (l) =>
            l.includes("doc") || l.includes("typo") || l.includes("readme"),
        );

      const isTest =
        title.includes("test:") ||
        title.includes("tests:") ||
        title.includes("spec:") ||
        title.includes("unit test") ||
        labels.some(
          (l) => l.includes("test") || l.includes("spec") || l.includes("qa"),
        );

      const isChore =
        title.includes("chore:") ||
        title.includes("bump ") ||
        title.includes("release ") ||
        labels.some(
          (l) =>
            l.includes("chore") ||
            l.includes("dependencies") ||
            l.includes("ci"),
        );

      if (isDocs) {
        type = "docs";
      } else if (isTest) {
        type = "test";
      } else if (isChore) {
        type = "chore";
      }

      contributions.push({
        title: item.title,
        htmlUrl: item.html_url,
        repoFullName,
        number: item.number,
        state: item.state,
        createdAt: item.created_at,
        mergedAt: item.pull_request?.merged_at || item.closed_at,
        labels: (item.labels || []).map((l) => l.name),
        type,
        targetRepoStars: repoStarsMap.get(repoFullName) || 0,
      });
    }

    return contributions;
  } catch (err) {
    console.error("Failed to fetch external contributions", err);
    return [];
  }
}
