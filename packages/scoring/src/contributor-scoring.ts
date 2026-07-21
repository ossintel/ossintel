import type { NormalizedContribution } from "@ossintel/github-normalizer";

export interface ContributorResult {
  /** Final contributor score (0-100). */
  score: number;
  /** Per-repo breakdown of earned points. */
  breakdown: Array<{ repo: string; points: number }>;
}

/**
 * Calculate the contributor pillar score from external (upstream) PRs.
 *
 * Quality-weighted scoring: PR type (code/docs/test/chore) and target
 * repository importance (star count) determine point allocation.
 */
export const calculateContributorScore = (
  externalContributions: NormalizedContribution[],
): ContributorResult => {
  const repoPRsMap: Record<
    string,
    {
      repoFullName: string;
      prs: NormalizedContribution[];
      stars: number;
    }
  > = {};

  for (const c of externalContributions) {
    if (!repoPRsMap[c.repoFullName]) {
      repoPRsMap[c.repoFullName] = {
        repoFullName: c.repoFullName,
        prs: [],
        stars: c.targetRepoStars || 0,
      };
    }
    repoPRsMap[c.repoFullName].prs.push(c);
  }

  let totalContributorPoints = 0;
  const breakdown: Array<{ repo: string; points: number }> = [];

  for (const repoName of Object.keys(repoPRsMap)) {
    const item = repoPRsMap[repoName];
    const { prs, stars } = item;

    const importance = Math.log10(stars + 1) / 4;
    const cap = 20 + Math.round(Math.min(1.0, importance) * 20);

    const sortedPRs = [...prs].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const firstPR = sortedPRs[0];
    let qualityMultiplier = 1.0;
    if (firstPR.type === "docs") qualityMultiplier = 0.4;
    else if (firstPR.type === "test") qualityMultiplier = 1.2;
    else if (firstPR.type === "chore") qualityMultiplier = 0.5;

    let basePoints = Math.min(1.0, importance) * qualityMultiplier * 15;
    basePoints = basePoints + Math.max(0, importance - 1.0) * 10;

    let subsequentPoints = 0;
    for (let i = 1; i < sortedPRs.length; i++) {
      const pr = sortedPRs[i];
      let subQual = 1.0;
      if (pr.type === "docs") subQual = 0.4;
      else if (pr.type === "test") subQual = 1.2;
      else if (pr.type === "chore") subQual = 0.5;
      subsequentPoints += subQual * 5;
    }
    subsequentPoints = subsequentPoints * 0.5;

    const repoPoints = Math.min(cap, Math.round(basePoints + subsequentPoints));
    totalContributorPoints += repoPoints;
    breakdown.push({ repo: repoName, points: repoPoints });
  }

  const score = Math.min(100, totalContributorPoints);

  return { score, breakdown };
};
