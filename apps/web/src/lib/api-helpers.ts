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

export const formatRepoResponse = (
  repository: NormalizedRepository,
  scores: RepositoryScores,
  insightsResult: RepositoryInsights,
  languages: NormalizedLanguage[] = [],
  contributorsCount = 0,
) => {
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
};

export const formatOrgResponse = (
  org: NormalizedOrganization,
  repositories: NormalizedRepository[],
) => {
  return {
    type: "org" as const,
    metadata: {
      id: org.id,
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
};

export const formatUserResponse = (
  developer: NormalizedDeveloper,
  personalRepos: NormalizedRepository[],
  organizations: NormalizedOrganization[],
  externalContributions: NormalizedContribution[],
  suggestions: LinkedIdentitySuggestions,
  readme: string,
) => {
  return {
    type: "user" as const,
    metadata: {
      id: developer.id,
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
      socialLinks: developer.socialLinks,
      organizations,
      suggestions,
      readme,
      twitterUsername: developer.twitterUsername,
      email: developer.email,
    },
    repositories: personalRepos,
    externalContributions,
  };
};

export const getFriendlyErrorMessage = (
  error: unknown,
  defaultMessage: string,
): string => {
  if (!error) return defaultMessage;

  const err = error as {
    status?: number;
    statusCode?: number;
    message?: string;
    name?: string;
    code?: string;
  };

  const status = err.status || err.statusCode;
  const name = err.name || "";
  const code = err.code || "";
  const messageStr = err.message || "";

  // Check for rate limit
  if (
    name === "GitHubRateLimitError" ||
    messageStr.includes("rate_limit") ||
    messageStr.includes("Rate Limit Exceeded")
  ) {
    return "GitHub API Rate Limit Exceeded. Please try again later or add a Personal Access Token.";
  }

  // Check for offline / network connection errors
  if (
    messageStr.includes("fetch failed") ||
    messageStr.includes("ENOTFOUND") ||
    messageStr.includes("EAI_AGAIN") ||
    messageStr.includes("ECONNRESET") ||
    messageStr.includes("ECONNREFUSED") ||
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN"
  ) {
    return "Network connection error. Please check your internet connection and try again.";
  }

  if (status === 404) {
    if (defaultMessage.toLowerCase().includes("repository")) {
      return "GitHub repository not found. Please verify the owner and repository names.";
    }
    if (defaultMessage.toLowerCase().includes("organization")) {
      return "GitHub organization not found. Please verify the organization name.";
    }
    return "GitHub profile not found. Please verify the username.";
  }

  if (status === 401 || status === 403) {
    return "Access denied by GitHub APIs. Please verify your configured Personal Access Token.";
  }

  if (status && status >= 500) {
    return "GitHub APIs are currently experiencing issues. Please try again in a few moments.";
  }

  if (messageStr?.includes("status code")) {
    return messageStr;
  }

  return defaultMessage;
};
