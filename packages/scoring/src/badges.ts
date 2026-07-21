import type { NormalizedContribution } from "@ossintel/github-normalizer";
import type { NormalizedNpmUser } from "@ossintel/npm";
import type { NormalizedStackOverflowUser } from "@ossintel/stackoverflow";

interface BadgeInputs {
  externalContributions: NormalizedContribution[];
  activeOrgsCount: number;
  totalStarsCount: number;
  totalNpmDownloads: number;
  npmUser?: NormalizedNpmUser | null;
  stackoverflowUser?: NormalizedStackOverflowUser | null;
}

/** Compute achievement badges based on cross-platform activity. */
export const calculateBadges = (inputs: BadgeInputs): string[] => {
  const {
    externalContributions,
    activeOrgsCount,
    totalStarsCount,
    totalNpmDownloads,
    npmUser,
    stackoverflowUser,
  } = inputs;

  const badges: string[] = [];
  const soRep = stackoverflowUser?.reputation ?? 0;
  const totalPRsCount = externalContributions.length;

  const contributedToCore = externalContributions.some(
    (c) => c.targetRepoStars >= 20000,
  );
  if (contributedToCore) {
    badges.push("Framework Contributor");
  }
  if (activeOrgsCount >= 1) {
    badges.push("OSS Founder");
  }
  if (npmUser?.packages && npmUser.packages.length >= 1) {
    badges.push("Package Publisher");
  }
  if (soRep >= 10000) {
    badges.push("StackOverflow Elite");
  }
  if (stackoverflowUser && stackoverflowUser.answerCount >= 100) {
    badges.push("Community Helper");
  }
  if (
    stackoverflowUser &&
    stackoverflowUser.acceptanceRate >= 80 &&
    stackoverflowUser.answerCount >= 10
  ) {
    badges.push("High Acceptance");
  }

  const testPRsCount = externalContributions.filter(
    (c) => c.type === "test",
  ).length;
  if (testPRsCount >= 5) {
    badges.push("Test Champion");
  }
  const securityPR = externalContributions.some((c) =>
    /\b(security|vuln|cve|fix|patch)\b/i.test(c.title),
  );
  if (securityPR) {
    badges.push("Security Champion");
  }
  if (totalPRsCount >= 15) {
    badges.push("Prodigious Contributor");
  }
  if (totalStarsCount >= 1000) {
    badges.push("1k Stars Earned");
  }
  if (totalNpmDownloads >= 1000000) {
    badges.push("1M npm Downloads");
  }

  return badges;
};
