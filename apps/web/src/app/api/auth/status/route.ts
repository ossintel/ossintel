import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const hasGithubPat = cookieStore.has("github_pat");
    const hasStackOverflowKey = cookieStore.has("stackoverflow_api_key");

    return NextResponse.json({
      hasGithubPat,
      hasStackOverflowKey,
    });
  } catch (error) {
    console.error("Auth status GET failed", error);
    return NextResponse.json(
      { hasGithubPat: false, hasStackOverflowKey: false },
      { status: 200 },
    );
  }
}
