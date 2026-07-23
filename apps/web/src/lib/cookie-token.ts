import { cookies } from "next/headers";
import { decrypt } from "./crypto-helper";
import { getInstallationId, getInstallationToken } from "./github-app";

export const getDecryptedToken = async (
  requestToken?: string,
): Promise<string> => {
  if (requestToken) return requestToken;
  try {
    const cookieStore = await cookies();
    const patCookie = cookieStore.get("github_pat");
    if (patCookie?.value) {
      return decrypt(patCookie.value);
    }
  } catch (error) {
    console.error("Failed to retrieve token from cookies", error);
  }
  return "";
};

export const resolveInstallationAndUserToken = async (
  login: string,
  reqToken?: string,
  apiName = "API",
): Promise<{ token: string; isAppInstalled: boolean }> => {
  const isAppConfigured = !!(
    process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY
  );
  let token = await getInstallationToken(login);
  const isAppInstalled = isAppConfigured
    ? !!token || !!(await getInstallationId(login))
    : true;

  if (token) {
    console.log(
      `[${apiName}] Resolved GitHub App installation token for: ${login}`,
    );
  } else {
    console.log(
      `[${apiName}] No GitHub App installation found for: ${login}. Falling back to Cookie PAT or anonymous.`,
    );
    token = await getDecryptedToken(reqToken);
  }

  return { token, isAppInstalled };
};
