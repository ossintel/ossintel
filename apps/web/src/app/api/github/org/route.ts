import { NextResponse } from "next/server";
import { handleGithubRouteError } from "@/lib/api-helpers";
import { resolveInstallationAndUserToken } from "@/lib/cookie-token";
import { getCachedOrganizationData } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

export const POST = async (request: Request) => {
  try {
    const { query, token: reqToken, forceRefresh } = await request.json();
    const login = query || "";

    const { token, isAppInstalled } = await resolveInstallationAndUserToken(
      login,
      reqToken,
      "Org API",
    );
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
    return handleGithubRouteError(error, "Failed to fetch organization");
  }
};
