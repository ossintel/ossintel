import type { NormalizedRepository } from "@ossintel/github-normalizer";
import type {
  IdentityScores,
  RepositoryScores,
  ScoringInputs,
} from "@ossintel/scoring";
import {
  ACTIVITY_HIGH_THRESHOLD,
  ACTIVITY_LOW_THRESHOLD,
  COMMUNITY_LOW_THRESHOLD,
  COMMUNITY_STRONG_THRESHOLD,
  HEALTH_EXCELLENT_THRESHOLD,
  HEALTH_POOR_THRESHOLD,
  IMPACT_HIGH_THRESHOLD,
  IMPACT_LOW_THRESHOLD,
  MAX_DISPLAYED_LACKING_TYPES_PACKAGES,
  MAX_DISPLAYED_TOP_SKILLS,
  PORTFOLIO_HEALTH_THRESHOLD,
  PORTFOLIO_INFLUENCE_THRESHOLD,
  PORTFOLIO_RISK_THRESHOLD,
  RISK_HIGH_THRESHOLD,
  RISK_LOW_THRESHOLD,
  SKILL_EXPERTISE_THRESHOLD,
  SO_ACCEPTANCE_RATE_THRESHOLD,
  SO_ANSWER_COUNT_THRESHOLD,
} from "./constants";
import type {
  Finding,
  IdentityInsights,
  IdentityMetadata,
  PromptContext,
  Recommendation,
  RepositoryInsights,
} from "./types";

const formatPromptContext = (
  summary: string,
  scoresText: string,
  metricsText: string,
  findings: Finding[],
  recommendations: Recommendation[],
  includeScoreInFindings: boolean,
): PromptContext => {
  const findingsText = [
    "### Findings",
    ...findings.map((f) => {
      const scorePart = includeScoreInFindings
        ? ` (Score: ${f.score ?? "N/A"})`
        : "";
      return `- [${f.type.toUpperCase()}] (${f.category}): **${f.title}**${scorePart} - ${f.description}`;
    }),
  ].join("\n");

  const recommendationsText = [
    "### Recommendations",
    ...recommendations.map(
      (r) =>
        `- [Priority: ${r.priority.toUpperCase()}] (${r.category}) **${r.title}**: ${r.description}`,
    ),
  ].join("\n");

  return {
    summary,
    scoresText,
    metricsText,
    findingsText,
    recommendationsText,
  };
};

