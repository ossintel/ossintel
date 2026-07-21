import type { RepositoryScores, ScoringInputs } from "./types";

/** Calculate the impact score based on stars, forks, and watchers. */
export const calculateImpactScore = (
  repository: ScoringInputs["repository"],
): number => {
  const stars = repository.stargazersCount;
  const forks = repository.forksCount;
  const watchers = repository.watchersCount;

  const starScore = Math.min(100, Math.log10(stars + 1) * 20);
  const forkScore = Math.min(100, Math.log10(forks + 1) * 25);
  const watcherScore = Math.min(100, Math.log10(watchers + 1) * 30);

  return Math.round(starScore * 0.5 + forkScore * 0.35 + watcherScore * 0.15);
};

/** Calculate the activity score based on push recency and release frequency. */
export const calculateActivityScore = (
  repository: ScoringInputs["repository"],
  releases: ScoringInputs["releases"],
): number => {
  if (repository.isArchived) return 0;
  const now = new Date();
  const pushDate = new Date(repository.pushedAt);
  const diffMs = now.getTime() - pushDate.getTime();
  const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));

  let recencyScore = 0;
  if (diffDays <= 1) recencyScore = 100;
  else if (diffDays <= 7) recencyScore = 90;
  else if (diffDays <= 30) recencyScore = 80;
  else if (diffDays <= 90) recencyScore = 60;
  else if (diffDays <= 180) recencyScore = 40;
  else if (diffDays <= 365) recencyScore = 20;

  let releaseScore = 50;
  if (releases) {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    const recentReleases = releases.filter(
      (r) => r.publishedAt && new Date(r.publishedAt) >= oneYearAgo,
    ).length;
    releaseScore = Math.min(100, recentReleases * 20);
  }

  return Math.round(recencyScore * 0.6 + releaseScore * 0.4);
};

/** Calculate the community score from contributors, topics, and metadata. */
export const calculateCommunityScore = (
  repository: ScoringInputs["repository"],
  contributors: ScoringInputs["contributors"],
): number => {
  // Throttling/rate-limit fallback: estimate contributor base from stargazers if empty
  const contributorsCount =
    contributors && contributors.length > 0
      ? contributors.length
      : Math.max(
          1,
          Math.min(100, Math.floor(Math.sqrt(repository.stargazersCount))),
        );
  const contributorScore = Math.min(
    100,
    Math.log10(contributorsCount + 1) * 50,
  );

  const topicScore = repository.topics.length > 0 ? 100 : 0;
  const metaScore =
    (repository.description ? 50 : 0) + (repository.homepage ? 50 : 0);

  return Math.round(
    contributorScore * 0.7 + topicScore * 0.15 + metaScore * 0.15,
  );
};

/** Calculate repository health based on issue density, update recency, and fork status. */
export const calculateHealthScore = (
  repository: ScoringInputs["repository"],
): number => {
  if (repository.isArchived) return 0;
  const popularity = repository.stargazersCount + repository.forksCount;
  let issueScore = 100;
  if (repository.openIssuesCount > 0) {
    const ratio = repository.openIssuesCount / (popularity + 10);
    issueScore = Math.max(0, 100 - ratio * 500);
  }

  const updateDate = new Date(repository.updatedAt);
  const diffMs = Date.now() - updateDate.getTime();
  const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
  let updateHealthScore = 0;
  if (diffDays <= 30) updateHealthScore = 100;
  else if (diffDays <= 90) updateHealthScore = 80;
  else if (diffDays <= 180) updateHealthScore = 60;
  else if (diffDays <= 365) updateHealthScore = 40;
  else updateHealthScore = 10;

  const forkScore = repository.isFork ? 50 : 100;

  return Math.round(
    issueScore * 0.5 + updateHealthScore * 0.3 + forkScore * 0.2,
  );
};

/** Calculate risk score based on staleness, contributor count, fork status, and issue density. */
export const calculateRiskScore = (
  repository: ScoringInputs["repository"],
  contributors: ScoringInputs["contributors"],
): number => {
  let riskScore = 0;

  const pushDate = new Date(repository.pushedAt);
  const diffDays = (Date.now() - pushDate.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 365) riskScore += 30;
  else if (diffDays > 180) riskScore += 20;
  else if (diffDays > 90) riskScore += 10;

  // Throttling/rate-limit fallback: estimate contributor base from stargazers if empty
  const contributorCount =
    contributors && contributors.length > 0
      ? contributors.length
      : Math.max(
          1,
          Math.min(100, Math.floor(Math.sqrt(repository.stargazersCount))),
        );
  if (contributorCount <= 1) riskScore += 30;
  else if (contributorCount <= 3) riskScore += 20;
  else if (contributorCount <= 5) riskScore += 10;

  if (repository.isFork) riskScore += 20;

  const popularity = repository.stargazersCount + repository.forksCount;
  if (
    repository.openIssuesCount > 50 &&
    repository.openIssuesCount > popularity
  ) {
    riskScore += 20;
  } else if (repository.openIssuesCount > 20) {
    riskScore += 10;
  }

  return Math.min(100, Math.round(riskScore));
};

/** Calculate aggregate repository scores across all dimensions. */
export const calculateRepositoryScore = (
  inputs: ScoringInputs,
): RepositoryScores => {
  const { repository, contributors, releases } = inputs;

  const health = calculateHealthScore(repository);
  const impact = calculateImpactScore(repository);
  const activity = calculateActivityScore(repository, releases);
  const community = calculateCommunityScore(repository, contributors);
  const risk = calculateRiskScore(repository, contributors);

  const overall = Math.round(
    health * 0.3 +
      impact * 0.25 +
      activity * 0.2 +
      community * 0.15 +
      (100 - risk) * 0.1,
  );

  return {
    overall,
    health,
    impact,
    activity,
    community,
    risk,
  };
};
