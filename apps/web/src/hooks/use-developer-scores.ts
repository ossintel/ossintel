"use client";

import type { NormalizedRepository } from "@ossintel/github-normalizer";
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
}

export const useDeveloperScores = ({
  userRepos,
  orgsQueries,
  includeUserRepos,
  linkedNpm,
  linkedSO,
  userLogin,
  userName,
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

    return {
      scores,
      findings: insightsResult.findings,
      recommendations: insightsResult.recommendations,
      promptContext: insightsResult.promptContext,
      repositories: repoScores,
    };
  }, [
    userRepos,
    orgsQueries,
    includeUserRepos,
    linkedNpm,
    linkedSO,
    userLogin,
    userName,
  ]);
};
