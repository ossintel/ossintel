"use client";

import {
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
// React icons
import { FaKey } from "react-icons/fa";
import { AINarrator } from "@/components/dashboard/ai-narrator";
import { DimensionBreakdown } from "@/components/dashboard/dimension-breakdown";
import { FindingsList } from "@/components/dashboard/findings-list";
import { OpenSourceImpact } from "@/components/dashboard/open-source-impact";
import { OrgSelector } from "@/components/dashboard/org-selector";
import { OverviewCard } from "@/components/dashboard/overview-card";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { RecommendationsGrid } from "@/components/dashboard/recommendations-grid";
import { RepositoriesTable } from "@/components/dashboard/repositories-table";
import { useDeveloperScores } from "@/hooks/use-developer-scores";
import { useGithubOrgs } from "@/hooks/use-github-orgs";
import { useGithubUser } from "@/hooks/use-github-user";

const STEPS = [
  "Establishing connection to GitHub APIs...",
  "Retrieving portfolio profile metadata...",
  "Analyzing public repositories stats...",
  "Running scoring models & metrics engine...",
  "Generating recommendations & findings...",
  "Finalizing Open Source Intelligence report...",
];

export default function UserPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [loadingStep, setLoadingStep] = useState(0);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [linkedNpm, setLinkedNpm] = useState<string>("");
  const [linkedSO, setLinkedSO] = useState<string>("");
  const [includeUserRepos, setIncludeUserRepos] = useState<boolean>(true);
  const [contribLimit, setContribLimit] = useState<number>(10);

  // Toast/Alert dismiss states
  const [dismissedNpm, setDismissedNpm] = useState<boolean>(false);
  const [dismissedSO, setDismissedSO] = useState<boolean>(false);
  const [dismissedRateLimit, setDismissedRateLimit] = useState<boolean>(false);
  const [dismissedError, setDismissedError] = useState<boolean>(false);

  // 1. Fetch user data (repos, orgs, metadata) using custom hook
  const userQuery = useGithubUser(username, contribLimit);

  // 2. Fetch selected organizations data using custom hook
  const orgsQuery = useGithubOrgs(selectedOrgs);

  // PAT config state
  const [patInput, setPatInput] = useState("");
  const [showPatConfig, setShowPatConfig] = useState(false);

  // Rate limiting countdown state
  const [rateLimitReset, setRateLimitReset] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState("");

  const isInitialLoad = useRef(true);

  // loading steps animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    interval = setInterval(() => {
      setLoadingStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 900);
    return () => clearInterval(interval);
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (!rateLimitReset) return;
    const interval = setInterval(() => {
      const resetDate = new Date(rateLimitReset);
      const diffSec = Math.ceil((resetDate.getTime() - Date.now()) / 1000);
      if (diffSec <= 0) {
        setRateLimitReset(null);
        setCooldown("");
        clearInterval(interval);
        userQuery.refetch();
      } else {
        const mins = Math.floor(diffSec / 60);
        const secs = diffSec % 60;
        setCooldown(mins > 0 ? `${mins}m ${secs}s` : `${secs}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitReset, userQuery]);

  // Load token from storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = sessionStorage.getItem("github_token");
      if (savedToken) setPatInput(savedToken);
    }
  }, []);

  // Auto-select all organizations by default on initial load
  useEffect(() => {
    if (isInitialLoad.current && userQuery.data?.metadata?.organizations) {
      const orgLogins = userQuery.data.metadata.organizations.map(
        (o: { login: string }) => o.login,
      );
      setSelectedOrgs(orgLogins);
      isInitialLoad.current = false;
    }
  }, [userQuery.data]);

  // Handle manual full refresh
  const handleRefresh = async () => {
    setDismissedNpm(false);
    setDismissedSO(false);
    setDismissedRateLimit(false);
    setDismissedError(false);
    await userQuery.refresh();
    await orgsQuery.refreshAll();
  };

  const handleSavePat = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("github_token", patInput);
    }
    setShowPatConfig(false);
    setRateLimitReset(null);
    setCooldown("");
    handleRefresh();
  };

  // 3. Perform dynamic, client-side score calculations
  const clientIntel = useDeveloperScores({
    userRepos: userQuery.data?.repositories || [],
    orgsQueries: orgsQuery.queries,
    includeUserRepos,
    linkedNpm,
    linkedSO,
    userLogin: userQuery.data?.metadata?.login || "",
    userName: userQuery.data?.metadata?.name || "",
    externalContributions: userQuery.data?.externalContributions || [],
  });

  const fullAnalysisData = useMemo(() => {
    return {
      ...clientIntel,
      type: "user" as const,
      metadata: userQuery.data?.metadata || {},
    };
  }, [clientIntel, userQuery.data]);

  const isLoadingCombined = userQuery.isLoading || orgsQuery.isLoading;
  const isFetchingCombined = userQuery.isFetching || orgsQuery.isFetching;
  const errorCombined = userQuery.error || orgsQuery.error;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500/30">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-50" />

      {/* Header */}
      <header className="relative border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Search
          </button>
          <div className="flex items-center gap-2">
            <div className="p-0.5 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              {/* biome-ignore lint/performance/noImgElement: static logo asset */}
              <img
                src="/ossintel.png"
                alt="OSSIntel Logo"
                className="h-6 w-6 object-contain"
              />
            </div>
            <span className="text-sm font-bold">OSSIntel</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-6 py-12 z-10 flex flex-col gap-10">
        {/* Loading overlay */}
        {isLoadingCombined && (
          <div className="max-w-xl mx-auto w-full p-8 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl flex flex-col gap-6 items-center text-center">
            <div className="relative">
              <div className="h-16 w-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-indigo-400 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold">
                Analyzing Portfolio @{username}...
              </h3>
              <p className="text-sm text-slate-400 max-w-sm h-12 flex items-center justify-center">
                {STEPS[loadingStep]}
              </p>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${((loadingStep + 1) / STEPS.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Simple Fallback Center Error Block */}
        {!userQuery.data && errorCombined && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 max-w-md mx-auto">
            <AlertTriangle className="h-10 w-10 text-rose-500 mb-3" />
            <p className="text-sm font-semibold text-slate-300">
              An error occurred during analysis.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Please review the notification toast for details.
            </p>
          </div>
        )}

        {/* Dashboard Panels */}
        {userQuery.data && clientIntel && !isLoadingCombined && (
          <div className="space-y-8 animate-fade-in">
            {/* Caching status banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <User className="h-3.5 w-3.5" /> Developer Profile
                </div>
                {isFetchingCombined && (
                  <span className="text-xs text-indigo-400 font-semibold animate-pulse">
                    Refreshing organization cache...
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                className="flex items-center gap-1 px-4 py-2 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" /> Refresh
                Analysis
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                <OverviewCard data={fullAnalysisData} />
                <DimensionBreakdown scores={clientIntel.scores} />

                {/* Exclude User Repos Toggle */}
                <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-3">
                  <h4 className="text-sm font-bold text-slate-200">
                    Personal Repositories Filter
                  </h4>
                  <label className="flex items-center gap-3 p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={includeUserRepos}
                      onChange={(e) => setIncludeUserRepos(e.target.checked)}
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-950 bg-slate-950 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-200">
                      Include @{userQuery.data.metadata.login} repositories
                    </span>
                  </label>
                </div>

                {/* Organization Selection checklist atomic Component */}
                <OrgSelector
                  organizations={userQuery.data.metadata.organizations}
                  selectedOrgs={selectedOrgs}
                  onChangeSelectedOrgs={setSelectedOrgs}
                />
              </div>

              {/* Right Column */}
              <div className="lg:col-span-2 flex flex-col gap-8">
                {/* Profile Details atomic Component */}
                <ProfileCard
                  avatarUrl={userQuery.data.metadata.avatarUrl}
                  name={userQuery.data.metadata.name}
                  login={userQuery.data.metadata.login}
                  bio={userQuery.data.metadata.bio}
                  company={userQuery.data.metadata.company}
                  location={userQuery.data.metadata.location}
                  email={userQuery.data.metadata.email}
                  htmlUrl={userQuery.data.metadata.htmlUrl}
                  twitterUsername={userQuery.data.metadata.twitterUsername}
                  blog={userQuery.data.metadata.blog}
                  readme={userQuery.data.metadata.readme}
                />

                <AINarrator promptContext={clientIntel.promptContext} />
                {userQuery.data.externalContributions && (
                  <OpenSourceImpact
                    contributions={userQuery.data.externalContributions}
                    limit={contribLimit}
                    onLimitChange={setContribLimit}
                    onRefresh={handleRefresh}
                  />
                )}
                <FindingsList findings={clientIntel.findings} />
                <RecommendationsGrid
                  recommendations={clientIntel.recommendations}
                />
                {clientIntel.repositories && (
                  <RepositoriesTable
                    repositories={clientIntel.repositories}
                    username={userQuery.data.metadata.login}
                    externalContributions={clientIntel.externalContributions}
                  />
                )}
              </div>
            </div>
          </div>
        )}
        {/* Floating Toast Container */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 max-w-sm w-full pointer-events-none">
          {/* Toast 1: General Error */}
          {errorCombined &&
            !errorCombined.message.includes("Rate Limit Exceeded") &&
            !dismissedError && (
              <div className="relative pointer-events-auto p-5 bg-rose-950/90 border border-rose-500/30 rounded-2xl flex gap-3.5 items-start text-rose-200 shadow-2xl animate-slide-in">
                <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0" />
                <div className="space-y-1 pr-6">
                  <h4 className="font-bold text-sm">Analysis Failed</h4>
                  <p className="text-xs text-rose-300 leading-relaxed">
                    {errorCombined.message}
                  </p>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline mt-2 block"
                  >
                    Retry Request
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedError(true)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

          {/* Toast 2: Rate Limit */}
          {errorCombined?.message.includes("Rate Limit Exceeded") &&
            !dismissedRateLimit && (
              <div className="relative pointer-events-auto p-6 bg-slate-900/95 border border-rose-500/30 rounded-2xl shadow-2xl flex flex-col gap-4 text-left animate-slide-in">
                <div className="flex gap-4 items-start text-rose-200">
                  <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0 mt-1" />
                  <div className="space-y-1 pr-6">
                    <h4 className="font-extrabold text-sm text-rose-400">
                      GitHub API Rate Limit Exceeded
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Your search rate limit was reached. It will automatically
                      reset in{" "}
                      <strong className="text-indigo-400">
                        {cooldown || "a moment"}
                      </strong>
                      .
                    </p>
                  </div>
                </div>

                {/* PAT retry interface */}
                <div className="border-t border-slate-800/80 pt-4 mt-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <FaKey className="text-indigo-400 h-3.5 w-3.5" /> Have a
                      token?
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPatConfig(!showPatConfig)}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline"
                    >
                      {showPatConfig ? "Cancel" : "Add Git PAT"}
                    </button>
                  </div>
                  {showPatConfig && (
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="ghp_..."
                        value={patInput}
                        onChange={(e) => setPatInput(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500/40"
                      />
                      <button
                        type="button"
                        onClick={handleSavePat}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        Save & Retry
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedRateLimit(true)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

          {/* Toast 3: npm Suggestion */}
          {userQuery.data?.metadata?.suggestions?.npm &&
            !linkedNpm &&
            !dismissedNpm && (
              <div className="relative pointer-events-auto p-5 bg-indigo-950/90 border border-indigo-500/30 rounded-2xl flex flex-col justify-between gap-4 shadow-2xl animate-slide-in">
                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Suggested npm Identity
                  </h4>
                  <p className="text-sm text-slate-200 mt-1 pr-6">
                    Link npm account{" "}
                    <strong>
                      @{userQuery.data.metadata.suggestions.npm.username}
                    </strong>{" "}
                    to aggregate package download metrics?
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setLinkedNpm(
                        userQuery.data.metadata.suggestions?.npm?.username ||
                          "",
                      )
                    }
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const userOverride = prompt(
                        "Enter custom npm username to override:",
                      );
                      if (userOverride) setLinkedNpm(userOverride);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
                  >
                    Override
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedNpm(true)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

          {/* Toast 4: StackOverflow Suggestion */}
          {userQuery.data?.metadata?.suggestions?.stackoverflow &&
            !linkedSO &&
            !dismissedSO && (
              <div className="relative pointer-events-auto p-5 bg-indigo-950/90 border border-indigo-500/30 rounded-2xl flex flex-col justify-between gap-4 shadow-2xl animate-slide-in">
                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Suggested Stack Overflow Profile
                  </h4>
                  <p className="text-sm text-slate-200 mt-1 pr-6">
                    Link Stack Overflow profile ID{" "}
                    <strong>
                      {
                        userQuery.data.metadata.suggestions.stackoverflow
                          .profileId
                      }
                    </strong>{" "}
                    (
                    {
                      userQuery.data.metadata.suggestions.stackoverflow
                        .displayName
                    }
                    )?
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setLinkedSO(
                        userQuery.data.metadata.suggestions?.stackoverflow
                          ?.profileId || "",
                      )
                    }
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const soOverride = prompt(
                        "Enter custom Stack Overflow Profile ID to override:",
                      );
                      if (soOverride) setLinkedSO(soOverride);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
                  >
                    Override
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedSO(true)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}
