import { GitHubRateLimitError } from "@ossintel/github-normalizer";
import { NextResponse } from "next/server";
import { getFriendlyErrorMessage } from "@/lib/api-helpers";
import { GITHUB_APP_CACHE_TTL } from "@/lib/constants-backend";
import { getDecryptedToken } from "@/lib/cookie-token";
import { getInstallationId, getInstallationToken } from "@/lib/github-app";
import { getCachedOrganizationData } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

export const POST = async (request: Request) => {
  try {
    const { query, token: reqToken, forceRefresh } = await request.json();
    const login = query || "";

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
        `[Org API] Resolved GitHub App installation token for: ${login}`,
      );
    } else {
      console.log(
        `[Org API] No GitHub App installation found for: ${login}. Falling back to Cookie PAT or anonymous.`,
      );
      token = await getDecryptedToken(reqToken);
    }
    const options = { token };

    const result = await getCachedOrganizationData(
      login,
      options,
      forceRefresh,
    );
    return NextResponse.json({
      ...result,
      isAppInstalled,
    });
  } catch (error: unknown) {
    console.error("Organization API failed", error);
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
    const message = getFriendlyErrorMessage(
      error,
      "Failed to fetch organization",
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
