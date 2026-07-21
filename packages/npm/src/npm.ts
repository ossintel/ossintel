import { npmApiFetch, npmRegistryFetch } from "./client";
import type {
  NormalizedNpmPackage,
  NormalizedNpmUser,
  NpmFetchOptions,
  RawNpmPackageDownloads,
  RawNpmPackageSearchResult,
} from "./types";

/**
 * Clean up a package name to be safe for API calls
 */
function escapePackageName(name: string): string {
  if (name.startsWith("@")) {
    return `@${encodeURIComponent(name.slice(1))}`;
  }
  return encodeURIComponent(name);
}

interface NpmPackageVersion {
  name: string;
  version: string;
  description?: string | null;
  keywords?: string[];
  homepage?: string | null;
  license?: string | null;
  bugs?: string | { url: string } | null;
  repository?: string | { url: string } | null;
  maintainers?: Array<{ username: string }>;
  deprecated?: boolean | string;
  type?: string;
  types?: string;
  typings?: string;
  exports?: unknown;
}

interface NpmRegistryPackage {
  name: string;
  description?: string | null;
  keywords?: string[];
  homepage?: string | null;
  license?: string | null;
  bugs?: string | { url: string } | null;
  repository?: string | { url: string } | null;
  maintainers?: Array<{ username: string }>;
  versions?: Record<string, NpmPackageVersion>;
  time?: Record<string, string>;
  "dist-tags"?: Record<string, string>;
}

function getBugsUrl(bugs?: string | { url: string } | null): string | null {
  if (!bugs) return null;
  return typeof bugs === "string" ? bugs : (bugs.url ?? null);
}

/**
 * Fetch detailed metrics for a single npm package
 */
export async function fetchNpmPackage(
  packageName: string,
  options?: NpmFetchOptions,
): Promise<NormalizedNpmPackage> {
  const escapedName = escapePackageName(packageName);

  // 1. Fetch registry details (full package document to get historical time metadata)
  let registryData: NpmRegistryPackage;
  try {
    registryData = await npmRegistryFetch<NpmRegistryPackage>(
      `/${escapedName}`,
      options,
    );
  } catch (e) {
    // If fetching full package fails or is forbidden, try fetching the latest version only
    try {
      const latestData = await npmRegistryFetch<NpmPackageVersion>(
        `/${escapedName}/latest`,
        options,
      );
      registryData = {
        name: latestData.name,
        description: latestData.description,
        keywords: latestData.keywords,
        homepage: latestData.homepage,
        bugs: latestData.bugs,
        repository: latestData.repository,
        license: latestData.license,
        maintainers: latestData.maintainers,
        versions: { [latestData.version]: latestData },
        time: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          [latestData.version]: new Date().toISOString(),
        },
      };
    } catch {
      throw e;
    }
  }

  const latestVersionStr =
    registryData["dist-tags"]?.["latest"] ||
    Object.keys(registryData.versions || {}).pop() ||
    "1.0.0";
  const latestVersion = registryData.versions?.[latestVersionStr] || {
    name: registryData.name,
    version: latestVersionStr,
  };

  // 2. Fetch point downloads (weekly and monthly)
  let weeklyDownloads = 0;
  let monthlyDownloads = 0;
  try {
    const weeklyRes = await npmApiFetch<RawNpmPackageDownloads>(
      `/downloads/point/last-week/${escapedName}`,
    );
    weeklyDownloads = weeklyRes.downloads ?? 0;
  } catch {
    // Ignore download fetch failure
  }

  try {
    const monthlyRes = await npmApiFetch<RawNpmPackageDownloads>(
      `/downloads/point/last-month/${escapedName}`,
    );
    monthlyDownloads = monthlyRes.downloads ?? 0;
  } catch {
    // Ignore download fetch failure
  }

  // 3. Estimate dependents via registry search (size=0, we only need the "total" field)
  let dependentsCount = 0;
  try {
    const searchRes = await npmRegistryFetch<{ total: number }>(
      `/-/v1/search?text=depends:${escapedName}&size=0`,
      options,
    );
    dependentsCount = searchRes.total ?? 0;
  } catch {
    // Ignore dependents fetch failure
  }

  // 4. Heuristics for TypeScript, ESM, CJS
  const hasTypeScript =
    !!latestVersion.types ||
    !!latestVersion.typings ||
    (latestVersion.exports
      ? JSON.stringify(latestVersion.exports).includes("types")
      : false);

  const hasESM =
    latestVersion.type === "module" ||
    (latestVersion.exports
      ? JSON.stringify(latestVersion.exports).includes("import")
      : false);

  const hasCJS =
    latestVersion.type === "commonjs" ||
    !hasESM ||
    (latestVersion.exports
      ? JSON.stringify(latestVersion.exports).includes("require")
      : false);

  // Release frequency (last 365 days)
  let releaseFrequency = 0;
  const timeMap = registryData.time || {};
  const createdDate = timeMap["created"] || new Date().toISOString();
  const modifiedDate = timeMap["modified"] || new Date().toISOString();
  const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;

  for (const [ver, dateStr] of Object.entries(timeMap)) {
    if (ver === "created" || ver === "modified") continue;
    const dateMs = new Date(dateStr as string).getTime();
    if (dateMs >= oneYearAgo) {
      releaseFrequency++;
    }
  }

  // Deprecated package checks
  const isDeprecated = !!latestVersion.deprecated;
  const deprecationMessage =
    typeof latestVersion.deprecated === "string"
      ? latestVersion.deprecated
      : null;

  // Extract repo URL safely
  let repositoryUrl = null;
  const repoRaw = latestVersion.repository ?? registryData.repository;
  if (repoRaw) {
    repositoryUrl =
      typeof repoRaw === "string" ? repoRaw : (repoRaw.url ?? null);
    if (repositoryUrl?.startsWith("git+")) {
      repositoryUrl = repositoryUrl.slice(4);
    }
    if (repositoryUrl?.endsWith(".git")) {
      repositoryUrl = repositoryUrl.slice(0, -4);
    }
  }

  // Keywords / categories
  const keywords = latestVersion.keywords ?? registryData.keywords ?? [];

  return {
    name: registryData.name,
    weeklyDownloads: weeklyDownloads,
    monthlyDownloads,
    created: createdDate,
    modified: modifiedDate,
    version: latestVersionStr,
    versionsCount: Object.keys(registryData.versions || {}).length,
    releaseFrequency,
    isDeprecated,
    deprecationMessage,
    hasTypeScript,
    hasESM,
    hasCJS,
    license: latestVersion.license ?? registryData.license ?? null,
    dependentsCount,
    maintainers: (registryData.maintainers || []).map(
      (m: { username: string }) => m.username,
    ),
    bugs: getBugsUrl(latestVersion.bugs) ?? getBugsUrl(registryData.bugs),
    homepage: latestVersion.homepage ?? registryData.homepage ?? null,
    repository: repositoryUrl,
    categories: keywords,
    description: latestVersion.description ?? registryData.description ?? null,
  };
}

