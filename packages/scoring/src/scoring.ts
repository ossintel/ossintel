import type {
  IdentityScores,
  IdentityScoringInputs,
  RepositoryScores,
  ScoringInputs,
} from "./types";

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

export const calculateCommunityScore = (
  repository: ScoringInputs["repository"],
  contributors: ScoringInputs["contributors"],
): number => {
  const contributorsCount = contributors ? contributors.length : 0;
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

  const contributorCount = contributors ? contributors.length : 1;
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

export const calculateIdentityScore = (
  inputs: IdentityScoringInputs,
): IdentityScores => {
  const { repositories, npmPackages } = inputs;

  if (repositories.length === 0) {
    return {
      overall: 0,
      health: 0,
      impact: 0,
      activity: 0,
      community: 0,
      risk: 100,
    };
  }

  const totalStars = repositories.reduce(
    (acc, r) => acc + r.stargazersCount,
    0,
  );
  const totalForks = repositories.reduce((acc, r) => acc + r.forksCount, 0);
  const totalWatchers = repositories.reduce(
    (acc, r) => acc + r.watchersCount,
    0,
  );

  const starScore = Math.min(100, Math.log10(totalStars + 1) * 20);
  const forkScore = Math.min(100, Math.log10(totalForks + 1) * 25);
  const watcherScore = Math.min(100, Math.log10(totalWatchers + 1) * 30);
  let baseImpact = starScore * 0.5 + forkScore * 0.35 + watcherScore * 0.15;

  if (npmPackages && npmPackages.length > 0) {
    const totalDownloads = npmPackages.reduce((acc, p) => acc + p.downloads, 0);
    const npmScore = Math.min(100, Math.log10(totalDownloads + 1) * 15);
    baseImpact = baseImpact * 0.8 + npmScore * 0.2;
  }
  const impact = Math.round(baseImpact);

  const activeRepos = repositories.filter((r) => !r.isArchived);

  let health = 0;
  let activity = 0;
  let community = 0;
  let risk = 100;

  if (activeRepos.length > 0) {
    const repoScoresList = activeRepos.map((r) =>
      calculateRepositoryScore({ repository: r }),
    );
    health = Math.round(
      repoScoresList.reduce((acc, s) => acc + s.health, 0) /
        repoScoresList.length,
    );
    activity = Math.round(
      repoScoresList.reduce((acc, s) => acc + s.activity, 0) /
        repoScoresList.length,
    );
    community = Math.round(
      repoScoresList.reduce((acc, s) => acc + s.community, 0) /
        repoScoresList.length,
    );
    risk = Math.round(
      repoScoresList.reduce((acc, s) => acc + s.risk, 0) /
        repoScoresList.length,
    );
  }

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
