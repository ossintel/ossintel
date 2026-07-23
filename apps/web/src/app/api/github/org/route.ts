import { GitHubRateLimitError } from "@ossintel/github-normalizer";
import { NextResponse } from "next/server";
import { getFriendlyErrorMessage } from "@/lib/api-helpers";
import { getDecryptedToken } from "@/lib/cookie-token";
import { getInstallationId, getInstallationToken } from "@/lib/github-app";
import { getCachedOrganizationData } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { query, token: reqToken, forceRefresh } = await request.json();
    const login = query || "";

    // Resolve token: App installation token first, fall back to Cookie PAT
    let token = await getInstallationToken(login);
    const isAppInstalled = !!token || !!(await getInstallationId(login));
    if (!token) {
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
    const message = getFriendlyErrorMessage(
      error,
      "Failed to fetch organization",
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
