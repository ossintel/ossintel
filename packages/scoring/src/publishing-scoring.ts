import type { NormalizedNpmUser } from "@ossintel/npm";

export interface PublishingScore {
  /** Overall publishing reputation score (0-100). */
  score: number;
  /** Breakdown of sub-scores contributing to the overall. */
  breakdown: {
    /** Score based on total download volume (0-100). */
    downloads: number;
    /** Score based on active package count (0-100). */
    packages: number;
    /** Score based on verified publisher status (0 or 100). */
    verified: number;
  };
}

/**
 * Calculate a Package Publishing capability score.
 *
 * Currently evaluates npm presence only. Designed to be extended
 * with additional registries (NuGet, PyPI, crates.io, Go, etc.)
 * by adding optional parameters without breaking existing callers.
 *
 * @returns A score (0-100) with breakdown, or null if no data is available.
 */
export const calculatePublishingScore = (
  npmUser?: NormalizedNpmUser | null,
): PublishingScore | null => {
  if (!npmUser) return null;

  const totalDownloads = npmUser.totalDownloads ?? 0;

  const downloads = Math.min(100, Math.log10(totalDownloads + 1) * 15);
  const packages = Math.min(100, npmUser.activePackagesCount * 10);
  const verified = npmUser.isVerifiedPublisher ? 100 : 0;

  const score = Math.min(
    100,
    Math.round(downloads * 0.5 + packages * 0.3 + verified * 0.2),
  );

  return {
    score,
    breakdown: {
      downloads: Math.round(downloads),
      packages: Math.round(packages),
      verified,
    },
  };
};
