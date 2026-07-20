"use client";

import type {
  NormalizedContribution,
  NormalizedRepository,
} from "@ossintel/github-normalizer";
import { generateIdentityInsights } from "@ossintel/insights";
import {
  calculateIdentityScore,
  calculateRepositoryScore,
  type NpmPackageStats,
} from "@ossintel/scoring";
import { useMemo } from "react";

interface DeveloperScoresProps {
  userRepos: NormalizedRepository[];
  orgsQueries: Array<{ data?: { repositories: NormalizedRepository[] } }>;
  includeUserRepos: boolean;
  linkedNpm: string;
  linkedSO: string;
  userLogin: string;
  userName: string;
  externalContributions?: NormalizedContribution[];
}

export const useDeveloperScores = ({
  userRepos,
  orgsQueries,
  includeUserRepos,
  linkedNpm,
  linkedSO,
  userLogin,
  userName,
  externalContributions,
}: DeveloperScoresProps) => {
  return useMemo(() => {
    const orgRepos = orgsQueries
      .filter((q) => q.data)
      .flatMap((q) => q.data?.repositories || []);

    const combinedRepos = [...(includeUserRepos ? userRepos : []), ...orgRepos];

    let npmPackages: NpmPackageStats[] = [];
    if (linkedNpm) {
      npmPackages = [
        { name: `${linkedNpm}-helper`, downloads: 45000, stars: 12 },
        { name: `react-${linkedNpm}`, downloads: 125000, stars: 45 },
      ];
    }

    const scores = calculateIdentityScore({
      repositories: combinedRepos,
      npmPackages,
      externalContributions,
    });

    const insightsResult = generateIdentityInsights(combinedRepos, scores, {
      type: "user",
      login: userLogin,
      name: userName,
      linkedIdentities: { npm: linkedNpm, stackoverflow: linkedSO },
    });

    const repoScores = combinedRepos.map((r) => {
      const s = calculateRepositoryScore({ repository: r });
      return {
        repoName: r.name,
        fullName: r.fullName,
        scores: {
          overall: s.overall,
          risk: s.risk,
        },
        stars: r.stargazersCount,
        forks: r.forksCount,
      };
    });

    const contribScores = (externalContributions || []).map((c) => {
      const starScore = Math.min(100, Math.log10(c.targetRepoStars + 1) * 20);
      return {
        repoName: c.repoFullName.split("/")[1] || c.repoFullName,
        fullName: c.repoFullName,
        scores: {
          overall: Math.round(starScore),
          risk: 10,
        },
        stars: c.targetRepoStars,
        forks: 0,
        isContribution: true,
        title: c.title,
        htmlUrl: c.htmlUrl,
        type: c.type,
      };
    });

    return {
      scores,
      findings: insightsResult.findings,
      recommendations: insightsResult.recommendations,
      promptContext: insightsResult.promptContext,
      repositories: repoScores,
      externalContributions: contribScores,
    };
  }, [
    userRepos,
    orgsQueries,
    includeUserRepos,
    linkedNpm,
    linkedSO,
    userLogin,
    userName,
    externalContributions,
  ]);
};