export const generateInsights = (
  inputs: ScoringInputs,
  scores: RepositoryScores,
): RepositoryInsights => {
  const { repository, contributors, releases } = inputs;
  const findings: Finding[] = [];
  const recommendations: Recommendation[] = [];

  // 1. Risk Rules
  if (scores.risk > RISK_HIGH_THRESHOLD) {
    findings.push({
      id: "risk_high",
      type: "warning",
      category: "risk",
      title: "High Maintenance Risk",
      description:
        "This project has signs of high maintenance risk due to inactivity, a low number of contributors, or a large open issues backlog relative to its community size.",
      score: scores.risk,
    });
    recommendations.push({
      id: "risk_high_mitigate",
      category: "risk",
      title: "Expand Contributor Pool & Address Backlog",
      description:
        "Encourage more contributors to join the maintenance team and actively triage or close older open issues to reduce project risk.",
      priority: "high",
    });
  } else if (scores.risk < RISK_LOW_THRESHOLD) {
    findings.push({
      id: "risk_low",
      type: "highlight",
      category: "risk",
      title: "Low Risk Profile",
      description:
        "The project has a very low risk profile, exhibiting strong maintenance practices and an active developer base.",
      score: scores.risk,
    });
  }

  // 2. Activity Rules
  if (scores.activity < ACTIVITY_LOW_THRESHOLD) {
    findings.push({
      id: "activity_low",
      type: "warning",
      category: "activity",
      title: "Negligible Update Activity",
      description:
        "No recent updates or releases have been published for this project, indicating it might be abandoned or in deep maintenance mode.",
      score: scores.activity,
    });
    recommendations.push({
      id: "activity_low_resume",
      category: "activity",
      title: "Publish Staged Work",
      description:
        "If there are staged changes, publish a new release tag to signal to consumers that the project is still actively watched.",
      priority: "medium",
    });
  } else if (scores.activity > ACTIVITY_HIGH_THRESHOLD) {
    findings.push({
      id: "activity_high",
      type: "highlight",
      category: "activity",
      title: "Vibrantly Active",
      description:
        "Frequent code updates and release cycles show highly active ongoing development.",
      score: scores.activity,
    });
  }

  // 3. Health Rules
  if (scores.health < HEALTH_POOR_THRESHOLD) {
    findings.push({
      id: "health_poor",
      type: "warning",
      category: "health",
      title: "Neglected Issue Backlog",
      description:
        "A substantial volume of open issues relative to project size indicates difficulty in addressing bug reports or feature requests.",
      score: scores.health,
    });
    recommendations.push({
      id: "health_triage",
      category: "health",
      title: "Setup Issue Triage Workflow",
      description:
        "Introduce stale-issue automation or setup dedicated triaging guidelines to systematically address the issue backlog.",
      priority: "high",
    });
  } else if (scores.health > HEALTH_EXCELLENT_THRESHOLD) {
    findings.push({
      id: "health_excellent",
      type: "highlight",
      category: "health",
      title: "Healthy Codebase Maintenance",
      description:
        "The codebase is healthy with a minimal issue backlog relative to popularity and an active maintenance schedule.",
      score: scores.health,
    });
  }

  // 4. Impact Rules
  if (scores.impact > IMPACT_HIGH_THRESHOLD) {
    findings.push({
      id: "impact_high",
      type: "highlight",
      category: "impact",
      title: "High Adoption & Popularity",
      description:
        "This project has achieved high popularity and critical adoption within the open-source ecosystem.",
      score: scores.impact,
    });
  } else if (scores.impact < IMPACT_LOW_THRESHOLD) {
    findings.push({
      id: "impact_low",
      type: "highlight",
      category: "impact",
      title: "Early Stage or Niche Reach",
      description:
        "The project currently has low visibility or serves a highly specialized niche community.",
      score: scores.impact,
    });
    recommendations.push({
      id: "impact_promote",
      category: "impact",
      title: "Improve Visibility & Outreach",
      description:
        "Publish clear quickstart documentation, share the library in community channels, and add tags to boost discoverability.",
      priority: "low",
    });
  }

  // 5. Community Rules
  if (scores.community < COMMUNITY_LOW_THRESHOLD) {
    findings.push({
      id: "community_small",
      type: "warning",
      category: "community",
      title: "Lacking Community Infrastructure",
      description:
        "The project has a very small contributor pool and lacks rich metadata options (like homepage, topics, or description).",
      score: scores.community,
    });
    recommendations.push({
      id: "community_metadata",
      category: "community",
      title: "Add Repository Metadata",
      description:
        "Add descriptive topics, homepage links, and a concise description in repository settings to encourage outside contribution.",
      priority: "medium",
    });
  } else if (scores.community > COMMUNITY_STRONG_THRESHOLD) {
    findings.push({
      id: "community_strong",
      type: "highlight",
      category: "community",
      title: "Strong Contributor Community",
      description:
        "Backed by an engaging contributor base and clean documentation, showing strong community interest.",
      score: scores.community,
    });
  }

  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(now.getFullYear() - 1);
  const recentReleases = releases
    ? releases.filter(
        (r) => r.publishedAt && new Date(r.publishedAt) >= oneYearAgo,
      ).length
    : 0;

  const summary = `OSSIntel analysis report for repository ${repository.fullName}. Calculated Overall score is ${scores.overall}/100.`;

  const scoresText = [
    "### Calculated Scores",
    `- Overall Score: ${scores.overall}/100`,
    `- Health Score: ${scores.health}/100`,
    `- Impact Score: ${scores.impact}/100`,
    `- Activity Score: ${scores.activity}/100`,
    `- Community Score: ${scores.community}/100`,
    `- Risk Score: ${scores.risk}/100 (where 100 is highest risk)`,
  ].join("\n");

  const metricsText = [
    "### Raw Metrics & Metadata",
    `- Name: ${repository.name}`,
    `- Owner: ${repository.owner.login}`,
    `- Stars: ${repository.stargazersCount}`,
    `- Watchers: ${repository.watchersCount}`,
    `- Forks: ${repository.forksCount}`,
    `- Open Issues: ${repository.openIssuesCount}`,
    `- Language: ${repository.language ?? "Unknown"}`,
    `- Topics: ${repository.topics.join(", ") || "None"}`,
    `- Default Branch: ${repository.defaultBranch}`,
    `- Size: ${repository.size} KB`,
    `- Contributors Count: ${contributors?.length ?? 0}`,
    `- Releases in Past Year: ${recentReleases}`,
    `- Pushed At: ${repository.pushedAt}`,
    `- Updated At: ${repository.updatedAt}`,
  ].join("\n");

  const promptContext = formatPromptContext(
    summary,
    scoresText,
    metricsText,
    findings,
    recommendations,
    true,
  );

  return {
    findings,
    recommendations,
    promptContext,
  };
};

