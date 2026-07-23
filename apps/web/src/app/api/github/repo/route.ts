import { GitHubRateLimitError } from "@ossintel/github-normalizer";
import { NextResponse } from "next/server";
import { getFriendlyErrorMessage } from "@/lib/api-helpers";
import { GITHUB_APP_CACHE_TTL } from "@/lib/constants-backend";
import { getDecryptedToken } from "@/lib/cookie-token";
import { getInstallationToken } from "@/lib/github-app";
import { getCachedRepositoryData } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

export const POST = async (request: Request) => {
  try {
    const { owner, repo, token: reqToken, forceRefresh } = await request.json();
    const ownerName = owner || "";
    const repoName = repo || "";

    // Resolve token: App installation token first, fall back to Cookie PAT
    let token = await getInstallationToken(ownerName);
    if (!token) {
      token = await getDecryptedToken(reqToken);
    }
    const options = { token };

    const result = await getCachedRepositoryData(
      ownerName,
      repoName,
      options,
      forceRefresh,
    );
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Repository API failed", error);
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
      "Failed to fetch repository",
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
