import { describe, expect, test } from "vitest";
import { calculateIdentityScore, calculateRepositoryScore } from "./scoring";
import type { ScoringInputs } from "./types";

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

describe("scoring engine", () => {
  test("healthy, popular repo should have high scores", () => {
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
      releases: Array.from({ length: 5 }, (_, i) => ({
        id: i,
        name: `v1.0.${i}`,
        tagName: `v1.0.${i}`,
        targetCommitish: "main",
        body: "Release body",
        draft: false,
        prerelease: false,
        createdAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        htmlUrl: "",
        author: null,
      })),
    };

    const scores = calculateRepositoryScore(inputs);
    expect(scores.overall).toBeGreaterThanOrEqual(70);
    expect(scores.health).toBeGreaterThanOrEqual(80);
    expect(scores.impact).toBeGreaterThanOrEqual(50);
    expect(scores.activity).toBeGreaterThanOrEqual(80);
    expect(scores.community).toBeGreaterThanOrEqual(80);
    expect(scores.risk).toBeLessThanOrEqual(20);
  });

  test("abandoned repo should have low scores", () => {
    const threeYearsAgo = "2023-01-01T00:00:00Z";
    const inputs: ScoringInputs = {
      repository: mockRepository({
        stargazersCount: 2,
        forksCount: 0,
        watchersCount: 0,
        openIssuesCount: 100,
        updatedAt: threeYearsAgo,
        pushedAt: threeYearsAgo,
        topics: [],
        homepage: null,
        description: null,
      }),
      contributors: [
        {
          id: 1,
          login: "owner",
          avatarUrl: "",
          htmlUrl: "",
          type: "User",
          contributions: 5,
        },
      ],
      releases: [],
    };

    const scores = calculateRepositoryScore(inputs);
    expect(scores.health).toBeLessThanOrEqual(30);
    expect(scores.activity).toBeLessThanOrEqual(10);
    expect(scores.community).toBeLessThanOrEqual(20);
    expect(scores.risk).toBeGreaterThanOrEqual(70);
    expect(scores.overall).toBeLessThanOrEqual(30);
  });

  test("fork repositories should have lower health and higher risk", () => {
    const inputs: ScoringInputs = {
      repository: mockRepository({
        isFork: true,
      }),
      contributors: [],
      releases: [],
    };

    const normalScores = calculateRepositoryScore({
      repository: mockRepository({ isFork: false }),
      contributors: [],
      releases: [],
    });

    const forkScores = calculateRepositoryScore(inputs);
    expect(forkScores.health).toBeLessThan(normalScores.health);
    expect(forkScores.risk).toBeGreaterThan(normalScores.risk);
  });

  test("should handle missing contributors and releases gracefully", () => {
    const inputs: ScoringInputs = {
      repository: mockRepository(),
    };

    const scores = calculateRepositoryScore(inputs);
    expect(scores.overall).toBeDefined();
    expect(scores.health).toBeDefined();
    expect(scores.impact).toBeDefined();
    expect(scores.activity).toBeDefined();
    expect(scores.community).toBeDefined();
    expect(scores.risk).toBeDefined();
  });

  test("scoring recency steps", () => {
    const getRecencyScore = (daysAgo: number): number => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      const scores = calculateRepositoryScore({
        repository: mockRepository({ pushedAt: date.toISOString() }),
        releases: [],
      });
      return scores.activity;
    };

    const activityToday = getRecencyScore(0);
    const activityWeekAgo = getRecencyScore(5);
    const activityMonthAgo = getRecencyScore(15);
    const activityThreeMonthsAgo = getRecencyScore(60);
    const activitySixMonthsAgo = getRecencyScore(120);
    const activityYearAgo = getRecencyScore(250);
    const activityAncient = getRecencyScore(500);

    expect(activityToday).toBeGreaterThanOrEqual(activityWeekAgo);
    expect(activityWeekAgo).toBeGreaterThanOrEqual(activityMonthAgo);
    expect(activityMonthAgo).toBeGreaterThanOrEqual(activityThreeMonthsAgo);
    expect(activityThreeMonthsAgo).toBeGreaterThanOrEqual(activitySixMonthsAgo);
    expect(activitySixMonthsAgo).toBeGreaterThanOrEqual(activityYearAgo);
    expect(activityYearAgo).toBeGreaterThanOrEqual(activityAncient);
  });

  test("issue density score thresholds", () => {
    const lowIssues = calculateRepositoryScore({
      repository: mockRepository({ openIssuesCount: 0 }),
    });
    const highIssues = calculateRepositoryScore({
      repository: mockRepository({ openIssuesCount: 500, stargazersCount: 1 }),
    });

    expect(lowIssues.health).toBeGreaterThan(highIssues.health);
  });

  test("intermediate risk thresholds", () => {
    const scores = calculateRepositoryScore({
      repository: mockRepository({ openIssuesCount: 25, stargazersCount: 100 }),
      contributors: Array.from({ length: 4 }, (_, i) => ({
        id: i,
        login: `user-${i}`,
        avatarUrl: "",
        htmlUrl: "",
        type: "User",
        contributions: 5,
      })),
    });

    expect(scores.risk).toBeDefined();
  });

  test("archived repository scoring - activity and health should be 0", () => {
    const inputs: ScoringInputs = {
      repository: mockRepository({
        isArchived: true,
        stargazersCount: 100,
        forksCount: 50,
      }),
    };

    const scores = calculateRepositoryScore(inputs);
    expect(scores.health).toBe(0);
    expect(scores.activity).toBe(0);
    expect(scores.impact).toBeGreaterThan(0);
  });

  test("calculateIdentityScore - simple identity score aggregation", () => {
    const repos = [
      mockRepository({
        stargazersCount: 100,
        forksCount: 50,
        isArchived: false,
      }),
      mockRepository({
        stargazersCount: 200,
        forksCount: 100,
        isArchived: true,
      }),
    ];

    const result = calculateIdentityScore({ repositories: repos });
    expect(result.overall).toBeGreaterThan(0);
    expect(result.maintainer).toBeGreaterThan(0);
    expect(result.influence).toBeGreaterThan(0);
    expect(result.evidence.maintainer.length).toBeGreaterThan(0);
  });

  test("calculateIdentityScore - empty repositories list should return zero scores", () => {
    const result = calculateIdentityScore({ repositories: [] });
    expect(result.overall).toBe(0);
    expect(result.maintainer).toBe(0);
    expect(result.confidence).toBe("Low");
  });

  test("calculateIdentityScore - external contributions should factor into contributor and influence", () => {
    const repos = [
      mockRepository({
        stargazersCount: 10,
        forksCount: 2,
        isArchived: false,
      }),
    ];

    const resultWithoutContrib = calculateIdentityScore({
      repositories: repos,
    });

    const resultWithContrib = calculateIdentityScore({
      repositories: repos,
      externalContributions: [
        {
          title: "fix: resolve memory leak",
          htmlUrl: "https://github.com/facebook/react/pull/1",
          repoFullName: "facebook/react",
          number: 1,
          state: "merged",
          createdAt: "2024-01-01T00:00:00Z",
          mergedAt: "2024-01-02T00:00:00Z",
          type: "code",
          targetRepoStars: 220000,
          labels: ["bug"],
        },
      ],
    });

    expect(resultWithContrib.contributor).toBeGreaterThan(
      resultWithoutContrib.contributor,
    );
    expect(resultWithContrib.overall).toBeGreaterThan(
      resultWithoutContrib.overall,
    );
    expect(resultWithContrib.badges).toContain("Framework Contributor");
  });
});
