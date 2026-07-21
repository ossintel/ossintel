"use client";

import { ExternalLink, Info, RefreshCw, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaGithub } from "react-icons/fa";
import { AINarrator } from "@/components/dashboard/ai-narrator";
import { DimensionBreakdown } from "@/components/dashboard/dimension-breakdown";
import { FindingsList } from "@/components/dashboard/findings-list";
import { LanguagesChart } from "@/components/dashboard/languages-chart";
import { OverviewCard } from "@/components/dashboard/overview-card";
import { RecommendationsGrid } from "@/components/dashboard/recommendations-grid";
import { ErrorAlert } from "@/components/ui/error-alert";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { RateLimitWarning } from "@/components/ui/rate-limit-warning";
import { useGithubRepo } from "@/hooks/use-github-orgs";
import { getCacheTimestamp } from "@/lib/cache";
import { parseRateLimitError } from "@/lib/utils";

const STEPS = [
  "Establishing connection to GitHub APIs...",
  "Retrieving repository structure and metadata...",
  "Scanning code changes and commit intervals...",
  "Analyzing developer pool...",
  "Running metrics scoring models...",
  "Generating findings and recommendations...",
  "Finalizing report...",
];

export default function RepoPage() {
  const params = useParams();
  const router = useRouter();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const cacheKeyStr = `repo:${owner}:${repo}`;
  const { data, error, isLoading, refetch, isFetching, refresh } =
    useGithubRepo(owner, repo);

  // Cached state indicator
  const [cachedTime, setCachedTime] = useState<string | null>(null);

  // Read cache timestamp for UI display
  useEffect(() => {
    if (data) {
      getCacheTimestamp(cacheKeyStr).then((ts) => {
        if (ts) {
          setCachedTime(new Date(ts).toLocaleTimeString());
        } else {
          setCachedTime(null);
        }
      });
    }
  }, [data, cacheKeyStr]);

  const handleRefresh = () => {
    refresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500/30">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-50" />

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-6 py-12 z-10 flex flex-col gap-10">
        {/* Loading overlay */}
        <LoadingOverlay
          isLoading={isLoading || isFetching}
          title={`Scanning Repository ${owner}/${repo}...`}
          steps={STEPS}
        />

        {/* Custom Rate Limit Error Box */}
        {error && parseRateLimitError(error).isRateLimit && (
          <div className="max-w-xl mx-auto w-full">
            <RateLimitWarning error={error} onRetry={refresh} />
          </div>
        )}

        {/* General Error box */}
        {error && !parseRateLimitError(error).isRateLimit && (
          <div className="max-w-lg mx-auto w-full">
            <ErrorAlert message={error.message} onRetry={() => refetch()} />
          </div>
        )}

        {/* Repositories detail analysis page layout */}
        {data && !isLoading && !isFetching && (
          <div className="space-y-8 animate-fade-in">
            {/* Cache indicator and navigation backlinks panel */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-md">
              {/* Backlinks */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Backlinks:
                </span>

                <button
                  type="button"
                  onClick={() => router.push(`/user/${owner}`)}
                  className="px-3 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-330 hover:text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow"
                >
                  <User className="h-3.5 w-3.5 text-indigo-400" /> Owner profile
                  (@{owner})
                </button>

                <a
                  href={`https://github.com/${owner}/${repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-330 hover:text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow"
                >
                  <FaGithub className="h-3.5 w-3.5 text-indigo-400" /> Outer
                  GitHub <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </div>

              {/* Cache status details */}
              <div className="flex items-center gap-3">
                {cachedTime && (
                  <span className="text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" /> Cached data from{" "}
                    {cachedTime}
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleRefresh}
                  className="flex items-center gap-1 px-4 py-2 bg-slate-950 border border-slate-800 text-slate-330 hover:text-white text-xs font-bold rounded-xl transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
              </div>
            </div>

            {/* Dashboard panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                <OverviewCard data={data} />
                <DimensionBreakdown scores={data.scores} />
                {data.languages && (
                  <LanguagesChart languages={data.languages} />
                )}
              </div>

              {/* Right Column */}
              <div className="lg:col-span-2 flex flex-col gap-8">
                <AINarrator promptContext={data.promptContext} />
                <FindingsList findings={data.findings} />
                <RecommendationsGrid recommendations={data.recommendations} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
