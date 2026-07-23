import { unstable_cache } from "next/cache";
import { App } from "octokit";

interface InstallationItem {
  login: string;
  id: number;
}

// 1. Fetch installations list directly from GitHub API
async function fetchInstallationsRaw(): Promise<InstallationItem[]> {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!appId || !privateKey) {
    console.warn(
      "[GitHub App] GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY is missing. App authentication disabled.",
    );
    return [];
  }

  try {
    console.log(
      `[GitHub App] Authenticating App ID: ${appId} to retrieve installations...`,
    );
    const app = new App({
      appId,
      privateKey,
    });
    const installations = await app.octokit.paginate("GET /app/installations", {
      per_page: 100,
    });

    const list: InstallationItem[] = [];
    for (const inst of installations) {
      if (inst.account?.login) {
        list.push({
          login: inst.account.login.toLowerCase(),
          id: inst.id,
        });
      }
    }
    console.log(
      `[GitHub App] Successfully fetched ${list.length} installations.`,
    );
    return list;
  } catch (error) {
    console.error("[GitHub App] Failed to fetch installations list", error);
    return [];
  }
}

// 2. Wrap installations retrieval in Next.js unstable_cache
const getCachedInstallationsList = unstable_cache(
  async () => {
    console.log(
      "[GitHub App] Cache miss. Fetching fresh installations from GitHub API...",
    );
    return fetchInstallationsRaw();
  },
  ["github-app-installations"],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ["github-app-installations"],
  },
);

// 3. Public API
export async function getInstallationMap(): Promise<Map<string, number>> {
  const list = await getCachedInstallationsList();
  const map = new Map<string, number>();
  for (const item of list) {
    map.set(item.login, item.id);
  }
  return map;
}

export async function getInstallationId(
  login: string,
): Promise<number | undefined> {
  const map = await getInstallationMap();
  const instId = map.get(login.toLowerCase());
  console.log(
    `[GitHub App] Installation lookup for '${login}': ${instId ? `Found (${instId})` : "Not Found"}`,
  );
  return instId;
}

export async function getInstallationToken(
  login: string,
): Promise<string | undefined> {
  const installationId = await getInstallationId(login);
  if (!installationId) return undefined;

  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!appId || !privateKey) {
    return undefined;
  }

  try {
    console.log(
      `[GitHub App] Generating temporary installation token for '${login}' (Installation ID: ${installationId})...`,
    );
    const app = new App({
      appId,
      privateKey,
    });
    const response = await app.octokit.request(
      "POST /app/installations/{installation_id}/access_tokens",
      {
        installation_id: installationId,
      },
    );
    console.log(
      `[GitHub App] Successfully generated token for '${login}'. Expires at: ${response.data.expires_at}`,
    );
    return response.data.token;
  } catch (error) {
    console.error(
      `[GitHub App] Failed to generate installation token for login ${login}`,
      error,
    );
    return undefined;
  }
}
