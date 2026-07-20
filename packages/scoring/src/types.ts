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
}

export type IdentityScores = RepositoryScores;
