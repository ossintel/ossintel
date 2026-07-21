import type { NormalizedRepository } from "@ossintel/github-normalizer";
import { calculateRepositoryScore } from "./repository-scoring";

export interface MaintainerResult {
  /** Final maintainer score (0-100), including additive npm bonus. */
  score: number;
  /** GitHub-only base score before npm bonus. */
  githubBase: number;
  /** Additive npm bonus (0-10). */
  npmBonus: number;
  /** Number of repos with sustained long-term maintenance. */
  sustainedCount: number;
}

/**
 * Calculate the maintainer pillar score.
 *
 * GitHub repo health is the primary signal. npm download volume
 * provides a small additive bonus (capped at 10 points) that can
 * never reduce the score.
 */
export const calculateMaintainerScore = (
  repositories: NormalizedRepository[],
  totalNpmDownloads: number,
): MaintainerResult => {
  const activeRepos = repositories.filter((r) => !r.isArchived);
  let totalWeight = 0;
  let weightedHealthSum = 0;
  let sustainedCount = 0;

  for (const repo of activeRepos) {
    const scores = calculateRepositoryScore({ repository: repo });
    const baseHealth = scores.health;

    const pushAgeDays =
      (Date.now() - new Date(repo.pushedAt).getTime()) / (1000 * 60 * 60 * 24);
    const createdAgeDays =
      (Date.now() - new Date(repo.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const isSustained = createdAgeDays > 365 && pushAgeDays < 90;

    const repoHealth = isSustained
      ? Math.min(100, baseHealth + 10)
      : baseHealth;
    if (isSustained) {
      sustainedCount++;
    }

    // GitHub-only weighting — no npm downloads here
    const weight = Math.log10(repo.stargazersCount + repo.forksCount + 1) + 1;
    weightedHealthSum += repoHealth * weight;
    totalWeight += weight;
  }

  const githubBase =
    totalWeight > 0 ? Math.round(weightedHealthSum / totalWeight) : 0;

  // Additive npm bonus (never reduces score)
  let npmBonus = 0;
  if (totalNpmDownloads > 0) {
    npmBonus = Math.min(10, Math.log10(totalNpmDownloads + 1) * 1.5 + 2);
  }

  const score = Math.min(100, Math.round(githubBase + npmBonus));

  return { score, githubBase, npmBonus, sustainedCount };
};
