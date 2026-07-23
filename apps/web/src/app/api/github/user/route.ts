import {
  fetchPinnedRepositories,
  GitHubRateLimitError,
} from "@ossintel/github-normalizer";
import { NextResponse } from "next/server";
import { getFriendlyErrorMessage } from "@/lib/api-helpers";
import { GITHUB_APP_CACHE_TTL } from "@/lib/constants-backend";
import { getDecryptedToken } from "@/lib/cookie-token";
import {
  getInstallationId,
  getInstallationMap,
  getInstallationToken,
} from "@/lib/github-app";
import {
  getCachedDeveloperData,
  getCachedOrganizationData,
} from "@/lib/server-cache";

export const dynamic = "force-dynamic";

export const POST = async (request: Request) => {
  let query = "";
  let reqToken = "";
  let limit = Infinity;
  let forceRefresh = false;

  try {
    const body = await request.json();
    query = body.query || "";
    reqToken = body.token || "";
    limit =
      body.limit === null || body.limit === undefined
        ? Infinity
        : Number(body.limit);
    forceRefresh = body.forceRefresh || false;
  } catch {
    // Ignore body parsing error
  }

  const login = query || "";
  const contribLimit = limit;

  // Resolve token: App installation token first, fall back to Cookie PAT
  const isAppConfigured = !!(
    process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY
  );
  let token = await getInstallationToken(login);
  const isAppInstalled = isAppConfigured
    ? !!token || !!(await getInstallationId(login))
    : true; // Suppress banner if app is not configured on this environment
  if (token) {
    console.log(
      `[User API] Resolved GitHub App installation token for: ${login}`,
    );
  } else {
    console.log(
      `[User API] No GitHub App installation found for: ${login}. Falling back to Cookie PAT or anonymous.`,
    );
    token = await getDecryptedToken(reqToken);
  }
  const options = { token };

  try {
    const result = await getCachedDeveloperData(
      login,
      contribLimit,
      options,
      forceRefresh,
    );
    const uninstalledOrgs: string[] = [];
    if (result.type === "user" && isAppConfigured) {
      const orgsList = result.metadata?.organizations || [];
      console.log(
        `[User API DEBUG] Found ${orgsList.length} organizations in metadata.`,
      );
      const map = await getInstallationMap();
      for (const org of orgsList) {
        console.log(
          `[User API DEBUG] Checking organization login: '${org.login}'`,
        );
        const orgInstalled = map.has(org.login.toLowerCase());
        console.log(
          `[User API DEBUG] Organization '${org.login}' isAppInstalled: ${orgInstalled}`,
        );
        if (!orgInstalled) {
          uninstalledOrgs.push(org.login);
        }
      }
      console.log(
        `[User API DEBUG] Final uninstalledOrgs list:`,
        uninstalledOrgs,
      );
    }

    return NextResponse.json({
      ...result,
      isAppInstalled,
      uninstalledOrgs,
    });
  } catch (error: unknown) {
    console.error("User API failed", error);
    const errMessage = error instanceof Error ? error.message : String(error);

    if (errMessage.includes("is an Organization")) {
      try {
        const orgData = await getCachedOrganizationData(
          login,
          options,
          forceRefresh,
        );
        const pinnedRepositories = await fetchPinnedRepositories(
          login,
          true,
          options,
        );
        const mappedUser = {
          type: "org" as const,
          metadata: {
            id: orgData.metadata.id,
            login: orgData.metadata.login,
            name: orgData.metadata.name || orgData.metadata.login,
            avatarUrl: orgData.metadata.avatarUrl,
            htmlUrl: orgData.metadata.htmlUrl,
            location: orgData.metadata.location,
            email: orgData.metadata.email,
            blog: orgData.metadata.blog,
            publicRepos: orgData.metadata.publicRepos,
            followers: orgData.metadata.followers,
            bio: orgData.metadata.description || "",
            company: null,
            twitterUsername: null,
            createdAt: "",
            socialLinks: [],
            organizations: [],
            suggestions: {},
            readme: "",
          },
          repositories: orgData.repositories || [],
          externalContributions: [],
          cachedAt: orgData.cachedAt,
          pinnedRepositories,
          isAppInstalled,
        };
        return NextResponse.json(mappedUser);
      } catch (orgErr) {
        console.error("Organization fallback failed", orgErr);
      }
    }

    if (
      error instanceof GitHubRateLimitError ||
      (error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "GitHubRateLimitError")
    ) {
      const errObj = error as {
        resetTime?: { toISOString: () => string };
        message?: string;
      };
      const oneHourMs = GITHUB_APP_CACHE_TTL * 1000;
      return NextResponse.json(
        {
          error: "rate_limit",
          resetTime: errObj.resetTime
            ? errObj.resetTime.toISOString()
            : new Date(Date.now() + oneHourMs).toISOString(),
          message: errObj.message || "GitHub API Rate Limit Exceeded",
        },
        { status: 403 },
      );
    }
    const message = getFriendlyErrorMessage(error, "Failed to fetch user");
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
