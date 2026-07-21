import { describe, expect, it, vi } from "vitest";
import { fetchStackOverflowUser } from "./stackoverflow";

describe("stackoverflow normalizer", () => {
  it("should fetch and normalize stackoverflow user profile and tag details", async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (
        url.includes("/users/") &&
        !url.includes("/top-tags") &&
        !url.includes("/answers")
      ) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                {
                  user_id: 12345,
                  display_name: "John Doe",
                  reputation: 25000,
                  creation_date: 1577836800, // 2020-01-01
                  profile_image: "https://image.url",
                  link: "https://stackoverflow.com/users/12345",
                  badge_counts: {
                    gold: 5,
                    silver: 25,
                    bronze: 100,
                  },
                  answer_count: 500,
                  question_count: 10,
                },
              ],
            }),
        });
      }
      if (url.includes("/top-tags")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                {
                  tag_name: "reactjs",
                  answer_score: 500,
                  answer_count: 50,
                  question_score: 10,
                  question_count: 2,
                },
                {
                  tag_name: "typescript",
                  answer_score: 300,
                  answer_count: 30,
                  question_score: 0,
                  question_count: 0,
                },
              ],
            }),
        });
      }
      if (url.includes("/answers")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                { is_accepted: true, score: 10 },
                { is_accepted: true, score: 8 },
                { is_accepted: false, score: 3 },
                { is_accepted: false, score: 1 },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });
    });

    global.fetch = mockFetch;

    const result = await fetchStackOverflowUser("12345");

    expect(result.displayName).toBe("John Doe");
    expect(result.reputation).toBe(25000);
    expect(result.badgeCounts.gold).toBe(5);
    expect(result.topTags).toHaveLength(2);
    expect(result.topTags[0].name).toBe("reactjs");
    expect(result.topTags[0].score).toBe(500);
    expect(result.acceptanceRate).toBe(50); // 2 out of 4 accepted -> 50%
  });
});
