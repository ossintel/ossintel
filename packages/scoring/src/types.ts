import type {
  NormalizedContribution,
  NormalizedContributor,
  NormalizedLanguage,
  NormalizedRelease,
  NormalizedRepository,
} from "@ossintel/github-normalizer";

export interface ScoringInputs {
  repository: NormalizedRepository;
  contributors?: NormalizedContributor[];
  releases?: NormalizedRelease[];
  languages?: NormalizedLanguage[];
}

export interface RepositoryScores {
  overall: number;
  health: number;
  impact: number;
  activity: number;
  community: number;
  risk: number;
}

export interface NpmPackageStats {
  name: string;
  downloads: number;
  stars?: number;
}

export interface IdentityScoringInputs {
  repositories: NormalizedRepository[];
  npmPackages?: NpmPackageStats[];
  externalContributions?: NormalizedContribution[];
  organizations?: {
    login?: string;
    publicRepos: number;
    followers?: number;
    stars?: number;
  }[];
}

export interface PillarEvidence {
  maintainer: string[];
  contributor: string[];
  influence: string[];
  organization: string[];
}

export interface PillarFactors {
  maintainer: string[];
  contributor: string[];
  influence: string[];
  organization: string[];
}

export interface IdentityScores {
  overall: number;
  maintainer: number;
  contributor: number;
  organization: number;
  influence: number;
  confidence: "High" | "Medium" | "Low";
  evidence: PillarEvidence;
  factors: PillarFactors;
  badges: string[];
}
