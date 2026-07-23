import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDecryptedToken } from "@/lib/cookie-token";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const hasGithubPat = cookieStore.has("github_pat");
    const hasStackOverflowKey = cookieStore.has("stackoverflow_api_key");

    let login: string | null = null;
    if (hasGithubPat) {
      try {
        const token = await getDecryptedToken();
        if (token) {
          const res = await fetch("https://api.github.com/user", {
            headers: {
              Authorization: `Bearer ${token}`,
              "User-Agent": "OSSIntel",
            },
          });
          if (res.ok) {
            const viewer = await res.json();
            login = viewer?.login || null;
          }
        }
      } catch (err) {
        console.error("Failed to fetch logged-in viewer username", err);
      }
    }

    return NextResponse.json({
      hasGithubPat,
      hasStackOverflowKey,
      login,
    });
  } catch (error) {
    console.error("Auth status GET failed", error);
    return NextResponse.json(
      { hasGithubPat: false, hasStackOverflowKey: false, login: null },
      { status: 200 },
    );
  }
}
