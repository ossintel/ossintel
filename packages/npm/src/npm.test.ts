import { describe, expect, it, vi } from "vitest";
import { fetchNpmPackage, fetchNpmUser } from "./npm";

describe("npm normalizer", () => {
  it("should fetch and normalize package metadata and downloads", async () => {
    // Mock global fetch
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("registry.npmjs.org/-/v1/search")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ total: 5 }),
        });
      }
      if (url.includes("registry.npmjs.org")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              name: "test-package",
              description: "A test library",
              keywords: ["react", "typescript"],
              "dist-tags": { latest: "1.0.0" },
              versions: {
                "1.0.0": {
                  name: "test-package",
                  version: "1.0.0",
                  type: "module",
                  types: "index.d.ts",
                  license: "MIT",
                },
              },
              time: {
                created: "2020-01-01T00:00:00.000Z",
                modified: "2021-01-01T00:00:00.000Z",
                "1.0.0": "2020-01-01T00:00:00.000Z",
              },
            }),
        });
      }
      if (url.includes("api.npmjs.org/downloads/point/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ downloads: 1000 }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ total: 5 }),
      });
    });

    global.fetch = mockFetch;

    const result = await fetchNpmPackage("test-package");

    expect(result.name).toBe("test-package");
    expect(result.weeklyDownloads).toBe(1000);
    expect(result.monthlyDownloads).toBe(1000);
    expect(result.hasTypeScript).toBe(true);
    expect(result.hasESM).toBe(true);
    expect(result.dependentsCount).toBe(5);
    expect(result.version).toBe("1.0.0");
  });

  it("should fetch npm user packages and compile profile details", async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/-/v1/search")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              objects: [
                { package: { name: "pkg-one" } },
                { package: { name: "pkg-two" } },
              ],
            }),
        });
      }
      if (url.includes("registry.npmjs.org")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              name: "pkg",
              "dist-tags": { latest: "1.0.0" },
              versions: { "1.0.0": {} },
              time: { created: "2020-01-01Z" },
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ downloads: 500 }),
      });
    });

    global.fetch = mockFetch;

    const user = await fetchNpmUser("test-user");
    expect(user.username).toBe("test-user");
    expect(user.packages).toHaveLength(2);
    expect(user.totalWeeklyDownloads).toBe(1000);
    expect(user.isVerifiedPublisher).toBe(true);
  });
});