export const generateIdentityInsights = (
  repositories: NormalizedRepository[],
  scores: IdentityScores,
  identityMetadata: IdentityMetadata,
): IdentityInsights => {
  const findings: Finding[] = [];
  const recommendations: Recommendation[] = [];

  const { npmUser = null, stackoverflowUser = null } = identityMetadata;

  const totalRepos = repositories.length;
  const archivedRepos = repositories.filter((r) => r.isArchived).length;
  const activeRepos = totalRepos - archivedRepos;

  findings.push({
    id: "identity_composition",
    type: "highlight",
    category: "community",
    title: `${identityMetadata.type === "user" ? "Maintainer" : "Organization"} Portfolio Composition`,
    description: `Analyzed a portfolio of ${totalRepos} public repositories (${activeRepos} active, ${archivedRepos} archived).`,
  });

  if (archivedRepos > 0) {
    findings.push({
      id: "archived_repos_present",
      type: "highlight",
      category: "impact",
      title: "Archived Historical Assets",
      description: `${archivedRepos} archived repositories contribute to lifetime star and fork impact, but are excluded from active maintenance metrics.`,
    });
  }

  // npm Findings
  if (npmUser) {
    findings.push({
      id: "linked_identity_npm",
      type: "highlight",
      category: "impact",
      title: "Active npm Publisher Profile",
      description: `Unified metrics include ecosystem reach from @${npmUser.username} with ${npmUser.totalWeeklyDownloads.toLocaleString()} weekly downloads across ${npmUser.packages.length} packages.`,
    });

    const deprecated = npmUser.packages.filter((p) => p.isDeprecated);
    if (deprecated.length > 0) {
      findings.push({
        id: "npm_deprecated_packages",
        type: "warning",
        category: "health",
        title: "Deprecated Packages Found",
        description: `Your npm portfolio contains ${deprecated.length} deprecated package(s). Consider archiving or directing users to newer alternatives.`,
        score: deprecated.length,
      });
      recommendations.push({
        id: "npm_clean_deprecated",
        category: "health",
        title: "Clean Up Deprecated npm Packages",
        description:
          "Review deprecated npm modules and add clear pointers on their READMEs to active packages.",
        priority: "medium",
      });
    }

    const lackingTS = npmUser.packages.filter(
      (p) => !p.isDeprecated && !p.hasTypeScript,
    );
    if (lackingTS.length > 0) {
      recommendations.push({
        id: "npm_add_typescript",
        category: "community",
        title: "Add TypeScript Declarations",
        description: `Add types to active package(s): ${lackingTS
          .slice(0, MAX_DISPLAYED_LACKING_TYPES_PACKAGES)
          .map((p) => p.name)
          .join(", ")}. Developers prefer typed libraries.`,
        priority: "low",
      });
    }
  }

  // StackOverflow Findings
  if (stackoverflowUser) {
    findings.push({
      id: "linked_identity_so",
      type: "highlight",
      category: "community",
      title: "Verified Stack Overflow Authority",
      description: `Linked Stack Overflow account has ${stackoverflowUser.reputation.toLocaleString()} reputation, ${stackoverflowUser.answerCount} answers, and ${stackoverflowUser.badgeCounts.gold} gold badges.`,
    });

    if (
      stackoverflowUser.acceptanceRate >= SO_ACCEPTANCE_RATE_THRESHOLD &&
      stackoverflowUser.answerCount >= SO_ANSWER_COUNT_THRESHOLD
    ) {
      findings.push({
        id: "so_high_acceptance",
        type: "highlight",
        category: "community",
        title: "High-Quality Answer Rate",
        description: `Stellar community contribution: ${stackoverflowUser.acceptanceRate}% of sample answers were marked as accepted by other developers.`,
      });
    }
  }

  // Topic Expertise / Skill Radar Findings
  if (scores.skills && scores.skills.length > 0) {
    const topSkills = scores.skills.slice(0, MAX_DISPLAYED_TOP_SKILLS);
    for (const skill of topSkills) {
      if (skill.score >= SKILL_EXPERTISE_THRESHOLD) {
        const evidenceParts: string[] = [];
        if (skill.evidence.githubStars > 0) {
          evidenceParts.push(`${skill.evidence.githubStars} stars`);
        }
        if (skill.evidence.githubPrs > 0) {
          evidenceParts.push(`${skill.evidence.githubPrs} PRs`);
        }
        if (skill.evidence.npmDownloads > 0) {
          evidenceParts.push(
            `${skill.evidence.npmDownloads.toLocaleString()} weekly downloads`,
          );
        }
        if (skill.evidence.stackoverflowAnswers > 0) {
          evidenceParts.push(`${skill.evidence.stackoverflowAnswers} answers`);
        }

        findings.push({
          id: `expert_${skill.topic.toLowerCase()}`,
          type: "highlight",
          category: "impact",
          title: `${skill.topic} Expert`,
          description: `Demonstrated expertise in ${skill.topic} (Score: ${skill.score}/100) backed by ${evidenceParts.join(", ")}.`,
        });
      }
    }
  }

  const riskScore = 100 - scores.maintainer;
  if (riskScore > PORTFOLIO_RISK_THRESHOLD) {
    findings.push({
      id: "identity_risk_high",
      type: "warning",
      category: "risk",
      title: "High Portfolio Maintenance Risk",
      description:
        "Average risk across active repositories is elevated, suggesting potential maintenance single points of failure.",
      score: riskScore,
    });
    recommendations.push({
      id: "identity_risk_mitigate",
      category: "risk",
      title: "Onboard Co-Maintainers",
      description:
        "Consider recruiting co-maintainers to safeguard active portfolios and decrease risk index.",
      priority: "high",
    });
  }

  if (scores.maintainer < PORTFOLIO_HEALTH_THRESHOLD) {
    findings.push({
      id: "identity_health_low",
      type: "warning",
      category: "health",
      title: "Neglected Portfolio Issue Backlog",
      description:
        "Active repositories exhibit a significant open issue backlog relative to ecosystem adoption.",
      score: scores.maintainer,
    });
    recommendations.push({
      id: "identity_health_triage",
      category: "health",
      title: "Organize Backlog Triage Cycles",
      description:
        "Establish dedicated bug triage sprints to reduce unresolved issue backlogs on active projects.",
      priority: "medium",
    });
  }

  if (scores.influence > PORTFOLIO_INFLUENCE_THRESHOLD) {
    findings.push({
      id: "identity_impact_high",
      type: "highlight",
      category: "impact",
      title: "Major Ecosystem Influence",
      description:
        "The maintainer portfolio has high stars, forks, and adoption, indicating critical ecosystem significance.",
      score: scores.influence,
    });
  }

  const summary = `OSSIntel analysis report for ${identityMetadata.type} ${identityMetadata.login}. Calculated Overall score is ${scores.overall}/100.`;

  const scoresText = [
    "### Calculated Scores",
    `- Overall Score: ${scores.overall}/100`,
    `- Maintainer Score: ${scores.maintainer}/100`,
    `- Contributor Score: ${scores.contributor}/100`,
    `- Organization Leadership Score: ${scores.organization}/100`,
    `- Community Influence Score: ${scores.influence}/100`,
  ].join("\n");

  const metricsArr = [
    "### Identity Metrics",
    `- Profile Type: ${identityMetadata.type}`,
    `- Login/Name: ${identityMetadata.name ?? identityMetadata.login}`,
    `- Total Repositories: ${totalRepos}`,
    `- Active Repositories: ${activeRepos}`,
    `- Archived Repositories: ${archivedRepos}`,
  ];

  if (npmUser || identityMetadata.linkedIdentities?.npm) {
    metricsArr.push(
      `- npm Username: ${npmUser?.username || identityMetadata.linkedIdentities?.npm}`,
      ...(npmUser
        ? [
            `- npm Downloads: ${npmUser.totalWeeklyDownloads.toLocaleString()} weekly`,
            `- Published packages: ${npmUser.packages.length} (${npmUser.activePackagesCount} active)`,
            `- Flagship package: ${npmUser.popularPackage ?? "None"}`,
          ]
        : []),
    );
  }

  if (stackoverflowUser || identityMetadata.linkedIdentities?.stackoverflow) {
    metricsArr.push(
      `- Stack Overflow ID: ${stackoverflowUser?.userId || identityMetadata.linkedIdentities?.stackoverflow}`,
      ...(stackoverflowUser
        ? [
            `- Stack Overflow Reputation: ${stackoverflowUser.reputation.toLocaleString()}`,
            `- Stack Overflow Badges: ${stackoverflowUser.badgeCounts.gold} Gold, ${stackoverflowUser.badgeCounts.silver} Silver, ${stackoverflowUser.badgeCounts.bronze} Bronze`,
            `- Stack Overflow Answers: ${stackoverflowUser.answerCount} (${stackoverflowUser.acceptanceRate}% accepted)`,
          ]
        : []),
    );
  }

  const metricsText = metricsArr.join("\n");

  const promptContext = formatPromptContext(
    summary,
    scoresText,
    metricsText,
    findings,
    recommendations,
    false,
  );

  return {
    findings,
    recommendations,
    promptContext,
  };
};
