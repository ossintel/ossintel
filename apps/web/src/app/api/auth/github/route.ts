import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const host = request.headers.get("host") || "localhost:3000";
  const isJsOrg = host.endsWith(".js.org") || host.includes("localhost");
  const appUrl = `https://${isJsOrg ? "ossintel.js.org" : host}`;

  const clientId = isJsOrg
    ? process.env.GITHUB_JS_ORG_CLIENT_ID || process.env.GITHUB_CLIENT_ID
    : process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      {
        error: "GITHUB_CLIENT_ID or GITHUB_JS_ORG_CLIENT_ID is not configured",
      },
      { status: 500 },
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const redirectUri = `${appUrl}/api/auth/github/callback`;

  const target = new URL("https://github.com/login/oauth/authorize");
  target.searchParams.set("client_id", clientId);
  target.searchParams.set("redirect_uri", redirectUri);
  target.searchParams.set("scope", "read:user");
  target.searchParams.set("state", state);

  const response = NextResponse.redirect(target.toString());
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 300, // 5 minutes
    path: "/",
    sameSite: "lax",
  });

  return response;
}
