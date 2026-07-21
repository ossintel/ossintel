import { stackoverflowFetch } from "./client";
import type {
  NormalizedStackOverflowUser,
  StackOverflowFetchOptions,
  StackOverflowTag,
} from "./types";

interface RawSOUser {
  user_id: number;
  display_name: string;
  reputation: number;
  creation_date: number; // Unix timestamp
  profile_image: string;
  link: string;
  badge_counts: {
    gold: number;
    silver: number;
    bronze: number;
  };
  answer_count?: number;
  question_count?: number;
}

interface RawSOTag {
  tag_name: string;
  answer_score: number;
  answer_count: number;
  question_score: number;
  question_count: number;
}

interface RawSOAnswer {
  is_accepted: boolean;
  score: number;
}

/**
 * Fetch and normalize Stack Overflow profile details for a given userId
 */
export async function fetchStackOverflowUser(
  userId: string,
  options?: StackOverflowFetchOptions,
): Promise<NormalizedStackOverflowUser> {
  const cleanId = userId.trim();

  // 1. Fetch user general information
  const userRes = await stackoverflowFetch<{ items: RawSOUser[] }>(
    `/users/${cleanId}`,
    options,
  );

  if (!userRes.items || userRes.items.length === 0) {
    throw new Error(`Stack Overflow user ID '${cleanId}' not found.`);
  }

  const rawUser = userRes.items[0];

  // 2. Fetch user top tags (for expertise skill radar and ecosystem graph)
  let topTags: StackOverflowTag[] = [];
  try {
    const tagsRes = await stackoverflowFetch<{ items: RawSOTag[] }>(
      `/users/${cleanId}/top-tags`,
      { ...options },
    );
    topTags = (tagsRes.items || []).map((t) => ({
      name: t.tag_name,
      score: t.answer_score,
      count: t.answer_count,
    }));
  } catch (err) {
    console.error(
      `Failed to fetch top tags for Stack Overflow user ${cleanId}`,
      err,
    );
  }

  // 3. Fetch sample of answers to calculate answer acceptance rate and average score per answer
  const answerCount = rawUser.answer_count ?? 0;
  const questionCount = rawUser.question_count ?? 0;
  let acceptanceRate = 0;

  try {
    const answersRes = await stackoverflowFetch<{ items: RawSOAnswer[] }>(
      `/users/${cleanId}/answers?pagesize=55`,
      options,
    );
    const answers = answersRes.items || [];
    if (answers.length > 0) {
      const acceptedAnswers = answers.filter((a) => a.is_accepted).length;
      acceptanceRate = Math.round((acceptedAnswers / answers.length) * 100);
    }
  } catch (err) {
    console.error(
      `Failed to fetch answers for Stack Overflow user ${cleanId}`,
      err,
    );
  }

  // Years active calculation
  const createdDate = new Date(rawUser.creation_date * 1000);
  const diffMs = Date.now() - createdDate.getTime();
  const yearsActive = Math.max(
    0.1,
    Math.round((diffMs / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10,
  );

  return {
    userId: cleanId,
    displayName: rawUser.display_name,
    reputation: rawUser.reputation,
    badgeCounts: {
      gold: rawUser.badge_counts?.gold ?? 0,
      silver: rawUser.badge_counts?.silver ?? 0,
      bronze: rawUser.badge_counts?.bronze ?? 0,
    },
    answerCount,
    questionCount,
    acceptanceRate,
    profileLink: rawUser.link,
    avatarUrl: rawUser.profile_image,
    yearsActive,
    topTags,
  };
}
