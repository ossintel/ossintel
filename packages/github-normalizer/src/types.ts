export interface GitHubFetchOptions {
  token?: string;
  baseUrl?: string;
  perPage?: number;
  page?: number;
  allPages?: boolean;
}

export class GitHubHttpError extends Error {
  public status: number;
  public statusText: string;

  constructor(status: number, statusText: string, message: string) {
    super(message);
    this.name = "GitHubHttpError";
    this.status = status;
    this.statusText = statusText;
  }
}

export class GitHubRateLimitError extends Error {
  public limit: number;
  public remaining: number;
  public resetTime: Date;

  constructor(
    limit: number,
    remaining: number,
    resetTime: Date,
    message: string,
  ) {
    super(message);
    this.name = "GitHubRateLimitError";
    this.limit = limit;
    this.remaining = remaining;
    this.resetTime = resetTime;
  }
}

export interface RawGitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  type: string;
  company?: string | null;
  blog?: string | null;
  location?: string | null;
  email?: string | null;
  bio?: string | null;
  twitter_username?: string | null;
  public_repos?: number;
  public_gists?: number;
  followers?: number;
  following?: number;
  created_at: string;
  updated_at: string;
}

export interface RawGitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner?: {
    login: string;
    id: number;
    avatar_url: string;
    type: string;
  };
  html_url: string;
  description?: string | null;
  fork?: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage?: string | null;
  size?: number;
  stargazers_count?: number;
  watchers_count?: number;
  language?: string | null;
  forks_count?: number;
  open_issues_count?: number;
  default_branch?: string;
  topics?: string[];
  archived?: boolean;
}

export interface RawGitHubOrganization {
  id: number;
  login: string;
  name?: string | null;
  description?: string | null;
  avatar_url: string;
  html_url: string;
  location?: string | null;
  email?: string | null;
  blog?: string | null;
  twitter_username?: string | null;
  public_repos?: number;
  followers?: number;
  created_at: string;
  updated_at: string;
}

export interface RawGitHubContributor {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  type?: string;
  contributions?: number;
}

export interface RawGitHubRelease {
  id: number;
  name?: string | null;
  tag_name: string;
  target_commitish: string;
  body?: string | null;
  draft?: boolean;
  prerelease?: boolean;
  created_at: string;
  published_at?: string | null;
  html_url: string;
  author?: {
    login: string;
    id: number;
    avatar_url: string;
  } | null;
}

export interface NormalizedDeveloper {
  id: number;
  login: string;
  name: string | null;
  avatarUrl: string;
  htmlUrl: string;
  type: string;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitterUsername: string | null;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  createdAt: string;
  updatedAt: string;
  socialLinks?: string[];
}

export interface NormalizedRepository {
  id: number;
  name: string;
  fullName: string;
  owner: {
    login: string;
    id: number;
    avatarUrl: string;
    type: string;
  };
  htmlUrl: string;
  description: string | null;
  isFork: boolean;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  homepage: string | null;
  size: number;
  stargazersCount: number;
  watchersCount: number;
  language: string | null;
  forksCount: number;
  openIssuesCount: number;
  defaultBranch: string;
  topics: string[];
  isArchived: boolean;
}

export interface NormalizedOrganization {
  id: number;
  login: string;
  name: string | null;
  description: string | null;
  avatarUrl: string;
  htmlUrl: string;
  location: string | null;
  email: string | null;
  blog: string | null;
  twitterUsername: string | null;
  publicRepos: number;
  followers: number;
  createdAt: string;
  updatedAt: string;
}

export interface NormalizedContributor {
  id: number;
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  type: string;
  contributions: number;
}

export interface NormalizedLanguage {
  name: string;
  bytes: number;
}

export interface NormalizedRelease {
  id: number;
  name: string | null;
  tagName: string;
  targetCommitish: string;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  createdAt: string;
  publishedAt: string | null;
  htmlUrl: string;
  author: {
    login: string;
    id: number;
    avatarUrl: string;
  } | null;
}

export interface LinkedIdentitySuggestions {
  stackoverflow?: {
    profileId: string;
    displayName: string;
    url: string;
  };
  npm?: {
    username: string;
    url: string;
  };
}

export interface RawGitHubSearchIssue {
  title: string;
  html_url: string;
  repository_url: string;
  number: number;
  state: string;
  created_at: string;
  closed_at: string | null;
  pull_request?: {
    merged_at?: string | null;
  };
  labels: { name: string }[];
}

export interface NormalizedContribution {
  title: string;
  htmlUrl: string;
  repoFullName: string;
  number: number;
  state: string;
  createdAt: string;
  mergedAt: string | null;
  labels: string[];
  type: "code" | "docs" | "test" | "chore";
  targetRepoStars: number;
}
