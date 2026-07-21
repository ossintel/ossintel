export interface InfluenceResult {
  /** Final influence score (0-100). */
  score: number;
  /** GitHub-only influence base. */
  githubBase: number;
  /** Additive npm bonus (0-15). */
  npmBonus: number;
  /** Additive Stack Overflow bonus (0-15). */
  soBonus: number;
}

/**
 * Calculate the influence pillar score.
 *
 * GitHub stars and forks form the base. npm downloads and
 * Stack Overflow reputation provide bounded additive bonuses.
 */
export const calculateInfluenceScore = (
  totalStarsCount: number,
  totalForksCount: number,
  totalNpmDownloads: number,
  soReputation: number,
): InfluenceResult => {
  const starWeight = Math.log10(totalStarsCount + 1) * 20;
  const forkWeight = Math.log10(totalForksCount + 1) * 20;
  const githubBase = Math.min(100, Math.round(starWeight + forkWeight));

  const npmBonus =
    totalNpmDownloads > 0
      ? Math.min(15, Math.log10(totalNpmDownloads + 1) * 2.5)
      : 0;

  const soBonus =
    soReputation > 0 ? Math.min(15, Math.log10(soReputation + 1) * 2.5) : 0;

  const score = Math.min(100, Math.round(githubBase + npmBonus + soBonus));

  return { score, githubBase, npmBonus, soBonus };
};
