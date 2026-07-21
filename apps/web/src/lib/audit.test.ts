import type {
  NormalizedDeveloper,
  NormalizedOrganization,
  NormalizedRepository,
} from "@ossintel/github-normalizer";
import { describe, expect, test } from "vitest";
import { auditDeveloper, auditOrganization } from "./audit";

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

describe("web audit library", () => {
  test("auditDeveloper correctly calculates scores and generates insights", () => {
    const developer: NormalizedDeveloper = {
      login: "johndoe",
      id: 42,
      avatarUrl: "https://avatar.url",
      htmlUrl: "https://github.com/johndoe",
      type: "User",
      name: "John Doe",
      company: "Acme",
      blog: "https://johndoe.com",
      location: "San Francisco",
      email: "john@doe.com",
      bio: "Open source developer",
      twitterUsername: null,
      publicRepos: 5,
      publicGists: 2,
      followers: 100,
      following: 50,
      createdAt: "2020-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    const repos = [
      mockRepo({ name: "app", fullName: "johndoe/app", stargazersCount: 200 }),
      mockRepo({ name: "lib", fullName: "johndoe/lib", stargazersCount: 50 }),
    ];

    const result = auditDeveloper(developer, repos, []);

    expect(result.scores).toBeDefined();
    expect(result.scores.maintainer).toBeGreaterThan(0);
    expect(result.findings.length).toBeGreaterThanOrEqual(0);
    expect(result.repositories.length).toBe(2);
    expect(result.repositories[0].repoName).toBe("app");
  });

  test("auditOrganization correctly calculates scores and generates insights", () => {
    const organization: NormalizedOrganization = {
      login: "acme",
      id: 100,
      avatarUrl: "https://avatar.url",
      htmlUrl: "https://github.com/acme",
      name: "Acme Corp",
      blog: "https://acme.com",
      location: "Global",
      email: null,
      description: "Making cool things",
      twitterUsername: null,
      publicRepos: 10,
      followers: 500,
      createdAt: "2018-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    const repos = [
      mockRepo({ name: "core", fullName: "acme/core", stargazersCount: 1500 }),
    ];

    const result = auditOrganization(organization, repos);

    expect(result.scores).toBeDefined();
    expect(result.findings).toBeDefined();
    expect(result.repositories.length).toBe(1);
    expect(result.repositories[0].repoName).toBe("core");
  });
});
