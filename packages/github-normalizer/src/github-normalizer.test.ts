/** biome-ignore-all lint/suspicious/noExplicitAny: Use of any is ok for test files */

import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  fetchContributors,
  fetchDeveloper,
  fetchLanguages,
  fetchOrganizations,
  fetchReleases,
  fetchRepositories,
  fetchRepository,
} from "./github-normalizer";
import { GitHubHttpError, GitHubRateLimitError } from "./types";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function createHeaders(headersList?: Record<string, string>) {
  const headerMap = new Map<string, string>();
  if (headersList) {
    for (const [key, val] of Object.entries(headersList)) {
      headerMap.set(key.toLowerCase(), val);
    }
  }
  return {
    get: (name: string) => headerMap.get(name.toLowerCase()) ?? null,
  } as any;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("github-normalizer", () => {
  test("fetchDeveloper - success", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => ({
        id: 123,
        login: "octocat",
        name: "The Octocat",
        avatar_url: "https://avatar.url",
        html_url: "https://html.url",
        type: "User",
        company: "GitHub",
        blog: "https://blog.url",
        location: "San Francisco",
        email: "octocat@github.com",
        bio: "Testing bio",
        twitter_username: "octocat_tw",
        public_repos: 5,
        public_gists: 2,
        followers: 20,
        following: 10,
        created_at: "2011-01-25T18:44:36Z",
        updated_at: "2011-01-25T18:44:36Z",
      }),
    });

    const developer = await fetchDeveloper("octocat");
    expect(developer.id).toBe(123);
    expect(developer.login).toBe("octocat");
    expect(developer.company).toBe("GitHub");
  });

  test("fetchDeveloper - org fails", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => ({
        id: 456,
        login: "github",
        type: "Organization",
      }),
    });

    await expect(fetchDeveloper("github")).rejects.toThrow(
      "is an Organization, not a User",
    );
  });

  test("fetchDeveloper - http error", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 404,
      statusText: "Not Found",
      ok: false,
      headers: createHeaders(),
      text: async () => "Not Found message",
    });

    await expect(fetchDeveloper("octocat")).rejects.toThrow(GitHubHttpError);
  });

  test("fetchDeveloper - rate limit error", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 403,
      statusText: "Forbidden",
      ok: false,
      headers: createHeaders({
        "x-ratelimit-limit": "60",
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": "1600000000",
      }),
      text: async () => "Rate limit exceeded",
    });

    await expect(fetchDeveloper("octocat")).rejects.toThrow(
      GitHubRateLimitError,
    );
  });

  test("fetchRepository - success", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => ({
        id: 789,
        name: "hello-world",
        full_name: "octocat/hello-world",
        owner: {
          login: "octocat",
          id: 123,
          avatar_url: "https://avatar.url",
          type: "User",
        },
        html_url: "https://github.com/octocat/hello-world",
        description: "Hello World repository",
        fork: false,
        created_at: "2011-01-25T18:44:36Z",
        updated_at: "2011-01-25T18:44:36Z",
        pushed_at: "2011-01-25T18:44:36Z",
        size: 108,
        stargazers_count: 80,
        watchers_count: 80,
        language: "JavaScript",
        forks_count: 9,
        open_issues_count: 1,
        default_branch: "master",
        topics: ["test"],
      }),
    });

    const repo = await fetchRepository("octocat", "hello-world");
    expect(repo.id).toBe(789);
    expect(repo.fullName).toBe("octocat/hello-world");
    expect(repo.owner.login).toBe("octocat");
    expect(repo.stargazersCount).toBe(80);
    expect(repo.topics).toEqual(["test"]);
  });

  test("fetchRepositories - for user", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => ({
        login: "octocat",
        type: "User",
      }),
    });

    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => [
        {
          id: 1,
          name: "repo-1",
          full_name: "octocat/repo-1",
        },
      ],
    });

    const repos = await fetchRepositories("octocat");
    expect(repos).toHaveLength(1);
    expect(repos[0].name).toBe("repo-1");
  });

  test("fetchRepositories - for org", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => ({
        login: "github",
        type: "Organization",
      }),
    });

    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => [
        {
          id: 2,
          name: "repo-2",
          full_name: "github/repo-2",
        },
      ],
    });

    const repos = await fetchRepositories("github");
    expect(repos).toHaveLength(1);
    expect(repos[0].name).toBe("repo-2");
  });

  test("fetchRepositories - pagination", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => ({
        login: "octocat",
        type: "User",
      }),
    });

    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders({
        Link: '<https://api.github.com/user/repos?page=2>; rel="next"',
      }),
      json: async () => [{ id: 10, name: "p1" }],
    });

    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => [{ id: 11, name: "p2" }],
    });

    const repos = await fetchRepositories("octocat", { allPages: true });
    expect(repos).toHaveLength(2);
    expect(repos[0].name).toBe("p1");
    expect(repos[1].name).toBe("p2");
  });

  test("fetchOrganizations - success", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => [{ login: "org1" }, { login: "org2" }],
    });

    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => ({
        id: 101,
        login: "org1",
        name: "Organization 1",
        description: "Org 1 Desc",
        public_repos: 10,
        followers: 100,
      }),
    });

    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => ({
        id: 102,
        login: "org2",
        name: "Organization 2",
        description: "Org 2 Desc",
        public_repos: 20,
        followers: 200,
      }),
    });

    const orgs = await fetchOrganizations("octocat");
    expect(orgs).toHaveLength(2);
    expect(orgs[0].login).toBe("org1");
    expect(orgs[0].name).toBe("Organization 1");
    expect(orgs[1].login).toBe("org2");
    expect(orgs[1].publicRepos).toBe(20);
  });

  test("fetchContributors", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => [
        {
          id: 1,
          login: "octocat",
          contributions: 50,
        },
      ],
    });

    const list = await fetchContributors("octocat", "hello-world");
    expect(list).toHaveLength(1);
    expect(list[0].login).toBe("octocat");
    expect(list[0].contributions).toBe(50);
  });

  test("fetchLanguages", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => ({
        TypeScript: 12345,
        JavaScript: 543,
      }),
    });

    const list = await fetchLanguages("octocat", "hello-world");
    expect(list).toHaveLength(2);
    expect(list[0]).toEqual({ name: "TypeScript", bytes: 12345 });
    expect(list[1]).toEqual({ name: "JavaScript", bytes: 543 });
  });

  test("fetchReleases", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => [
        {
          id: 99,
          tag_name: "v1.0.0",
          name: "Release v1.0.0",
          target_commitish: "main",
          body: "Initial release",
          draft: false,
          prerelease: false,
          created_at: "2026-01-01T00:00:00Z",
          published_at: "2026-01-01T00:00:00Z",
          html_url: "https://release.url",
          author: {
            id: 1,
            login: "octocat",
            avatar_url: "https://avatar.url",
          },
        },
      ],
    });

    const releases = await fetchReleases("octocat", "hello-world");
    expect(releases).toHaveLength(1);
    expect(releases[0].tagName).toBe("v1.0.0");
    expect(releases[0].author?.login).toBe("octocat");
  });

  test("fetchDeveloper - with token options", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => ({
        id: 123,
        login: "octocat",
        type: "User",
        avatar_url: "https://avatar.url",
        html_url: "https://html.url",
        created_at: "2011-01-25T18:44:36Z",
        updated_at: "2011-01-25T18:44:36Z",
      }),
    });

    const developer = await fetchDeveloper("octocat", {
      token: "secret-token",
    });
    expect(developer.id).toBe(123);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/octocat"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer secret-token",
        }),
      }),
    );
  });

  test("fetchRepositories - authenticated user (no owner)", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => [
        {
          id: 100,
          name: "my-repo",
          full_name: "octocat/my-repo",
        },
      ],
    });

    const repos = await fetchRepositories(undefined);
    expect(repos).toHaveLength(1);
    expect(repos[0].name).toBe("my-repo");
  });

  test("fetchRepositories - owner type fetch error fallback to user", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 404,
      statusText: "Not Found",
      ok: false,
      headers: createHeaders(),
      text: async () => "Not Found",
    });

    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => [
        {
          id: 3,
          name: "repo-3",
          full_name: "error-owner/repo-3",
        },
      ],
    });

    const repos = await fetchRepositories("error-owner");
    expect(repos).toHaveLength(1);
    expect(repos[0].name).toBe("repo-3");
  });

  test("fetchRepositories - pagination link header without next relation", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => ({
        login: "octocat",
        type: "User",
      }),
    });

    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders({
        Link: '<https://api.github.com/user/repos?page=1>; rel="first"',
      }),
      json: async () => [
        {
          id: 10,
          name: "p1",
          full_name: "octocat/p1",
        },
      ],
    });

    const repos = await fetchRepositories("octocat", { allPages: true });
    expect(repos).toHaveLength(1);
    expect(repos[0].name).toBe("p1");
  });

  test("fetchRepositories - pagination with allPages false", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => ({
        login: "octocat",
        type: "User",
      }),
    });

    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders({
        Link: '<https://api.github.com/user/repos?page=2>; rel="next"',
      }),
      json: async () => [
        {
          id: 10,
          name: "p1",
          full_name: "octocat/p1",
        },
      ],
    });

    const repos = await fetchRepositories("octocat", { allPages: false });
    expect(repos).toHaveLength(1);
    expect(repos[0].name).toBe("p1");
  });

  test("fetchRepositories - non-array response handling", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => ({
        login: "octocat",
        type: "User",
      }),
    });

    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: createHeaders(),
      json: async () => ({
        message: "Not found or some other object",
      }),
    });

    const repos = await fetchRepositories("octocat");
    expect(repos).toEqual([]);
  });
});
