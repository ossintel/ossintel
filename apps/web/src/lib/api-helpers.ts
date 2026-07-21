import type {
  LinkedIdentitySuggestions,
  NormalizedContribution,
  NormalizedDeveloper,
  NormalizedLanguage,
  NormalizedOrganization,
  NormalizedRepository,
} from "@ossintel/github-normalizer";
import type { RepositoryInsights } from "@ossintel/insights";
import type { RepositoryScores } from "@ossintel/scoring";

export function formatRepoResponse(
  repository: NormalizedRepository,
  scores: RepositoryScores,
  insightsResult: RepositoryInsights,
  languages: NormalizedLanguage[] = [],
  contributorsCount: number = 0,
) {
  return {
    type: "repo" as const,
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
    contributorsCount,
  };
}

export function formatOrgResponse(
  org: NormalizedOrganization,
  repositories: NormalizedRepository[],
) {
  return {
    type: "org" as const,
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
    repositories,
  };
}

export function formatUserResponse(
  developer: NormalizedDeveloper,
  personalRepos: NormalizedRepository[],
  organizations: NormalizedOrganization[],
  externalContributions: NormalizedContribution[],
  suggestions: LinkedIdentitySuggestions,
  readme: string,
) {
  return {
    type: "user" as const,
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
      readme,
      twitterUsername: developer.twitterUsername,
      email: developer.email,
    },
    repositories: personalRepos,
    externalContributions,
  };
}
