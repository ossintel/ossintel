export interface NpmFetchOptions {
  token?: string;
  baseUrl?: string;
}

export class NpmHttpError extends Error {
  public status: number;
  public statusText: string;

  constructor(status: number, statusText: string, message: string) {
    super(message);
    this.name = "NpmHttpError";
    this.status = status;
    this.statusText = statusText;
  }
}

export interface RawNpmPackageSearchResult {
  package: {
    name: string;
    version: string;
    description?: string;
    keywords?: string[];
    date: string;
    links: {
      npm: string;
      homepage?: string;
      repository?: string;
      bugs?: string;
    };
    publisher: {
      username: string;
      email?: string;
    };
    maintainers?: Array<{
      username: string;
      email?: string;
    }>;
  };
  score: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
}

export interface RawNpmPackageDownloads {
  downloads: number;
  start: string;
  end: string;
  package: string;
}

export interface NormalizedNpmPackage {
  name: string;
  weeklyDownloads: number; // Weekly downloads
  monthlyDownloads: number;
  created: string; // ISO String
  modified: string; // ISO String
  version: string;
  versionsCount: number;
  releaseFrequency: number; // Publications in last 365 days
  isDeprecated: boolean;
  deprecationMessage: string | null;
  hasTypeScript: boolean;
  hasESM: boolean;
  hasCJS: boolean;
  license: string | null;
  dependentsCount: number; // Estimated dependents via registry search or heuristic
  maintainers: string[];
  bugs: string | null;
  homepage: string | null;
  repository: string | null;
  categories: string[];
  description: string | null;
}

export interface NormalizedNpmUser {
  username: string;
  url: string;
  packages: NormalizedNpmPackage[];
  totalWeeklyDownloads: number;
  totalMonthlyDownloads: number;
  activePackagesCount: number;
  popularPackage: string | null;
  isVerifiedPublisher: boolean;
}
