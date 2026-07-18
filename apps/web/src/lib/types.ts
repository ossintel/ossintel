export interface AnalysisData {
  type: "repo" | "user";
  metadata: {
    name?: string;
    fullName?: string;
    description?: string;
    stars?: number;
    forks?: number;
    watchers?: number;
    openIssues?: number;
    language?: string;
    topics?: string[];
    defaultBranch?: string;
    isFork?: boolean;
    htmlUrl?: string;
    pushedAt?: string;
    updatedAt?: string;
    owner?: { login: string; avatarUrl: string };
    login?: string;
    avatarUrl?: string;
    company?: string;
    blog?: string;
    location?: string;
    bio?: string;
    followers?: number;
    following?: number;
    publicRepos?: number;
    createdAt?: string;
  };
  scores: {
    overall: number;
    health: number;
    impact: number;
    activity: number;
    community: number;
    risk: number;
  };
  findings: Array<{
    id: string;
    type: "highlight" | "warning";
    category: string;
    title: string;
    description: string;
    score?: number;
  }>;
  recommendations: Array<{
    id: string;
    category: string;
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
  }>;
  promptContext: {
    summary: string;
    scoresText: string;
    metricsText: string;
    findingsText: string;
    recommendationsText: string;
  };
  languages?: Array<{ name: string; bytes: number }>;
  contributorsCount?: number;
  repositories?: Array<{
    repoName: string;
    fullName: string;
    scores: { overall: number; risk: number };
    stars: number;
    forks: number;
  }>;
}
