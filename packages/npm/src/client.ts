import { type NpmFetchOptions, NpmHttpError } from "./types";

async function performRequest(url: string): Promise<Response> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new NpmHttpError(
      response.status,
      response.statusText,
      `npm API request failed with status ${response.status}: ${errorBody || response.statusText}`,
    );
  }

  return response;
}

export async function npmRegistryFetch<T>(
  endpoint: string,
  options?: NpmFetchOptions,
): Promise<T> {
  const baseUrl = options?.baseUrl ?? "https://registry.npmjs.org";
  const url =
    endpoint.startsWith("http://") || endpoint.startsWith("https://")
      ? endpoint
      : `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const response = await performRequest(url);
  return response.json() as Promise<T>;
}

export async function npmApiFetch<T>(endpoint: string): Promise<T> {
  const baseUrl = "https://api.npmjs.org";
  const url = `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const response = await performRequest(url);
  return response.json() as Promise<T>;
}
