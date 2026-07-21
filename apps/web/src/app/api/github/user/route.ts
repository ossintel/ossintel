import {
  fetchDeveloper,
  fetchExternalContributions,
  fetchOrganizations,
  fetchRepositories,
  GitHubRateLimitError,
  type NormalizedContribution,
  suggestLinkedIdentities,
} from "@ossintel/github-normalizer";
import { NextResponse } from "next/server";
import { getDecryptedToken } from "@/lib/cookie-token";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { query, token: reqToken, limit } = await request.json();
    const token = await getDecryptedToken(reqToken);
    const options = { token };

    const login = query || "";
    const contribLimit =
      limit === null || limit === undefined ? Infinity : Number(limit);

    const developer = await fetchDeveloper(login, options);
    const personalRepos = await fetchRepositories(login, {
      ...options,
      allPages: true,
      perPage: 100,
    });
    const organizations = await fetchOrganizations(login, options);
    let externalContributions: NormalizedContribution[] = [];
    try {
      externalContributions = await fetchExternalContributions(
        login,
        contribLimit,
        options,
      );
    } catch (e) {
      console.error("Failed to fetch external contributions", e);
    }

    // Fetch user profile README
    let readme = "";
    try {
      const readmeRes = await fetch(
        `https://api.github.com/repos/${login}/${login}/readme`,
        {
          headers: token ? { Authorization: `token ${token}` } : {},
        },
      );
      if (readmeRes.ok) {
        const readmeData = await readmeRes.json();
        if (readmeData.content && readmeData.encoding === "base64") {
          readme = Buffer.from(readmeData.content, "base64").toString("utf-8");
        }
      }
    } catch (e) {
      console.error("Failed to fetch README", e);
    }

    // Suggestions
    const suggestions = suggestLinkedIdentities(developer, personalRepos);

    return NextResponse.json({
      developer,
      repositories: personalRepos,
      organizations,
      externalContributions,
      suggestions,
      readme,
    });
  } catch (error: unknown) {
    console.error("User API failed", error);
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
      error instanceof Error ? error.message : "Failed to fetch user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
