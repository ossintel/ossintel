import type { NormalizedContribution } from "@ossintel/github-normalizer";
import type { NormalizedNpmUser } from "@ossintel/npm";
import type { NormalizedStackOverflowUser } from "@ossintel/stackoverflow";
import type {
  IdentityScoringInputs,
  PillarEvidence,
  PillarFactors,
} from "./types";

interface EvidenceInputs {
  activeRepos: IdentityScoringInputs["repositories"];
  allRepos: IdentityScoringInputs["repositories"];
  externalContributions: NormalizedContribution[];
  organizations: NonNullable<IdentityScoringInputs["organizations"]>;
  contributorBreakdown: Array<{ repo: string; points: number }>;
  maintainerScore: number;
  sustainedCount: number;
  totalStarsCount: number;
  totalForksCount: number;
  totalNpmDownloads: number;
  soReputation: number;
  npmUser?: NormalizedNpmUser | null;
  stackoverflowUser?: NormalizedStackOverflowUser | null;
}

/** Generate factual evidence lists for each identity pillar. */
export const generateEvidence = (inputs: EvidenceInputs): PillarEvidence => {
  const {
    activeRepos,
    externalContributions,
    organizations,
    contributorBreakdown,
    maintainerScore,
    sustainedCount,
    totalStarsCount,
    totalForksCount,
    totalNpmDownloads,
    soReputation,
  } = inputs;

  const maintainer = [
    `${activeRepos.length} active repositories`,
    `${maintainerScore}% average repository health`,
  ];
  if (sustainedCount > 0) {
    maintainer.push(`${sustainedCount} sustained maintenance projects`);
  }
  if (activeRepos.length > 0) {
    const flagship = [...activeRepos].sort(
      (a, b) => b.stargazersCount - a.stargazersCount,
    )[0];
    maintainer.push(`Flagship project: ${flagship.name}`);
  }

  const totalPRsCount = externalContributions.length;
  const contributor = [`${totalPRsCount} merged pull requests`];
  if (contributorBreakdown.length > 0) {
    const topUpstream = [...contributorBreakdown].sort(
      (a, b) => b.points - a.points,
    )[0];
    contributor.push(`Top upstream: ${topUpstream.repo}`);
  }
  if (totalPRsCount > 0) {
    const code = externalContributions.filter((c) => c.type === "code").length;
    const docs = externalContributions.filter((c) => c.type === "docs").length;
    const test = externalContributions.filter((c) => c.type === "test").length;
    contributor.push(`Classified: ${code} code, ${docs} docs, ${test} tests`);
  }

  const influence = [
    `${totalStarsCount.toLocaleString()} total stargazers`,
    `${totalForksCount.toLocaleString()} repository forks`,
  ];
  if (totalNpmDownloads > 0) {
    influence.push(
      `${totalNpmDownloads.toLocaleString()} weekly npm downloads`,
    );
  }
  if (soReputation > 0) {
    influence.push(
      `Stack Overflow reputation: ${soReputation.toLocaleString()}`,
    );
  }

  const activeOrgsCount = organizations.filter(
    (o) => (o.publicRepos || 0) > 0 || (o.followers || 0) > 0,
  ).length;
  const organization = [
    `${activeOrgsCount} managed organizations`,
    `${organizations.reduce((acc, o) => acc + (o.publicRepos || 0), 0)} collective repositories`,
  ];
  const totalOrgFollowers = organizations.reduce(
    (acc, o) => acc + (o.followers || 0),
    0,
  );
  if (totalOrgFollowers > 0) {
    organization.push(
      `${totalOrgFollowers.toLocaleString()} total organization followers`,
    );
  }

  return { maintainer, contributor, influence, organization };
};

/** Generate positive/negative factor descriptions for each identity pillar. */
export const generateFactors = (inputs: EvidenceInputs): PillarFactors => {
  const {
    allRepos,
    externalContributions,
    organizations,
    contributorBreakdown,
    maintainerScore,
    sustainedCount,
    totalStarsCount,
    totalNpmDownloads,
    soReputation,
    stackoverflowUser,
  } = inputs;

  const totalPRsCount = externalContributions.length;
  const contributedToCore = externalContributions.some(
    (c) => c.targetRepoStars >= 20000,
  );

  // Maintainer factors
  const maintainer: string[] = [];
  if (maintainerScore >= 80) {
    maintainer.push("Active flagship projects with excellent health");
  }
  if (sustainedCount > 0) {
    maintainer.push("Sustained long-term repository maintenance");
  }
  const archived = allRepos.filter((r) => r.isArchived).length;
  if (archived > 0) {
    maintainer.push("Some repositories are archived/inactive");
  }
  if (maintainer.length === 0) {
    maintainer.push("Moderate repository activity and health");
  }

  // Contributor factors
  const contributor: string[] = [];
  if (totalPRsCount > 0) {
    contributor.push(`+ ${totalPRsCount} merged pull requests`);
  }
  if (contributedToCore) {
    contributor.push("+ PRs merged into high-importance frameworks");
  }
  const sortedBreakdown = [...contributorBreakdown].sort(
    (a, b) => b.points - a.points,
  );
  const topUpstreamRepo = sortedBreakdown[0];
  if (topUpstreamRepo) {
    // Check if they contributed multiple PRs to the top repo
    const topRepoPRCount = externalContributions.filter(
      (c) => c.repoFullName === topUpstreamRepo.repo,
    ).length;
    if (topRepoPRCount > 2) {
      contributor.push(
        `+ Repeat contributor bonus for ${topUpstreamRepo.repo}`,
      );
    }
  }
  if (totalPRsCount === 0) {
    contributor.push("- No external repository contributions found");
  } else {
    const hasRecentContrib = externalContributions.some(
      (c) =>
        (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24) <
        90,
    );
    if (!hasRecentContrib) {
      contributor.push("- No recent upstream activity (past 90 days)");
    }
  }

  // Influence factors
  const influence: string[] = [];
  if (totalStarsCount >= 500) {
    influence.push(`+ High community interest (${totalStarsCount} stars)`);
  }
  if (totalNpmDownloads >= 10000) {
    influence.push(
      `+ Strong download footprint (${totalNpmDownloads.toLocaleString()} weekly downloads)`,
    );
  }
  if (soReputation >= 1000) {
    influence.push(
      `+ High developer authority (${soReputation.toLocaleString()} Stack Overflow reputation)`,
    );
  }
  if (!stackoverflowUser) {
    influence.push("- No Stack Overflow activity linked");
  }
  if (influence.length === 0) {
    influence.push("Growing library adoption and ecosystem footprint");
  }

  // Organization factors
  const activeOrgsCount = organizations.filter(
    (o) => (o.publicRepos || 0) > 0 || (o.followers || 0) > 0,
  ).length;
  const totalOrgFollowers = organizations.reduce(
    (acc, o) => acc + (o.followers || 0),
    0,
  );
  const organization: string[] = [];
  if (activeOrgsCount > 0) {
    organization.push(
      `+ Active leadership in ${activeOrgsCount} organizations`,
    );
  }
  if (totalOrgFollowers > 100) {
    organization.push(
      `+ High organization follower presence (${totalOrgFollowers})`,
    );
  }
  if (activeOrgsCount === 0) {
    organization.push("- No active organization leadership detected");
  }

  return { maintainer, contributor, influence, organization };
};
