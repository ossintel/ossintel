import type { RepositoryScores, ScoringInputs } from "@ossintel/scoring";
import { describe, expect, test } from "vitest";
import { generateIdentityInsights, generateInsights } from "./insights";

const mockRepository = (
  overrides?: Partial<ScoringInputs["repository"]>,
): ScoringInputs["repository"] => ({
  id: 1,
  name: "test-repo",
  fullName: "test-owner/test-repo",
  owner: {
    login: "test-owner",
    id: 99,
    avatarUrl: "https://avatar.url",
    type: "User",
  },
  htmlUrl: "https://github.com/test-owner/test-repo",
  description: "Test description",
  isFork: false,
  createdAt: "2020-01-01T00:00:00Z",
  updatedAt: new Date().toISOString(),
  pushedAt: new Date().toISOString(),
  homepage: "https://test.homepage",
  size: 5000,
  stargazersCount: 1000,
  watchersCount: 100,
  language: "TypeScript",
  forksCount: 50,
  openIssuesCount: 5,
  defaultBranch: "main",
  topics: ["typescript", "oss"],
  isArchived: false,
  ...overrides,
});

describe("insights engine", () => {
  test("highly active, healthy, low-risk project highlights", () => {
    const inputs: ScoringInputs = {
      repository: mockRepository(),
      contributors: Array.from({ length: 50 }, (_, i) => ({
        id: i,
        login: `user-${i}`,
        avatarUrl: "",
        htmlUrl: "",
        type: "User",
        contributions: 10,
      })),
      releases: [
        {
          id: 1,
          name: "v1.0.0",
          tagName: "v1.0.0",
          targetCommitish: "main",
          body: "Release body",
          draft: false,
          prerelease: false,
          createdAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
          htmlUrl: "",
          author: null,
        },
      ],
    };

    const scores: RepositoryScores = {
      overall: 95,
      health: 98,
      impact: 85,
      activity: 90,
      community: 92,
      risk: 10,
    };

    const result = generateInsights(inputs, scores);
    expect(result.findings).toHaveLength(5);
    expect(result.findings.every((f) => f.type === "highlight")).toBe(true);
    expect(result.recommendations).toHaveLength(0);

    expect(result.promptContext.summary).toContain("test-owner/test-repo");
    expect(result.promptContext.scoresText).toContain("Overall Score: 95/100");
    expect(result.promptContext.metricsText).toContain("Stars: 1000");
    expect(result.promptContext.findingsText).toContain("[HIGHLIGHT] (risk)");
  });

  test("unhealthy, inactive, high-risk project warnings & recommendations", () => {
    const inputs: ScoringInputs = {
      repository: mockRepository({
        topics: [],
        homepage: null,
        description: null,
      }),
      contributors: [],
      releases: [],
    };

    const scores: RepositoryScores = {
      overall: 20,
      health: 25,
      impact: 5,
      activity: 10,
      community: 15,
      risk: 80,
    };

    const result = generateInsights(inputs, scores);
    expect(result.findings).toHaveLength(5);
    const warnings = result.findings.filter((f) => f.type === "warning");
    expect(warnings).toHaveLength(4);
    expect(result.recommendations).toHaveLength(5);

    const priorities = result.recommendations.map((r) => r.priority);
    expect(priorities).toContain("high");
    expect(priorities).toContain("medium");
    expect(priorities).toContain("low");
  });

  test("generateIdentityInsights - checks user and org metadata, archived repos", () => {
    const repos = [
      mockRepository({ isArchived: true }),
      mockRepository({ isArchived: false }),
    ];
    const scores: RepositoryScores = {
      overall: 80,
      health: 85,
      impact: 90,
      activity: 70,
      community: 75,
      risk: 10,
    };
    const metadata = {
      type: "user" as const,
      login: "testuser",
      linkedIdentities: {
        npm: "npmuser",
        stackoverflow: "12345",
      },
    };

    const result = generateIdentityInsights(repos, scores, metadata);
    expect(result.findings).toHaveLength(4); // composition, archived present, npm, stackoverflow
    expect(result.recommendations).toHaveLength(0); // low risk, good health
    expect(result.promptContext.summary).toContain("testuser");
    expect(result.promptContext.metricsText).toContain("npmuser");
  });
});
