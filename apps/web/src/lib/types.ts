export interface AnalysisData {
  type: "repo" | "user" | "org";
  metadata: {
    name?: string;
    fullName?: string;
    description?: string | null;
    stars?: number;
    forks?: number;
    watchers?: number;
    openIssues?: number;
    language?: string | null;
    topics?: string[];
    defaultBranch?: string;
    isFork?: boolean;
    isArchived?: boolean;
    htmlUrl?: string;
    pushedAt?: string | null;
    updatedAt?: string | null;
    owner?: { login: string; avatarUrl: string };
    login?: string;
    avatarUrl?: string | null;
    company?: string | null;
    blog?: string | null;
    location?: string | null;
    bio?: string | null;
    followers?: number;
    following?: number;
    publicRepos?: number;
    createdAt?: string | null;
    organizations?: Array<{
      login: string;
      name: string | null;
      avatarUrl: string;
    }>;
    suggestions?: {
      stackoverflow?: { profileId: string; displayName: string; url: string };
      npm?: { username: string; url: string };
    };
  };
  scores: {
    overall: number;
    health?: number;
    impact?: number;
    activity?: number;
    community?: number;
    risk?: number;
    maintainer?: number;
    contributor?: number;
    organization?: number;
    influence?: number;
    confidence?: "High" | "Medium" | "Low";
    evidence?: {
      maintainer: string[];
      contributor: string[];
      influence: string[];
      organization: string[];
    };
    factors?: {
      maintainer: string[];
      contributor: string[];
      influence: string[];
      organization: string[];
    };
    badges?: string[];
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
