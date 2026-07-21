import type {
  NormalizedDeveloper,
  NormalizedOrganization,
  NormalizedRepository,
} from "@ossintel/github-normalizer";
import type { RepositoryInsights } from "@ossintel/insights";
import type { RepositoryScores } from "@ossintel/scoring";
import { describe, expect, test } from "vitest";
import {
  formatOrgResponse,
  formatRepoResponse,
  formatUserResponse,
} from "./api-helpers";

const mockRepo = (
  overrides?: Partial<NormalizedRepository>,
): NormalizedRepository => ({
  id: 1,
  name: "test-repo",
  fullName: "test-owner/test-repo",
  owner: {
    login: "test-owner",
    id: 10,
    avatarUrl: "",
    type: "User",
  },
  htmlUrl: "https://github.com/test-owner/test-repo",
  description: "Test repository",
  isFork: false,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  pushedAt: "2024-01-01T00:00:00Z",
  homepage: null,
  size: 100,
  stargazersCount: 50,
  watchersCount: 5,
  language: "TypeScript",
  forksCount: 2,
  openIssuesCount: 1,
  defaultBranch: "main",
  topics: ["typescript"],
  isArchived: false,
  ...overrides,
});

describe("api-helpers", () => {
  test("formatRepoResponse correct payload formatting", () => {
    const repository = mockRepo();
    const scores: RepositoryScores = {
      overall: 80,
      health: 90,
      impact: 75,
      activity: 85,
      community: 70,
      risk: 15,
    };
    const insights: RepositoryInsights = {
      findings: [],
      recommendations: [],
      promptContext: {
        summary: "Summary text",
        metricsText: "Metrics",
        scoresText: "Scores",
        findingsText: "Findings",
        recommendationsText: "Recommendations",
      },
    };

    const result = formatRepoResponse(
      repository,
      scores,
      insights,
      [{ name: "TypeScript", bytes: 100 }],
      5,
    );

    expect(result.type).toBe("repo");
    expect(result.metadata.name).toBe("test-repo");
    expect(result.scores.overall).toBe(80);
    expect(result.languages).toHaveLength(1);
    expect(result.contributorsCount).toBe(5);
  });

  test("formatOrgResponse correct payload formatting", () => {
    const org: NormalizedOrganization = {
      login: "myorg",
      id: 123,
      avatarUrl: "https://avatar.url",
      htmlUrl: "https://github.com/myorg",
      name: "My Org",
      blog: null,
      location: null,
      email: null,
      description: "An organization",
      twitterUsername: null,
      publicRepos: 5,
      followers: 10,
      createdAt: "2020-01-01",
      updatedAt: "2020-01-01",
    };
    const repos = [mockRepo()];

    const result = formatOrgResponse(org, repos);

    expect(result.type).toBe("org");
    expect(result.metadata.login).toBe("myorg");
    expect(result.repositories).toHaveLength(1);
  });

  test("formatUserResponse correct payload formatting", () => {
    const developer: NormalizedDeveloper = {
      login: "dev",
      id: 456,
      avatarUrl: "https://avatar.url/dev",
      htmlUrl: "https://github.com/dev",
      type: "User",
      name: "Developer",
      company: "Dev Co",
      blog: null,
      location: null,
      email: null,
      bio: "A dev",
      twitterUsername: null,
      publicRepos: 3,
      publicGists: 0,
      followers: 5,
      following: 5,
      createdAt: "2020-01-01",
      updatedAt: "2020-01-01",
    };

    const result = formatUserResponse(
      developer,
      [mockRepo()],
      [],
      [],
      {},
      "readme-content",
    );

    expect(result.type).toBe("user");
    expect(result.metadata.login).toBe("dev");
    expect(result.metadata.readme).toBe("readme-content");
    expect(result.repositories).toHaveLength(1);
  });
});
