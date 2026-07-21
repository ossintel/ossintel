import {
  fetchOrganization,
  fetchRepositories,
  GitHubRateLimitError,
} from "@ossintel/github-normalizer";
import { NextResponse } from "next/server";
import { formatOrgResponse } from "@/lib/api-helpers";
import { getDecryptedToken } from "@/lib/cookie-token";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { query, token: reqToken } = await request.json();
    const token = await getDecryptedToken(reqToken);
    const options = { token };

    const login = query || "";

    const org = await fetchOrganization(login, options);
    const repositories = await fetchRepositories(login, {
      ...options,
      allPages: true,
      perPage: 100,
    });

    return NextResponse.json(formatOrgResponse(org, repositories));
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
    const message =
      error instanceof Error ? error.message : "Failed to fetch organization";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
