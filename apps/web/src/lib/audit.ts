import type {
  NormalizedDeveloper,
  NormalizedOrganization,
  NormalizedRepository,
} from "@ossintel/github-normalizer";
import { generateIdentityInsights } from "@ossintel/insights";
import {
  calculateIdentityScore,
  calculateRepositoryScore,
  type NpmPackageStats,
} from "@ossintel/scoring";

export const auditDeveloper = (
  developer: NormalizedDeveloper,
  repositories: NormalizedRepository[],
  _organizations: NormalizedOrganization[],
  linkedIdentities?: { npm?: string; stackoverflow?: string },
  npmPackages?: NpmPackageStats[],
) => {
  const scores = calculateIdentityScore({
    repositories,
    npmPackages,
  });

  const insightsResult = generateIdentityInsights(repositories, scores, {
    type: "user",
    login: developer.login,
    name: developer.name,
    linkedIdentities,
  });

  const repoScores = repositories.map((r) => {
    const s = calculateRepositoryScore({ repository: r });
    return {
      repoName: r.name,
      fullName: r.fullName,
      scores: {
        overall: s.overall,
        risk: s.risk,
      },
      stars: r.stargazersCount,
      forks: r.forksCount,
    };
  });

  return {
    scores,
    findings: insightsResult.findings,
    recommendations: insightsResult.recommendations,
    promptContext: insightsResult.promptContext,
    repositories: repoScores,
  };
};

export const auditOrganization = (
  organization: NormalizedOrganization,
  repositories: NormalizedRepository[],
) => {
  const scores = calculateIdentityScore({
    repositories,
  });

  const insightsResult = generateIdentityInsights(repositories, scores, {
    type: "org",
    login: organization.login,
    name: organization.name,
  });

  const repoScores = repositories.map((r) => {
    const s = calculateRepositoryScore({ repository: r });
    return {
      repoName: r.name,
      fullName: r.fullName,
      scores: {
        overall: s.overall,
        risk: s.risk,
      },
      stars: r.stargazersCount,
      forks: r.forksCount,
    };
  });

  return {
    scores,
    findings: insightsResult.findings,
    recommendations: insightsResult.recommendations,
    promptContext: insightsResult.promptContext,
    repositories: repoScores,
  };
};
