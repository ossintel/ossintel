import type { IdentityScoringInputs } from "./types";

export interface OrganizationResult {
  /** Final organization leadership score (0-100). */
  score: number;
  /** Number of active organizations. */
  activeCount: number;
}

/** Calculate the organization leadership pillar score. */
export const calculateOrganizationScore = (
  organizations: NonNullable<IdentityScoringInputs["organizations"]>,
): OrganizationResult => {
  const activeOrgs = organizations.filter(
    (o) => (o.publicRepos || 0) > 0 || (o.followers || 0) > 0,
  );
  const activeCount = activeOrgs.length;

  let orgLeadershipSum = 0;
  for (const org of activeOrgs) {
    const orgStars = org.stars || 0;
    const orgFollowers = org.followers || 0;
    const orgRepos = org.publicRepos || 0;
    const orgWeight = Math.log10(orgFollowers + orgRepos + orgStars + 1) * 8;
    orgLeadershipSum += orgWeight;
  }

  const score = Math.min(100, Math.round(activeCount * 20 + orgLeadershipSum));

  return { score, activeCount };
};