/**
 * Fetch packages maintained by a user and build user stats
 */
export async function fetchNpmUser(
  username: string,
  options?: NpmFetchOptions,
): Promise<NormalizedNpmUser> {
  const cleanUsername = username.trim();
  const packages: NormalizedNpmPackage[] = [];

  // 1. Search for packages maintained by this user
  let searchRes: { objects: RawNpmPackageSearchResult[] };
  try {
    searchRes = await npmRegistryFetch<{
      objects: RawNpmPackageSearchResult[];
    }>(`/-/v1/search?text=maintainer:${cleanUsername}&size=250`, options);
  } catch (err) {
    console.error(
      `npm Registry search failed for maintainer:${cleanUsername}`,
      err,
    );
    searchRes = { objects: [] };
  }

  const objects = searchRes.objects || [];

  // 2. Fetch details for each package in parallel (safeguarded against failures)
  const packageFetches = objects.map(async (obj) => {
    try {
      return await fetchNpmPackage(obj.package.name, options);
    } catch (e) {
      console.error(
        `Failed to fetch npm package details for ${obj.package.name}`,
        e,
      );
      return null;
    }
  });

  const results = await Promise.all(packageFetches);
  for (const pkg of results) {
    if (pkg) packages.push(pkg);
  }

  // 3. Compile aggregate metrics
  let totalWeeklyDownloads = 0;
  let totalMonthlyDownloads = 0;
  let activePackagesCount = 0;
  let maxDownloads = -1;
  let popularPackage: string | null = null;

  for (const pkg of packages) {
    totalWeeklyDownloads += pkg.weeklyDownloads;
    totalMonthlyDownloads += pkg.monthlyDownloads;
    if (!pkg.isDeprecated) {
      activePackagesCount++;
    }
    if (pkg.weeklyDownloads > maxDownloads) {
      maxDownloads = pkg.weeklyDownloads;
      popularPackage = pkg.name;
    }
  }

  return {
    username: cleanUsername,
    url: `https://www.npmjs.com/~${cleanUsername}`,
    packages,
    totalWeeklyDownloads,
    totalMonthlyDownloads,
    activePackagesCount,
    popularPackage,
    isVerifiedPublisher: packages.length > 0,
  };
}
