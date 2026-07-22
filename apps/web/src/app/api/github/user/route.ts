import {
  fetchPinnedRepositories,
  GitHubRateLimitError,
} from "@ossintel/github-normalizer";
import { NextResponse } from "next/server";
import { getFriendlyErrorMessage } from "@/lib/api-helpers";
import { getDecryptedToken } from "@/lib/cookie-token";
import {
  getCachedDeveloperData,
  getCachedOrganizationData,
} from "@/lib/server-cache";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

  const token = await getDecryptedToken(reqToken);
  const options = { token };
  const login = query || "";
  const contribLimit = limit;

  try {
    const result = await getCachedDeveloperData(
      login,
      contribLimit,
      options,
      forceRefresh,
    );
    return NextResponse.json(result);
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
      return NextResponse.json(
        {
          error: "rate_limit",
          resetTime: errObj.resetTime
            ? errObj.resetTime.toISOString()
            : new Date(Date.now() + 3600 * 1000).toISOString(),
          message: errObj.message || "GitHub API Rate Limit Exceeded",
        },
        { status: 403 },
      );
    }
    const message = getFriendlyErrorMessage(error, "Failed to fetch user");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// fetchPinnedRepositories is imported from @ossintel/github-normalizer
