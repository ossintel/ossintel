"use client";

import { RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AINarrator } from "@/components/dashboard/ai-narrator";
import { DimensionBreakdown } from "@/components/dashboard/dimension-breakdown";
import { FindingsList } from "@/components/dashboard/findings-list";
import { OverviewCard } from "@/components/dashboard/overview-card";
import { RecommendationsGrid } from "@/components/dashboard/recommendations-grid";
import { MaintainerNetwork } from "@/components/org/maintainer-network";
import { OrgHealthDashboard } from "@/components/org/org-health";
import { PackageEcosystem } from "@/components/org/package-ecosystem";
import { RepositoryPortfolio } from "@/components/org/repo-portfolio";
import { SupplyChain } from "@/components/org/supply-chain";
import { TechLandscape } from "@/components/org/tech-landscape";
import { ErrorAlert } from "@/components/ui/error-alert";
import { GitHubAppBanner } from "@/components/ui/github-app-banner";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useDeveloperScores } from "@/hooks/use-developer-scores";
import { useGithubUser } from "@/hooks/use-github-user";

const STEPS = [
  "Establishing connection to GitHub APIs...",
  "Retrieving organization profile metadata...",
  "Analyzing public repositories stats...",
  "Running scoring models & metrics engine...",
  "Generating recommendations & findings...",
  "Finalizing Open Source Intelligence report...",
];

export default function OrgPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-slate-400">
              Loading Org Dashboard...
            </span>
          </div>
        </div>
      }
    >
      <OrgDashboardContent />
    </Suspense>
  );
}

function OrgDashboardContent() {
  const params = useParams();
  const router = useRouter();
  const orgname = params.orgname as string;

  const [dismissedError, setDismissedError] = useState<boolean>(false);

  // 1. Fetch Organization data
  const userQuery = useGithubUser(orgname);

  // Redirect to user page if type is user
  useEffect(() => {
    if (userQuery.data?.type === "user") {
      router.replace(`/user/${orgname}${window.location.search}`);
    }
  }, [userQuery.data, orgname, router]);

  // Handle manual full refresh
  const handleRefresh = async () => {
    setDismissedError(false);
    if (orgname) {
      await userQuery.refresh();
    }
  };

  const impactStats = useMemo(() => {
    if (!userQuery.data) return null;
    const repos = userQuery.data.repositories || [];
    const totalStars = repos.reduce(
      (acc, r) => acc + (r.stargazersCount || 0),
      0,
    );
    const totalForks = repos.reduce((acc, r) => acc + (r.forksCount || 0), 0);
    return {
      stars: totalStars,
      forks: totalForks,
      prsMerged: 0,
    };
  }, [userQuery.data]);

  // Perform dynamic score calculations
  const clientIntel = useDeveloperScores({
    userRepos: userQuery.data?.repositories || [],
    orgsQueries: [],
    includeUserRepos: true,
    npmUser: null,
    stackoverflowUser: null,
    userLogin: userQuery.data?.metadata?.login || orgname || "",
    userName: userQuery.data?.metadata?.name || orgname || "",
    externalContributions: [],
    organizations: [],
  });

  const isLoadingCombined = userQuery.isLoading;
  const isFetchingCombined = userQuery.isFetching;
  const errorCombined = userQuery.error;

  const enrichedRepos = useMemo(() => {
    const rawRepos = userQuery.data?.repositories || [];
    const scoredRepos = clientIntel.repositories || [];
    const pinnedNames = new Set(userQuery.data?.pinnedRepositories || []);
    const rawMap = new Map(rawRepos.map((r) => [r.fullName, r]));
    return scoredRepos.map((sr) => {
      const raw = rawMap.get(sr.fullName);
      return {
        ...sr,
        isArchived: raw?.isArchived ?? false,
        isFork: raw?.isFork ?? false,
        createdAt: raw?.createdAt ?? "",
        pushedAt: raw?.pushedAt ?? "",
        language: raw?.language ?? null,
        topics: raw?.topics ?? [],
        description: raw?.description ?? null,
        openIssuesCount: raw?.openIssuesCount ?? 0,
        isPinned:
          pinnedNames.has(sr.repoName) ||
          (raw?.topics?.includes("pinned") ?? false),
      };
    });
  }, [
    userQuery.data?.repositories,
    clientIntel.repositories,
    userQuery.data?.pinnedRepositories,
  ]);

  const fullAnalysisData = useMemo(() => {
    if (!userQuery.data) return null;
    return {
      type: "org" as const,
      metadata: userQuery.data.metadata,
      scores: clientIntel.scores,
      findings: clientIntel.findings,
      recommendations: clientIntel.recommendations,
      promptContext: clientIntel.promptContext,
      repositories: clientIntel.repositories || [],
      externalContributions: [],
      cachedAt: userQuery.data.cachedAt,
    };
  }, [userQuery.data, clientIntel]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-50" />

      <main className="relative max-w-7xl mx-auto px-6 py-12 z-10 flex flex-col gap-10">
        <LoadingOverlay
          isLoading={isLoadingCombined || isFetchingCombined}
          title={`Auditing Organization ${orgname}...`}
          steps={STEPS}
        />

        {errorCombined && !dismissedError && (
          <div className="max-w-xl mx-auto w-full">
            <ErrorAlert
              error={errorCombined}
              message={errorCombined.message}
              onRetry={handleRefresh}
              onDismiss={() => setDismissedError(true)}
            />
          </div>
        )}

        {fullAnalysisData && !isLoadingCombined && !isFetchingCombined && (
          <div className="space-y-8 animate-fade-in">
            {!userQuery.data?.isAppInstalled && userQuery.data && (
              <GitHubAppBanner
                profileLogin={userQuery.data.metadata.login}
                type="org"
              />
            )}
            {/* Navigation Backlinks */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-md">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Backlinks:
                </span>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="px-3 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition-all"
                >
                  Home
                </button>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
                  title="Force Refresh Data"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                <OverviewCard
                  data={fullAnalysisData}
                  npmStats={null}
                  soStats={null}
                  impactStats={impactStats}
                />
                <DimensionBreakdown scores={clientIntel.scores} />
                <OrgHealthDashboard
                  repositories={enrichedRepos}
                  orgScore={clientIntel.scores.overall}
                />
              </div>

              {/* Right Column */}
              <div className="lg:col-span-2 flex flex-col gap-8">
                <TechLandscape repositories={enrichedRepos} />
                <RepositoryPortfolio
                  repositories={enrichedRepos}
                  pinnedRepositories={userQuery.data?.pinnedRepositories || []}
                />
                <MaintainerNetwork repositories={enrichedRepos} />
                <PackageEcosystem
                  repositories={enrichedRepos}
                  login={orgname}
                />
                <SupplyChain repositories={enrichedRepos} />
                <AINarrator promptContext={clientIntel.promptContext} />
                <FindingsList findings={clientIntel.findings} />
                <RecommendationsGrid
                  recommendations={clientIntel.recommendations}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
