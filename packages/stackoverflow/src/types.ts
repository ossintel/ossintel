export interface StackOverflowFetchOptions {
  apiKey?: string;
  baseUrl?: string;
}

export class StackOverflowHttpError extends Error {
  public status: number;
  public statusText: string;

  constructor(status: number, statusText: string, message: string) {
    super(message);
    this.name = "StackOverflowHttpError";
    this.status = status;
    this.statusText = statusText;
  }
}

export interface StackOverflowTag {
  name: string;
  score: number;
  count: number;
}

export interface NormalizedStackOverflowUser {
  userId: string;
  displayName: string;
  reputation: number;
  badgeCounts: {
    gold: number;
    silver: number;
    bronze: number;
  };
  answerCount: number;
  questionCount: number;
  acceptanceRate: number; // Percentage of answers accepted
  profileLink: string;
  avatarUrl: string;
  yearsActive: number;
  topTags: StackOverflowTag[];
}
