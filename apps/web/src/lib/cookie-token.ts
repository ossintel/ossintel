import { cookies } from "next/headers";
import { decrypt } from "./crypto-helper";

export async function getDecryptedToken(
  requestToken?: string,
): Promise<string> {
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
}
