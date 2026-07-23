import { NPM_API_BASE_URL, NPM_REGISTRY_BASE_URL } from "./constants";
import { type NpmFetchOptions, NpmHttpError } from "./types";

const performRequest = async (url: string): Promise<Response> => {
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
};

export const npmRegistryFetch = async <T>(
  endpoint: string,
  options?: NpmFetchOptions,
): Promise<T> => {
  const baseUrl = options?.baseUrl ?? NPM_REGISTRY_BASE_URL;
  const url =
    endpoint.startsWith("http://") || endpoint.startsWith("https://")
      ? endpoint
      : `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const response = await performRequest(url);
  return response.json() as Promise<T>;
};

export const npmApiFetch = async <T>(endpoint: string): Promise<T> => {
  const baseUrl = NPM_API_BASE_URL;
  const url = `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const response = await performRequest(url);
  return response.json() as Promise<T>;
};
