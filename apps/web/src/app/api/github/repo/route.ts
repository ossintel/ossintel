import {
  fetchContributors,
  fetchLanguages,
  fetchReleases,
  fetchRepository,
  GitHubRateLimitError,
  type NormalizedContributor,
  type NormalizedLanguage,
  type NormalizedRelease,
} from "@ossintel/github-normalizer";
import { NextResponse } from "next/server";
import { getDecryptedToken } from "@/lib/cookie-token";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { owner, repo, token: reqToken } = await request.json();
    const token = await getDecryptedToken(reqToken);
    const options = { token };

    const ownerName = owner || "";
    const repoName = repo || "";

    const repository = await fetchRepository(ownerName, repoName, options);
    let contributors: NormalizedContributor[] = [];
    let releases: NormalizedRelease[] = [];
    let languages: NormalizedLanguage[] = [];

    try {
      contributors = await fetchContributors(ownerName, repoName, options);
    } catch (e) {
      console.error("Failed to fetch contributors", e);
    }

    try {
      releases = await fetchReleases(ownerName, repoName, options);
    } catch (e) {
      console.error("Failed to fetch releases", e);
    }

    try {
      languages = await fetchLanguages(ownerName, repoName, options);
    } catch (e) {
      console.error("Failed to fetch languages", e);
    }

    return NextResponse.json({
      repository,
      contributors,
      releases,
      languages,
    });
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
      error instanceof Error ? error.message : "Failed to fetch repository";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
