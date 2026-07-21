import { calculateBadges } from "./badges";
import { calculateContributorScore } from "./contributor-scoring";
import { generateEvidence, generateFactors } from "./evidence";
import { calculateInfluenceScore } from "./influence-scoring";
import { calculateKnowledgeScore } from "./knowledge-scoring";
import { calculateMaintainerScore } from "./maintainer-scoring";
import { calculateOrganizationScore } from "./organization-scoring";
import { calculatePublishingScore } from "./publishing-scoring";
import { calculateSkills } from "./skills";
import type { IdentityScores, IdentityScoringInputs } from "./types";

/**
 * Calculate the unified OSS identity score.
 *
 * GitHub is the primary identity (~80-85% weight). npm (Package Publishing)
 * and Stack Overflow (Knowledge Sharing) provide additive evidence bonuses
 * that can never reduce the score.
 *
 * @see {@link file://docs/domain-model.md} for scoring philosophy.
 */
export const calculateIdentityScore = (
  inputs: IdentityScoringInputs,
): IdentityScores => {
  const {
    repositories = [],
    npmUser = null,
    stackoverflowUser = null,
    externalContributions = [],
    organizations = [],
  } = inputs;

  const totalStarsCount = repositories.reduce(
    (acc, r) => acc + r.stargazersCount,
    0,
  );
  const totalForksCount = repositories.reduce(
    (acc, r) => acc + r.forksCount,
    0,
  );
  const totalNpmDownloads = npmUser?.totalDownloads ?? 0;
  const soRep = stackoverflowUser?.reputation ?? 0;

  // Early exit: no data at all
  if (
    repositories.length === 0 &&
    externalContributions.length === 0 &&
    !npmUser &&
    !stackoverflowUser &&
    organizations.length === 0
  ) {
    return {
      overall: 0,
      maintainer: 0,
      contributor: 0,
      organization: 0,
      influence: 0,
      confidence: "Low",
      evidence: {
        maintainer: [],
        contributor: [],
        influence: [],
        organization: [],
      },
      factors: {
        maintainer: [],
        contributor: [],
        influence: [],
        organization: [],
      },
      badges: [],
      skills: [],
    };
  }

  // 1. Maintainer Score (GitHub-only weighting + additive npm bonus)
  const maintainerResult = calculateMaintainerScore(
    repositories,
    totalNpmDownloads,
  );

  // 2. Contributor Score (external PRs)
  const contributorResult = calculateContributorScore(externalContributions);

  // 3. Organization Leadership
  const orgResult = calculateOrganizationScore(organizations);

  // 4. Influence (GitHub base + additive bonuses)
  const influenceResult = calculateInfluenceScore(
    totalStarsCount,
    totalForksCount,
    totalNpmDownloads,
    soRep,
  );

  // 5. Confidence
  const totalReposCount = repositories.length;
  const totalPRsCount = externalContributions.length;
  let confidence: "High" | "Medium" | "Low" = "Low";
  if (
    totalReposCount >= 10 ||
    totalPRsCount >= 15 ||
    totalNpmDownloads >= 5000 ||
    soRep >= 1000
  ) {
    confidence = "High";
  } else if (totalReposCount >= 3 || totalPRsCount >= 3 || soRep >= 100) {
    confidence = "Medium";
  }

  // 6. Overall Reputation (GitHub-first + additive evidence bonuses)
  const githubMaintainer = maintainerResult.githubBase;
  const contributor = contributorResult.score;
  const organizationScore = orgResult.score;
  const githubInfluence = influenceResult.githubBase;

  let githubOverall = 0;
  if (orgResult.activeCount > 0) {
    githubOverall = Math.round(
      githubMaintainer * 0.35 +
        contributor * 0.3 +
        organizationScore * 0.15 +
        githubInfluence * 0.2,
    );
  } else {
    githubOverall = Math.round(
      githubMaintainer * 0.45 + contributor * 0.35 + githubInfluence * 0.2,
    );
  }

  // Capability-specific scores (0-100 each)
  const publishingResult = calculatePublishingScore(npmUser);
  const knowledgeResult = calculateKnowledgeScore(stackoverflowUser);

  // Additive bonuses using scaling factor (lower GitHub scores get larger bonuses)
  const scalingFactor = 1 + (100 - githubOverall) / 100; // 1.0 to 2.0
  const npmWeight = 8; // Max 8 points at scale 1.0 (max 16 at scale 2.0)
  const soWeight = 8; // Max 8 points at scale 1.0 (max 16 at scale 2.0)

  const npmBonus = publishingResult
    ? (publishingResult.score / 100) * npmWeight * scalingFactor
    : 0;
  const soBonus = knowledgeResult
    ? (knowledgeResult.score / 100) * soWeight * scalingFactor
    : 0;

  const overall = Math.min(100, Math.round(githubOverall + npmBonus + soBonus));

  // 7. Badges
  const activeRepos = repositories.filter((r) => !r.isArchived);
  const badges = calculateBadges({
    externalContributions,
    activeOrgsCount: orgResult.activeCount,
    totalStarsCount,
    totalNpmDownloads,
    npmUser,
    stackoverflowUser,
  });

  // 8. Evidence & Factors
  const evidenceInputs = {
    activeRepos,
    allRepos: repositories,
    externalContributions,
    organizations,
    contributorBreakdown: contributorResult.breakdown,
    maintainerScore: maintainerResult.score,
    sustainedCount: maintainerResult.sustainedCount,
    totalStarsCount,
    totalForksCount,
    totalNpmDownloads,
    soReputation: soRep,
    npmUser,
    stackoverflowUser,
  };

  const evidence = generateEvidence(evidenceInputs);
  const factors = generateFactors(evidenceInputs);

  // 9. Skills
  const skills = calculateSkills({
    repositories,
    externalContributions,
    npmUser,
    stackoverflowUser,
  });

  return {
    overall,
    maintainer: maintainerResult.score,
    contributor: contributorResult.score,
    organization: organizationScore,
    influence: influenceResult.score,
    confidence,
    evidence,
    factors,
    badges,
    skills,
  };
};
