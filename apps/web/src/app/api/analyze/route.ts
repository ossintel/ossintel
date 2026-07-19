import {
  detectInput,
  fetchContributors,
  fetchDeveloper,
  fetchLanguages,
  fetchOrganization,
  fetchOrganizations,
  fetchReleases,
  fetchRepositories,
  fetchRepository,
  type NormalizedContributor,
  type NormalizedLanguage,
  type NormalizedRelease,
  type NormalizedRepository,
  suggestLinkedIdentities,
} from "@ossintel/github-normalizer";
import { generateInsights } from "@ossintel/insights";
import {
  calculateRepositoryScore,
  type NpmPackageStats,
} from "@ossintel/scoring";
import { NextResponse } from "next/server";
import { auditDeveloper, auditOrganization } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function getOwnerType(
  owner: string,
  token?: string,
): Promise<"User" | "Organization"> {
  try {
    const res = await fetch(`https://api.github.com/users/${owner}`, {
      headers: token ? { Authorization: `token ${token}` } : {},
    });
    if (res.ok) {
      const data = await res.json();
      return data.type === "Organization" ? "Organization" : "User";
    }
  } catch (e) {
    console.error("Failed to fetch owner type", e);
  }
  return "User";
}

export async function POST(request: Request) {
  try {
    let {
      query,
      token,
      selectedOrgs = [],
      linkedNpm,
      linkedSO,
      owner,
      repo,
    } = await request.json();

    if (!query) {
      if (owner && repo) {
        query = `${owner}/${repo}`;
      } else if (owner) {
        query = owner;
      } else {
        return NextResponse.json(
          { error: "Search query is required" },
          { status: 400 },
        );
      }
    }

    const options = { token };
    const detection = detectInput(query);

    // 1. GitHub Repository
    if (detection.platform === "github" && detection.type === "repo") {
      const owner = detection.owner || "";
      const repo = detection.repo || "";

      const repository = await fetchRepository(owner, repo, options);
      let contributors: NormalizedContributor[] = [];
      let releases: NormalizedRelease[] = [];
      let languages: NormalizedLanguage[] = [];

      try {
        contributors = await fetchContributors(owner, repo, {
          ...options,
          allPages: false,
          perPage: 100,
        });
      } catch (e) {
        console.error("Contributors error", e);
      }

      try {
        releases = await fetchReleases(owner, repo, {
          ...options,
          allPages: false,
          perPage: 100,
        });
      } catch (e) {
        console.error("Releases error", e);
      }

      try {
        languages = await fetchLanguages(owner, repo, options);
      } catch (e) {
        console.error("Languages error", e);
      }

      const scores = calculateRepositoryScore({
        repository,
        contributors,
        releases,
        languages,
      });
      const insightsResult = generateInsights(
        { repository, contributors, releases, languages },
        scores,
      );

      return NextResponse.json({
        type: "repo",
        metadata: {
          name: repository.name,
          fullName: repository.fullName,
          description: repository.description,
          stars: repository.stargazersCount,
          forks: repository.forksCount,
          watchers: repository.watchersCount,
          openIssues: repository.openIssuesCount,
          language: repository.language,
          topics: repository.topics,
          defaultBranch: repository.defaultBranch,
          isFork: repository.isFork,
          isArchived: repository.isArchived,
          htmlUrl: repository.htmlUrl,
          pushedAt: repository.pushedAt,
          updatedAt: repository.updatedAt,
          owner: repository.owner,
        },
        scores,
        findings: insightsResult.findings,
        recommendations: insightsResult.recommendations,
        promptContext: insightsResult.promptContext,
        languages,
        contributorsCount: contributors.length,
      });
    }

    // 2. GitHub User or Org (bare input or user/org URL)
    if (detection.platform === "github") {
      const login = detection.owner || query.trim();
      const ownerType = await getOwnerType(login, token);

      if (ownerType === "Organization") {
        const org = await fetchOrganization(login, options);
        const repositories = await fetchRepositories(login, {
          ...options,
          allPages: false,
          perPage: 100,
        });
        const auditResult = auditOrganization(org, repositories);

        return NextResponse.json({
          type: "org",
          metadata: {
            login: org.login,
            name: org.name,
            avatarUrl: org.avatarUrl,
            htmlUrl: org.htmlUrl,
            location: org.location,
            email: org.email,
            blog: org.blog,
            publicRepos: org.publicRepos,
            followers: org.followers,
            description: org.description,
          },
          ...auditResult,
        });
      } else {
        const developer = await fetchDeveloper(login, options);
        const personalRepos = await fetchRepositories(login, {
          ...options,
          allPages: false,
          perPage: 100,
        });
        const organizations = await fetchOrganizations(login, options);

        // Fetch organization repositories if any selected
        const orgReposPromises = selectedOrgs.map(async (orgLogin: string) => {
          try {
            return await fetchRepositories(orgLogin, {
              ...options,
              allPages: false,
              perPage: 50,
            });
          } catch (e) {
            console.error(`Failed to fetch repos for org ${orgLogin}`, e);
            return [];
          }
        });
        const fetchedOrgRepos = (await Promise.all(orgReposPromises)).flat();
        const allRepositories = [...personalRepos, ...fetchedOrgRepos];

        // Suggestions
        const suggestions = suggestLinkedIdentities(developer, personalRepos);

        // npm Packages Mock if NPM identity is linked
        let npmPackages: NpmPackageStats[] = [];
        if (linkedNpm) {
          npmPackages = [
            { name: `${linkedNpm}-helper`, downloads: 45000, stars: 12 },
            { name: `react-${linkedNpm}`, downloads: 125000, stars: 45 },
          ];
        }

        const auditResult = auditDeveloper(
          developer,
          allRepositories,
          organizations,
          { npm: linkedNpm, stackoverflow: linkedSO },
          npmPackages,
        );

        return NextResponse.json({
          type: "user",
          metadata: {
            login: developer.login,
            name: developer.name,
            avatarUrl: developer.avatarUrl,
            htmlUrl: developer.htmlUrl,
            company: developer.company,
            blog: developer.blog,
            location: developer.location,
            bio: developer.bio,
            followers: developer.followers,
            following: developer.following,
            publicRepos: developer.publicRepos,
            createdAt: developer.createdAt,
            organizations,
            suggestions,
          },
          ...auditResult,
        });
      }
    }

    // 3. Fallback for npm package or stackoverflow or GitLab
    if (detection.platform === "npm") {
      const name = detection.name || query.trim();
      // Mock repository score representing the npm package
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

      return NextResponse.json({
        type: "repo",
        metadata: {
          name: mockRepo.name,
          fullName: mockRepo.fullName,
          description: mockRepo.description,
          stars: mockRepo.stargazersCount,
          forks: mockRepo.forksCount,
          watchers: mockRepo.watchersCount,
          openIssues: mockRepo.openIssuesCount,
          language: mockRepo.language,
          topics: mockRepo.topics,
          defaultBranch: mockRepo.defaultBranch,
          isFork: mockRepo.isFork,
          isArchived: mockRepo.isArchived,
          htmlUrl: mockRepo.htmlUrl,
          pushedAt: mockRepo.pushedAt,
          updatedAt: mockRepo.updatedAt,
          owner: mockRepo.owner,
        },
        scores,
        findings: insightsResult.findings,
        recommendations: insightsResult.recommendations,
        promptContext: insightsResult.promptContext,
        languages: [{ name: "JavaScript", bytes: 125000 }],
        contributorsCount: 3,
      });
    }

    return NextResponse.json(
      { error: "Platform not supported yet" },
      { status: 400 },
    );
  } catch (error: unknown) {
    console.error("Analysis API failed", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyze entity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
