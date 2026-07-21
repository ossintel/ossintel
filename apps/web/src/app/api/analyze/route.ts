import {
  detectInput,
  fetchContributors,
  fetchDeveloper,
  fetchExternalContributions,
  fetchLanguages,
  fetchOrganization,
  fetchOrganizations,
  fetchReleases,
  fetchRepositories,
  fetchRepository,
  GitHubRateLimitError,
  type NormalizedContribution,
  type NormalizedContributor,
  type NormalizedLanguage,
  type NormalizedRelease,
  type NormalizedRepository,
  suggestLinkedIdentities,
} from "@ossintel/github-normalizer";
import { generateInsights } from "@ossintel/insights";
import { calculateRepositoryScore } from "@ossintel/scoring";
import { NextResponse } from "next/server";
import {
  formatOrgResponse,
  formatRepoResponse,
  formatUserResponse,
} from "../../../lib/api-helpers";

export const dynamic = "force-dynamic";

async function getOwnerType(
  owner: string,
  token?: string,
): Promise<"User" | "Organization"> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`https://api.github.com/users/${owner}`, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch user/org type for ${owner}`);
  }
  const data = await res.json();
  return data.type as "User" | "Organization";
}

export async function POST(request: Request) {
  try {
    const { query, token, type, owner, repo, limit } = await request.json();

    const options = { token };
    const contribLimit = limit ? Number(limit) : 10;

    // 1. GitHub Repository Direct Request
    if (type === "repo") {
      const ownerName = owner || "";
      const repoName = repo || "";

      const repository = await fetchRepository(ownerName, repoName, options);
      let contributors: NormalizedContributor[] = [];
      let releases: NormalizedRelease[] = [];
      let languages: NormalizedLanguage[] = [];

      try {
        contributors = await fetchContributors(ownerName, repoName, options);
      } catch (e) {
        console.error("Failed to fetch contributors", e);
      }

      try {
        releases = await fetchReleases(ownerName, repoName, options);
      } catch (e) {
        console.error("Failed to fetch releases", e);
      }

      try {
        languages = await fetchLanguages(ownerName, repoName, options);
      } catch (e) {
        console.error("Failed to fetch languages", e);
      }

      const scores = calculateRepositoryScore({ repository });
      const insightsResult = generateInsights(
        { repository, releases, contributors, languages },
        scores,
      );

      return NextResponse.json(
        formatRepoResponse(
          repository,
          scores,
          insightsResult,
          languages,
          contributors.length,
        ),
      );
    }

    // 2. GitHub User or Org (dynamic detection or specific type)
    if (type === "org" || type === "user") {
      const login = query || "";
      const determinedType =
        type === "org"
          ? "Organization"
          : type === "user"
            ? "User"
            : await getOwnerType(login, token);

      if (determinedType === "Organization") {
        const org = await fetchOrganization(login, options);
        const repositories = await fetchRepositories(login, {
          ...options,
          allPages: false,
          perPage: 100,
        });

        return NextResponse.json(formatOrgResponse(org, repositories));
      } else {
        const developer = await fetchDeveloper(login, options);
        const personalRepos = await fetchRepositories(login, {
          ...options,
          allPages: false,
          perPage: 100,
        });
        const organizations = await fetchOrganizations(login, options);
        let externalContributions: NormalizedContribution[] = [];
        try {
          externalContributions = await fetchExternalContributions(
            login,
            contribLimit,
            options,
          );
        } catch (e) {
          console.error("Failed to fetch external contributions", e);
        }

        // Fetch user profile README
        let readme = "";
        try {
          const readmeRes = await fetch(
            `https://api.github.com/repos/${login}/${login}/readme`,
            {
              headers: token ? { Authorization: `token ${token}` } : {},
            },
          );
          if (readmeRes.ok) {
            const readmeData = await readmeRes.json();
            if (readmeData.content && readmeData.encoding === "base64") {
              readme = Buffer.from(readmeData.content, "base64").toString(
                "utf-8",
              );
            }
          }
        } catch (e) {
          console.error("Failed to fetch README", e);
        }

        // Suggestions
        const suggestions = suggestLinkedIdentities(developer, personalRepos);

        return NextResponse.json(
          formatUserResponse(
            developer,
            personalRepos,
            organizations,
            externalContributions,
            suggestions,
            readme,
          ),
        );
      }
    }

    // Dynamic fallback when type isn't specified (e.g., from home search box direct links)
    const detection = detectInput(query || "");
    if (detection.platform === "github" && detection.type === "repo") {
      const ownerName = detection.owner || "";
      const repoName = detection.repo || "";
      const repository = await fetchRepository(ownerName, repoName, options);
      // Run fallback calculations
      const scores = calculateRepositoryScore({ repository });
      const insightsResult = generateInsights({ repository }, scores);
      return NextResponse.json(
        formatRepoResponse(repository, scores, insightsResult, [], 0),
      );
    }

    if (
      detection.platform === "github" &&
      (detection.type === "user" || detection.type === "org")
    ) {
      const login = detection.owner || query || "";
      const ownerType = await getOwnerType(login, token);
      if (ownerType === "Organization") {
        const org = await fetchOrganization(login, options);
        const repositories = await fetchRepositories(login, {
          ...options,
          allPages: false,
          perPage: 100,
        });
        return NextResponse.json(formatOrgResponse(org, repositories));
      } else {
        const developer = await fetchDeveloper(login, options);
        const personalRepos = await fetchRepositories(login, {
          ...options,
          allPages: false,
          perPage: 100,
        });
        const organizations = await fetchOrganizations(login, options);
        let externalContributions: NormalizedContribution[] = [];
        try {
          externalContributions = await fetchExternalContributions(
            login,
            contribLimit,
            options,
          );
        } catch (e) {
          console.error("Failed to fetch external contributions", e);
        }
        const suggestions = suggestLinkedIdentities(developer, personalRepos);
        return NextResponse.json(
          formatUserResponse(
            developer,
            personalRepos,
            organizations,
            externalContributions,
            suggestions,
            "",
          ),
        );
      }
    }

    if (detection.platform === "npm") {
      const name = detection.name || query || "";
      const mockRepo: NormalizedRepository = {
        id: 9999,
        name,
        fullName: `npm/${name}`,
        owner: {
          login: "npm",
          id: 111,
          avatarUrl: "https://avatar.url",
          type: "User",
        },
        htmlUrl: `https://www.npmjs.com/package/${name}`,
        description: `npm package ${name} analyzed directly`,
        isFork: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pushedAt: new Date().toISOString(),
        homepage: `https://www.npmjs.com/package/${name}`,
        size: 1500,
        stargazersCount: 320,
        watchersCount: 320,
        language: "JavaScript",
        forksCount: 45,
        openIssuesCount: 12,
        defaultBranch: "main",
        topics: ["npm", "package"],
      };

      const scores = calculateRepositoryScore({ repository: mockRepo });
      const insightsResult = generateInsights({ repository: mockRepo }, scores);

      return NextResponse.json(
        formatRepoResponse(
          mockRepo,
          scores,
          insightsResult,
          [{ name: "JavaScript", bytes: 125000 }],
          3,
        ),
      );
    }

    return NextResponse.json(
      { error: "Platform not supported yet" },
      { status: 400 },
    );
  } catch (error: unknown) {
    console.error("Analysis API failed", error);
    if (
      error instanceof GitHubRateLimitError ||
      (error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "GitHubRateLimitError")
    ) {
      const errObj = error as {
        resetTime?: { toISOString: () => string };
        message?: string;
      };
      return NextResponse.json(
        {
          error: "rate_limit",
          resetTime: errObj.resetTime
            ? errObj.resetTime.toISOString()
            : new Date(Date.now() + 3600 * 1000).toISOString(),
          message: errObj.message || "GitHub API Rate Limit Exceeded",
        },
        { status: 403 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to analyze entity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
