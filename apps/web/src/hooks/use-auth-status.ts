import { useQuery } from "@tanstack/react-query";
import { AUTH_STATUS_QUERY_KEY } from "@/lib/constants";

export interface AuthStatusResponse {
  hasGitHubPat: boolean;
  hasGithubPat: boolean;
  hasStackOverflowKey: boolean;
  login: string | null;
  organizations: string[];
}

export const useAuthStatus = () => {
  return useQuery<AuthStatusResponse>({
    queryKey: [AUTH_STATUS_QUERY_KEY],
    queryFn: async () => {
      const res = await fetch("/api/auth/status", {
        credentials: "same-origin",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch auth status");
      }
      return res.json();
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false, // Do not auto refetch when tab is focused
    refetchOnReconnect: false, // Do not auto refetch on network reconnect
    refetchOnMount: false, // Do not auto refetch when components mount
    retry: false,
  });
};
