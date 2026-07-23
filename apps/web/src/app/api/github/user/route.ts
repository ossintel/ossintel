import { fetchPinnedRepositories } from "@ossintel/github-normalizer";
import { NextResponse } from "next/server";
import { handleGithubRouteError } from "@/lib/api-helpers";
import { resolveInstallationAndUserToken } from "@/lib/cookie-token";
import { getInstallationMap } from "@/lib/github-app";
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

  const { token, isAppInstalled } = await resolveInstallationAndUserToken(
    login,
    reqToken,
    "User API",
  );
  const options = { token };

  const isAppConfigured = !!(
    process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY
  );

  try {
    const result = await getCachedDeveloperData(
      login,
      contribLimit,
      options,
      forceRefresh,
    );
    const uninstalledOrgs: string[] = [];
    if (result.type === "user" && isAppConfigured) {
      console.log(
        `[User API DEBUG] Found ${result.metadata?.organizations?.length || 0} organizations in metadata.`,
      );
      const map = await getInstallationMap();
      for (const org of result.metadata?.organizations || []) {
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

    return handleGithubRouteError(error, "Failed to fetch user");
  }
};
