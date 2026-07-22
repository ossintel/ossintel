import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { encrypt } from "@/lib/crypto-helper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const appUrl = `${protocol}://${host}`;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  if (!code) {
    return NextResponse.redirect(
      `${appUrl}/?auth_error=${encodeURIComponent("Missing authorization code")}`,
    );
  }

  if (!state || state !== savedState) {
    return NextResponse.redirect(
      `${appUrl}/?auth_error=${encodeURIComponent("Invalid state")}`,
    );
  }

  const isJsOrg = host.includes(".js.org");
  const clientId = isJsOrg
    ? process.env.GITHUB_JS_ORG_CLIENT_ID || process.env.GITHUB_CLIENT_ID
    : process.env.GITHUB_CLIENT_ID;
  const clientSecret = isJsOrg
    ? process.env.GITHUB_CLIENT_JS_ORG_SECRET ||
      process.env.GITHUB_CLIENT_SECRET
    : process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${appUrl}/?auth_error=${encodeURIComponent("GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET not configured")}`,
    );
  }

  try {
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      },
    );

    if (!tokenRes.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const data = await tokenRes.json();
    const accessToken = data.access_token;

    if (!accessToken) {
      return NextResponse.redirect(
        `${appUrl}/?auth_error=${encodeURIComponent("No access token returned from GitHub")}`,
      );
    }

    const encrypted = encrypt(accessToken);
    cookieStore.set("github_pat", encrypted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    // Redirect back to main page
    return NextResponse.redirect(`${appUrl}/`);
  } catch (err) {
    console.error("GitHub OAuth callback failed", err);
    return NextResponse.redirect(
      `${appUrl}/?auth_error=${encodeURIComponent("Authentication failed")}`,
    );
  }
}
