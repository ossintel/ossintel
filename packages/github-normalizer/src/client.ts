import {
  DEFAULT_PER_PAGE,
  GITHUB_API_VERSION,
  GITHUB_BASE_URL,
  MS_PER_SECOND,
  RADIX_DECIMAL,
} from "./constants";
import {
  type GitHubFetchOptions,
  GitHubHttpError,
  GitHubRateLimitError,
} from "./types";

const getRequestConfig = (options?: GitHubFetchOptions) => {
  const token =
    options?.token ?? process.env["GITHUB_TOKEN"] ?? process.env["GITHUB_PAT"];
  const baseUrl = options?.baseUrl ?? GITHUB_BASE_URL;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return { baseUrl, headers };
};

const performRequest = async (
  url: string,
  headers: Record<string, string>,
): Promise<Response> => {
  const response = await fetch(url, { headers });

  const limitHeader = response.headers.get("x-ratelimit-limit");
  const remainingHeader = response.headers.get("x-ratelimit-remaining");
  const resetHeader = response.headers.get("x-ratelimit-reset");

  if (response.status === 403 || response.status === 429) {
    if (remainingHeader === "0" && resetHeader) {
      const limit = limitHeader
        ? Number.parseInt(limitHeader, RADIX_DECIMAL)
        : 0;
      const remaining = Number.parseInt(remainingHeader, RADIX_DECIMAL);
      const resetTime = new Date(
        Number.parseInt(resetHeader, RADIX_DECIMAL) * MS_PER_SECOND,
      );
      throw new GitHubRateLimitError(
        limit,
        remaining,
        resetTime,
        `GitHub API Rate Limit Exceeded. Resets at ${resetTime.toISOString()}`,
      );
    }
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new GitHubHttpError(
      response.status,
      response.statusText,
      `GitHub API request failed with status ${response.status}: ${errorBody || response.statusText}`,
    );
  }

  return response;
};

export const githubFetch = async <T>(
  endpoint: string,
  options?: GitHubFetchOptions,
): Promise<T> => {
  const { baseUrl, headers } = getRequestConfig(options);

  const url =
    endpoint.startsWith("http://") || endpoint.startsWith("https://")
      ? endpoint
      : `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const response = await performRequest(url, headers);
  return response.json() as Promise<T>;
};

export const githubFetchAll = async <T>(
  endpoint: string,
  options?: GitHubFetchOptions,
): Promise<T[]> => {
  const { baseUrl, headers } = getRequestConfig(options);
  const allResults: T[] = [];
  let nextUrl: string | null = null;

  const perPage = options?.perPage ?? DEFAULT_PER_PAGE;
  const page = options?.page;

  let currentUrl = endpoint;
  if (!currentUrl.startsWith("http://") && !currentUrl.startsWith("https://")) {
    const separator = currentUrl.includes("?") ? "&" : "?";
    const params: string[] = [];
    if (perPage !== undefined) params.push(`per_page=${perPage}`);
    if (page !== undefined) params.push(`page=${page}`);
    if (params.length > 0) {
      currentUrl = `${currentUrl}${separator}${params.join("&")}`;
    }
  }

  do {
    const url =
      nextUrl ??
      (currentUrl.startsWith("http://") || currentUrl.startsWith("https://")
        ? currentUrl
        : `${baseUrl}${currentUrl.startsWith("/") ? "" : "/"}${currentUrl}`);

    const response = await performRequest(url, headers);
    const data = (await response.json()) as T[];

    if (Array.isArray(data)) {
      allResults.push(...data);
    } else {
      break;
    }

    if (options?.allPages === false || page !== undefined) {
      break;
    }

    const linkHeader = response.headers.get("link");
    if (linkHeader) {
      const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      nextUrl = match ? match[1] : null;
    } else {
      nextUrl = null;
    }
  } while (nextUrl);

  return allResults;
};
