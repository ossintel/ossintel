import type { NormalizedStackOverflowUser } from "@ossintel/stackoverflow";

export interface KnowledgeScore {
  /** Overall knowledge sharing score (0-100). */
  score: number;
  /** Breakdown of sub-scores contributing to the overall. */
  breakdown: {
    /** Score based on reputation volume (0-100). */
    reputation: number;
    /** Score based on answer count (0-100). */
    answers: number;
    /** Score based on acceptance rate (0-100). */
    acceptance: number;
  };
}

/**
 * Calculate a Knowledge Sharing capability score.
 *
 * Currently evaluates Stack Overflow presence only. Designed to be
 * extended with additional platforms (Dev.to, Hashnode, etc.)
 * by adding optional parameters without breaking existing callers.
 *
 * @returns A score (0-100) with breakdown, or null if no data is available.
 */
export const calculateKnowledgeScore = (
  stackoverflowUser?: NormalizedStackOverflowUser | null,
): KnowledgeScore | null => {
  if (!stackoverflowUser) return null;

  const soRep = stackoverflowUser.reputation ?? 0;

  const reputation = Math.min(100, Math.log10(soRep + 1) * 20);
  const answers = Math.min(100, stackoverflowUser.answerCount * 2);
  const acceptance = stackoverflowUser.acceptanceRate || 0;

  const score = Math.min(
    100,
    Math.round(reputation * 0.5 + answers * 0.3 + acceptance * 0.2),
  );

  return {
    score,
    breakdown: {
      reputation: Math.round(reputation),
      answers: Math.round(answers),
      acceptance: Math.round(acceptance),
    },
  };
};
