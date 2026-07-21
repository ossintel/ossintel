import {
  type StackOverflowFetchOptions,
  StackOverflowHttpError,
} from "./types";

export async function stackoverflowFetch<T>(
  endpoint: string,
  options?: StackOverflowFetchOptions,
): Promise<T> {
  const baseUrl = options?.baseUrl ?? "https://api.stackexchange.com/2.3";
  const apiKey = options?.apiKey ?? process.env["STACKEXCHANGE_API_KEY"];

  const urlObj = new URL(
    endpoint.startsWith("http://") || endpoint.startsWith("https://")
      ? endpoint
      : `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`,
  );

  // Set default search parameters
  urlObj.searchParams.set("site", "stackoverflow");
  if (apiKey) {
    urlObj.searchParams.set("key", apiKey);
  }

  const response = await fetch(urlObj.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate, br",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    let errMsg = `Stack Overflow API failed: ${response.statusText}`;
    try {
      const parsedErr = JSON.parse(errorBody);
      if (parsedErr.error_message) {
        errMsg = `Stack Overflow API failed (${parsedErr.error_name || response.status}): ${parsedErr.error_message}`;
      }
    } catch {
      // Use fallback error message
    }
    throw new StackOverflowHttpError(
      response.status,
      response.statusText,
      errMsg,
    );
  }

  return response.json() as Promise<T>;
}
