import type { NormalizedContribution } from "@ossintel/github-normalizer";
import type {
  IdentityScores,
  IdentityScoringInputs,
  RepositoryScores,
  ScoringInputs,
  TopicExpertise,
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
  // Throttling/rate-limit fallback: estimate contributor base from stargazers if empty
  const contributorsCount =
    contributors && contributors.length > 0
      ? contributors.length
      : Math.max(
          1,
          Math.min(100, Math.floor(Math.sqrt(repository.stargazersCount))),
        );
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

  // Throttling/rate-limit fallback: estimate contributor base from stargazers if empty
  const contributorCount =
    contributors && contributors.length > 0
      ? contributors.length
      : Math.max(
          1,
          Math.min(100, Math.floor(Math.sqrt(repository.stargazersCount))),
        );
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

const TOPIC_MAPPINGS: Record<string, string[]> = {
  React: ["react", "reactjs", "jsx", "react-dom", "remix", "nextjs", "next.js"],
  TypeScript: ["typescript", "ts"],
  "Node.js": [
    "nodejs",
    "node",
    "express",
    "koa",
    "npm",
    "yarn",
    "pnpm",
    "nest",
    "nestjs",
  ],
  JavaScript: ["javascript", "js", "ecmascript"],
  Python: ["python", "py", "django", "flask", "fastapi", "numpy", "pandas"],
  Rust: ["rust", "cargo", "wasm-bindgen"],
  "Next.js": ["nextjs", "next.js"],
  Vue: ["vue", "vuejs", "nuxt", "nuxtjs"],
  Docker: ["docker", "kubernetes", "k8s", "devops", "aws", "gcp"],
  Database: [
    "sql",
    "postgres",
    "postgresql",
    "mysql",
    "mongodb",
    "redis",
    "sqlite",
    "prisma",
  ],
  CSS: ["css", "sass", "scss", "tailwind", "tailwindcss", "postcss"],
};

const matchTopic = (nameOrTopic: string): string | null => {
  const normalized = nameOrTopic.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [category, keywords] of Object.entries(TOPIC_MAPPINGS)) {
    if (category.toLowerCase() === normalized) return category;
    for (const kw of keywords) {
      if (kw.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized) {
        return category;
      }
    }
  }
  return null;
};

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
  const totalNpmDownloads = npmUser?.totalWeeklyDownloads ?? 0;
  const soRep = stackoverflowUser?.reputation ?? 0;

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

  // 1. Maintainer Score (What you build)
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

    const weight = Math.log10(repo.stargazersCount + repo.forksCount + 1) + 1;
    weightedHealthSum += repoHealth * weight;
    totalWeight += weight;
  }

  const githubMaintainer =
    totalWeight > 0 ? Math.round(weightedHealthSum / totalWeight) : 0;

  // Add npm bonus to maintainer score (never reduces)
  let npmMaintainerBonus = 0;
  if (npmUser && totalNpmDownloads > 0) {
    npmMaintainerBonus = Math.min(
      10,
      Math.log10(totalNpmDownloads + 1) * 1.5 + 2,
    );
  }
  const maintainer = Math.min(
    100,
    Math.round(githubMaintainer + npmMaintainerBonus),
  );

  // 2. Contributor Score (What you improve upstream)
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
  const contributorBreakdown: Array<{ repo: string; points: number }> = [];

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
    contributorBreakdown.push({ repo: repoName, points: repoPoints });
  }

  const contributor = Math.min(100, totalContributorPoints);

  // 3. Organization Leadership (What you lead)
  const activeOrgs = organizations.filter(
    (o) => (o.publicRepos || 0) > 0 || (o.followers || 0) > 0,
  );
  const activeOrgsCount = activeOrgs.length;

  let orgLeadershipSum = 0;
  for (const org of activeOrgs) {
    const orgStars = org.stars || 0;
    const orgFollowers = org.followers || 0;
    const orgRepos = org.publicRepos || 0;
    const orgWeight = Math.log10(orgFollowers + orgRepos + orgStars + 1) * 8;
    orgLeadershipSum += orgWeight;
  }

  const organizationScore = Math.min(
    100,
    Math.round(activeOrgsCount * 20 + orgLeadershipSum),
  );

  // 4. Influence Score (Downstream reach)
  const starWeight = Math.log10(totalStarsCount + 1) * 20;
  const forkWeight = Math.log10(totalForksCount + 1) * 20;
  const githubInfluence = Math.min(100, Math.round(starWeight + forkWeight));

  let npmInfluenceBonus = 0;
  if (npmUser) {
    npmInfluenceBonus = Math.min(15, Math.log10(totalNpmDownloads + 1) * 2.5);
  }

  let soInfluenceBonus = 0;
  if (stackoverflowUser) {
    soInfluenceBonus = Math.min(15, Math.log10(soRep + 1) * 2.5);
  }

  const influence = Math.min(
    100,
    Math.round(githubInfluence + npmInfluenceBonus + soInfluenceBonus),
  );

  // 5. Confidence Score
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

  // 6. Overall Reputation Score (GitHub-first + Additive Evidence Bonuses)
  let githubOverall = 0;
  if (activeOrgsCount > 0) {
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

  // Compute npm reputation score (0-100)
  let npmReputationScore = 0;
  if (npmUser) {
    const downloadScore = Math.min(100, Math.log10(totalNpmDownloads + 1) * 15);
    const packageScore = Math.min(100, npmUser.activePackagesCount * 10);
    const verifiedScore = npmUser.isVerifiedPublisher ? 100 : 0;
    npmReputationScore = Math.min(
      100,
      Math.round(
        downloadScore * 0.5 + packageScore * 0.3 + verifiedScore * 0.2,
      ),
    );
  }

  // Compute Stack Overflow reputation score (0-100)
  let soReputationScore = 0;
  if (stackoverflowUser) {
    const repScore = Math.min(100, Math.log10(soRep + 1) * 20);
    const answerScore = Math.min(100, stackoverflowUser.answerCount * 2);
    const acceptScore = stackoverflowUser.acceptanceRate || 0;
    soReputationScore = Math.min(
      100,
      Math.round(repScore * 0.5 + answerScore * 0.3 + acceptScore * 0.2),
    );
  }

  const scalingFactor = 1 + (100 - githubOverall) / 100; // ranges from 1.0 to 2.0
  const npmWeight = 8; // Max 8 points at scale 1.0 (max 16 at scale 2.0)
  const soWeight = 8; // Max 8 points at scale 1.0 (max 16 at scale 2.0)

  const npmBonus = npmUser
    ? (npmReputationScore / 100) * npmWeight * scalingFactor
    : 0;
  const soBonus = stackoverflowUser
    ? (soReputationScore / 100) * soWeight * scalingFactor
    : 0;

  const overall = Math.min(100, Math.round(githubOverall + npmBonus + soBonus));

  // 7. Generic Badge Checks
  const badges: string[] = [];
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

  // 8. Factual Evidence List
  const maintainerEvidence = [
    `${activeRepos.length} active repositories`,
    `${maintainer}% average repository health`,
  ];
  if (sustainedCount > 0) {
    maintainerEvidence.push(`${sustainedCount} sustained maintenance projects`);
  }
  if (activeRepos.length > 0) {
    const flagship = [...activeRepos].sort(
      (a, b) => b.stargazersCount - a.stargazersCount,
    )[0];
    maintainerEvidence.push(`Flagship project: ${flagship.name}`);
  }

  const contributorEvidence = [`${totalPRsCount} merged pull requests`];
  if (contributorBreakdown.length > 0) {
    const topUpstream = [...contributorBreakdown].sort(
      (a, b) => b.points - a.points,
    )[0];
    contributorEvidence.push(`Top upstream: ${topUpstream.repo}`);
  }
  if (totalPRsCount > 0) {
    const code = externalContributions.filter((c) => c.type === "code").length;
    const docs = externalContributions.filter((c) => c.type === "docs").length;
    const test = externalContributions.filter((c) => c.type === "test").length;
    contributorEvidence.push(
      `Classified: ${code} code, ${docs} docs, ${test} tests`,
    );
  }

  const influenceEvidence = [
    `${totalStarsCount.toLocaleString()} total stargazers`,
    `${totalForksCount.toLocaleString()} repository forks`,
  ];
  if (totalNpmDownloads > 0) {
    influenceEvidence.push(
      `${totalNpmDownloads.toLocaleString()} weekly npm downloads`,
    );
  }
  if (soRep > 0) {
    influenceEvidence.push(
      `Stack Overflow reputation: ${soRep.toLocaleString()}`,
    );
  }

  const orgEvidence = [
    `${activeOrgsCount} managed organizations`,
    `${organizations.reduce((acc, o) => acc + (o.publicRepos || 0), 0)} collective repositories`,
  ];
  const totalOrgFollowers = organizations.reduce(
    (acc, o) => acc + (o.followers || 0),
    0,
  );
  if (totalOrgFollowers > 0) {
    orgEvidence.push(
      `${totalOrgFollowers.toLocaleString()} total organization followers`,
    );
  }

  const evidence = {
    maintainer: maintainerEvidence,
    contributor: contributorEvidence,
    influence: influenceEvidence,
    organization: orgEvidence,
  };

  // 9. Positive/Negative Factors
  const maintainerFactors: string[] = [];
  const contributorFactors: string[] = [];
  const influenceFactors: string[] = [];
  const orgFactors: string[] = [];

  if (maintainer >= 80) {
    maintainerFactors.push("Active flagship projects with excellent health");
  }
  if (sustainedCount > 0) {
    maintainerFactors.push("Sustained long-term repository maintenance");
  }
  const archived = repositories.filter((r) => r.isArchived).length;
  if (archived > 0) {
    maintainerFactors.push("Some repositories are archived/inactive");
  }
  if (maintainerFactors.length === 0) {
    maintainerFactors.push("Moderate repository activity and health");
  }

  if (totalPRsCount > 0) {
    contributorFactors.push(`+ ${totalPRsCount} merged pull requests`);
  }
  if (contributedToCore) {
    contributorFactors.push("+ PRs merged into high-importance frameworks");
  }
  const topUpstreamRepo = contributorBreakdown.sort(
    (a, b) => b.points - a.points,
  )[0];
  if (
    topUpstreamRepo &&
    (repoPRsMap[topUpstreamRepo.repo]?.prs.length || 0) > 2
  ) {
    contributorFactors.push(
      `+ Repeat contributor bonus for ${topUpstreamRepo.repo}`,
    );
  }
  if (totalPRsCount === 0) {
    contributorFactors.push("- No external repository contributions found");
  } else {
    const hasRecentContrib = externalContributions.some(
      (c) =>
        (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24) <
        90,
    );
    if (!hasRecentContrib) {
      contributorFactors.push("- No recent upstream activity (past 90 days)");
    }
  }

  if (totalStarsCount >= 500) {
    influenceFactors.push(
      `+ High community interest (${totalStarsCount} stars)`,
    );
  }
  if (totalNpmDownloads >= 10000) {
    influenceFactors.push(
      `+ Strong download footprint (${totalNpmDownloads.toLocaleString()} weekly downloads)`,
    );
  }
  if (soRep >= 1000) {
    influenceFactors.push(
      `+ High developer authority (${soRep.toLocaleString()} Stack Overflow reputation)`,
    );
  }
  if (!stackoverflowUser) {
    influenceFactors.push("- No Stack Overflow activity linked");
  }
  if (influenceFactors.length === 0) {
    influenceFactors.push("Growing library adoption and ecosystem footprint");
  }

  if (activeOrgsCount > 0) {
    orgFactors.push(`+ Active leadership in ${activeOrgsCount} organizations`);
  }
  if (totalOrgFollowers > 100) {
    orgFactors.push(
      `+ High organization follower presence (${totalOrgFollowers})`,
    );
  }
  if (activeOrgsCount === 0) {
    orgFactors.push("- No active organization leadership detected");
  }

  const factors = {
    maintainer: maintainerFactors,
    contributor: contributorFactors,
    influence: influenceFactors,
    organization: orgFactors,
  };

  // 10. Compute Skills Topic Expertise
  const skillsMap: Record<string, TopicExpertise["evidence"]> = {};
  for (const cat of Object.keys(TOPIC_MAPPINGS)) {
    skillsMap[cat] = {
      githubStars: 0,
      githubPrs: 0,
      npmDownloads: 0,
      npmPackages: 0,
      stackoverflowScore: 0,
      stackoverflowAnswers: 0,
    };
  }

  // Aggregate GitHub Repo metrics
  for (const repo of repositories) {
    const topicsToScan = [repo.language, ...(repo.topics || [])].filter(
      Boolean,
    ) as string[];
    const matchedCats = new Set<string>();
    for (const t of topicsToScan) {
      const cat = matchTopic(t);
      if (cat) matchedCats.add(cat);
    }
    for (const cat of matchedCats) {
      skillsMap[cat].githubStars += repo.stargazersCount;
    }
  }

  // Aggregate GitHub PR metrics
  for (const c of externalContributions) {
    const searchStr = `${c.repoFullName} ${c.title} ${c.labels.join(" ")}`;
    const matchedCats = new Set<string>();
    // Try scanning for matching keywords directly
    for (const [cat, keywords] of Object.entries(TOPIC_MAPPINGS)) {
      for (const kw of keywords) {
        if (new RegExp(`\\b${kw}\\b`, "i").test(searchStr)) {
          matchedCats.add(cat);
        }
      }
    }
    for (const cat of matchedCats) {
      skillsMap[cat].githubPrs += 1;
    }
  }

  // Aggregate npm package metrics
  if (npmUser?.packages) {
    for (const pkg of npmUser.packages) {
      const searchStr = `${pkg.name} ${pkg.description || ""} ${pkg.categories.join(" ")}`;
      const matchedCats = new Set<string>();
      for (const [cat, keywords] of Object.entries(TOPIC_MAPPINGS)) {
        for (const kw of keywords) {
          if (new RegExp(`\\b${kw}\\b`, "i").test(searchStr)) {
            matchedCats.add(cat);
          }
        }
      }
      for (const cat of matchedCats) {
        skillsMap[cat].npmPackages += 1;
        skillsMap[cat].npmDownloads += pkg.weeklyDownloads;
      }
    }
  }

  // Aggregate StackOverflow tag metrics
  if (stackoverflowUser?.topTags) {
    for (const tag of stackoverflowUser.topTags) {
      const cat = matchTopic(tag.name);
      if (cat) {
        skillsMap[cat].stackoverflowScore += tag.score;
        skillsMap[cat].stackoverflowAnswers += tag.count;
      }
    }
  }

  // Calculate final dynamic skill scores
  const skills: TopicExpertise[] = [];
  for (const [topic, ev] of Object.entries(skillsMap)) {
    const githubStarsWeight = Math.min(40, Math.log10(ev.githubStars + 1) * 10);
    const githubPrsWeight = Math.min(25, ev.githubPrs * 2.5);
    const npmPackagesWeight = Math.min(20, ev.npmPackages * 5);
    const npmDownloadsWeight = Math.min(
      30,
      Math.log10(ev.npmDownloads + 1) * 5,
    );
    const soScoreWeight = Math.min(
      35,
      Math.log10(ev.stackoverflowScore + 1) * 10,
    );
    const soAnswersWeight = Math.min(25, ev.stackoverflowAnswers * 0.5);

    const rawScore =
      githubStarsWeight +
      githubPrsWeight +
      npmPackagesWeight +
      npmDownloadsWeight +
      soScoreWeight +
      soAnswersWeight;
    const score = Math.round(Math.min(100, rawScore));

    if (score > 0) {
      skills.push({
        topic,
        score,
        evidence: ev,
      });
    }
  }
  skills.sort((a, b) => b.score - a.score);

  return {
    overall,
    maintainer,
    contributor,
    organization: organizationScore,
    influence,
    confidence,
    evidence,
    factors,
    badges,
    skills,
  };
};
