import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDecryptedToken } from "@/lib/cookie-token";

const GITHUB_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "OSSIntel",
});

export async function GET() {
  try {
    const cookieStore = await cookies();

    const hasGitHubPat = cookieStore.has("github_pat");
    const hasStackOverflowKey = cookieStore.has("stackoverflow_api_key");

    let login: string | null = null;
    let organizations: string[] = [];

    if (hasGitHubPat) {
      const token = await getDecryptedToken();

      if (token) {
        try {
          const userRes = await fetch("https://api.github.com/user", {
            headers: GITHUB_HEADERS(token),
            signal: AbortSignal.timeout(5000),
          });

          if (userRes.ok) {
            const user = (await userRes.json()) as { login?: string };

            login = user.login ?? null;

            if (login) {
              const orgsRes = await fetch(
                `https://api.github.com/users/${login}/orgs`,
                {
                  headers: GITHUB_HEADERS(token),
                  signal: AbortSignal.timeout(5000),
                },
              );

              if (orgsRes.ok) {
                const orgs = (await orgsRes.json()) as Array<{
                  login: string;
                }>;

                organizations = orgs.map((o) => o.login);
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch GitHub identity", error);
        }
      }
    }

    return NextResponse.json({
      hasGitHubPat,
      hasStackOverflowKey,
      login,
      organizations,
    });
  } catch (error) {
    console.error("Auth status GET failed", error);

    return NextResponse.json({
      hasGitHubPat: false,
      hasStackOverflowKey: false,
      login: null,
      organizations: [],
    });
  }
}
