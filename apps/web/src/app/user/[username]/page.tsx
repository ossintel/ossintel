"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  KeyRound,
  RefreshCw,
  User,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AINarrator } from "@/components/dashboard/ai-narrator";
import { DimensionBreakdown } from "@/components/dashboard/dimension-breakdown";
import { EcosystemGraph } from "@/components/dashboard/ecosystem-graph";
import { FindingsList } from "@/components/dashboard/findings-list";
import { OpenSourceImpact } from "@/components/dashboard/open-source-impact";
import { OrgSelector } from "@/components/dashboard/org-selector";
import { OverviewCard } from "@/components/dashboard/overview-card";
import { PlatformCards } from "@/components/dashboard/platform-cards";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { RecommendationsGrid } from "@/components/dashboard/recommendations-grid";
import { RepositoriesTable } from "@/components/dashboard/repositories-table";
import { SkillRadar } from "@/components/dashboard/skill-radar";
import { GithubIcon } from "@/components/icons";
import { ErrorAlert } from "@/components/ui/error-alert";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { RateLimitWarning } from "@/components/ui/rate-limit-warning";
import { SuggestionToast } from "@/components/ui/suggestion-toast";
import { useDeveloperScores } from "@/hooks/use-developer-scores";
import { useGithubOrgs } from "@/hooks/use-github-orgs";
import { useGithubUser } from "@/hooks/use-github-user";
import { useNpmUser } from "@/hooks/use-npm-user";
import { useStackOverflowUser } from "@/hooks/use-stackoverflow-user";
import { saveSecureToken } from "@/lib/api-client";

const STEPS = [
  "Establishing connection to GitHub APIs...",
  "Retrieving portfolio profile metadata...",
  "Analyzing public repositories stats...",
  "Running scoring models & metrics engine...",
  "Generating recommendations & findings...",
  "Finalizing Open Source Intelligence report...",
];

export default function UserPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-slate-400">
              Loading Dashboard...
            </span>
          </div>
        </div>
      }
    >
      <UserDashboardContent />
    </Suspense>
  );
}

function UserDashboardContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = params.username as string;

  const entryPlatform = searchParams.get("platform") || "github";
  const entryId = searchParams.get("id") || "";

  // Active identities state
  const [githubUsername, setGithubUsername] = useState<string>(
    entryPlatform === "github" ? username : "",
  );
  const [linkedNpm, setLinkedNpm] = useState<string>("");
  const [linkedSO, setLinkedSO] = useState<string>("");

  const handleLinkNpm = (npmName: string) => {
    setLinkedNpm(npmName);
    if (githubUsername && typeof window !== "undefined") {
      if (npmName) {
        localStorage.setItem(`ossintel:npm:${githubUsername}`, npmName);
      } else {
        localStorage.removeItem(`ossintel:npm:${githubUsername}`);
      }
    }
  };

  const handleLinkSO = (soId: string) => {
    setLinkedSO(soId);
    if (githubUsername && typeof window !== "undefined") {
      if (soId) {
        localStorage.setItem(`ossintel:so:${githubUsername}`, soId);
      } else {
        localStorage.removeItem(`ossintel:so:${githubUsername}`);
      }
    }
  };

  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [includeUserRepos, setIncludeUserRepos] = useState<boolean>(true);
  const [contribLimit, setContribLimit] = useState<number>(Infinity);

  // Toast/Alert dismiss states
  const [dismissedNpm, setDismissedNpm] = useState<boolean>(false);
  const [dismissedSO, setDismissedSO] = useState<boolean>(false);
  const [dismissedRateLimit, setDismissedRateLimit] = useState<boolean>(false);
  const [dismissedError, setDismissedError] = useState<boolean>(false);

  // 1. Fetch GitHub data if Github account is linked
  const userQuery = useGithubUser(githubUsername, contribLimit);

  // 2. Fetch selected organizations data
  const orgsQuery = useGithubOrgs(selectedOrgs);

  // 3. Fetch Npm data if npm account is linked
  const npmQuery = useNpmUser(linkedNpm);

  // 4. Fetch StackOverflow data if SO account is linked
  const soQuery = useStackOverflowUser(linkedSO);

  // API Key configurations state
  const [patInput, setPatInput] = useState("");
  const [soApiKeyInput, setSoApiKeyInput] = useState("");
  const [showTokensConfig, setShowTokensConfig] = useState(false);
  const [hasGithubPat, setHasGithubPat] = useState(false);
  const [hasSoApiKey, setHasSoApiKey] = useState(false);

  // Rate limiting countdown state
  const [rateLimitReset, setRateLimitReset] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState("");

  const isInitialLoad = useRef(true);

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

  // Load tokens and linked identities from storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      fetch("/api/auth/status")
        .then((r) => r.json())
        .then((data) => {
          setHasGithubPat(!!data.hasGithubPat);
          setHasSoApiKey(!!data.hasStackOverflowKey);
        })
        .catch(() => {
          setHasGithubPat(false);
          setHasSoApiKey(false);
        });

      // Load linked identities
      let initialNpm = entryPlatform === "npm" ? username : "";
      let initialSO =
        entryPlatform === "stackoverflow" ? entryId || username : "";

      if (githubUsername) {
        const savedNpm = localStorage.getItem(`ossintel:npm:${githubUsername}`);
        if (savedNpm) initialNpm = savedNpm;

        const savedSO = localStorage.getItem(`ossintel:so:${githubUsername}`);
        if (savedSO) initialSO = savedSO;
      }

      if (initialNpm) setLinkedNpm(initialNpm);
      if (initialSO) setLinkedSO(initialSO);
    }
  }, [githubUsername, entryPlatform, entryId, username]);

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

  // Auto-suggest linking GitHub from NPM packages
  useEffect(() => {
    if (entryPlatform === "npm" && npmQuery.data?.packages && !githubUsername) {
      // Look for a github repository owner in packages metadata
      for (const pkg of npmQuery.data.packages) {
        if (pkg.repository?.includes("github.com/")) {
          const match = pkg.repository.match(/github\.com\/([a-zA-Z0-9_-]+)/);
          if (match?.[1]) {
            const confirmed = window.confirm(
              `We detected GitHub user @${match[1]} from your npm package repository links. Link this GitHub profile?`,
            );
            if (confirmed) {
              setGithubUsername(match[1]);
            }
            break;
          }
        }
      }
    }
  }, [entryPlatform, npmQuery.data, githubUsername]);

  // Auto-suggest linking GitHub from Stack Overflow name
  useEffect(() => {
    if (
      entryPlatform === "stackoverflow" &&
      soQuery.data?.displayName &&
      !githubUsername
    ) {
      const confirmed = window.confirm(
        `Link GitHub profile matching Stack Overflow name @${soQuery.data.displayName}?`,
      );
      if (confirmed) {
        setGithubUsername(soQuery.data.displayName);
      }
    }
  }, [entryPlatform, soQuery.data, githubUsername]);

  // Handle manual full refresh
  const handleRefresh = async () => {
    setDismissedNpm(false);
    setDismissedSO(false);
    setDismissedRateLimit(false);
    setDismissedError(false);
    if (githubUsername) {
      await userQuery.refresh();
      await orgsQuery.refreshAll();
    }
    if (linkedNpm) {
      await npmQuery.refresh();
    }
    if (linkedSO) {
      await soQuery.refresh();
    }
  };

  const handleSaveTokens = async () => {
    if (patInput) {
      await saveSecureToken(patInput, "github");
      setHasGithubPat(true);
    } else {
      await saveSecureToken("", "github");
      setHasGithubPat(false);
    }

    if (soApiKeyInput) {
      await saveSecureToken(soApiKeyInput, "stackoverflow");
      setHasSoApiKey(true);
    } else {
      await saveSecureToken("", "stackoverflow");
      setHasSoApiKey(false);
    }

    setShowTokensConfig(false);
    setRateLimitReset(null);
    setCooldown("");
    handleRefresh();
  };

  // Extract social links (LinkedIn and Stack Overflow) from user metadata if available
  const linkedinUrl = useMemo(() => {
    const metadata = userQuery.data?.metadata as
      | Record<string, unknown>
      | undefined;
    const socialLinks = metadata?.socialLinks as string[] | undefined;
    return (
      socialLinks?.find((url: string) => url.includes("linkedin.com")) || null
    );
  }, [userQuery.data]);

  const stackoverflowUrl = useMemo(() => {
    if (linkedSO) return `https://stackoverflow.com/users/${linkedSO}`;
    const metadata = userQuery.data?.metadata as
      | Record<string, unknown>
      | undefined;
    const socialLinks = metadata?.socialLinks as string[] | undefined;
    return (
      socialLinks?.find((url: string) => url.includes("stackoverflow.com")) ||
      null
    );
  }, [linkedSO, userQuery.data]);

  const npmStats = useMemo(() => {
    if (!npmQuery.data) return null;
    return {
      totalDownloads: npmQuery.data.totalDownloads,
      packageCount: npmQuery.data.packages.length,
      topPackage: npmQuery.data.packages[0]?.name || undefined,
    };
  }, [npmQuery.data]);

  const soStats = useMemo(() => {
    if (!soQuery.data) return null;
    return {
      reputation: soQuery.data.reputation,
      badgeCount: soQuery.data.badgeCounts,
      topTags: soQuery.data.topTags.slice(0, 3).map((t) => t.name),
    };
  }, [soQuery.data]);

  const impactStats = useMemo(() => {
    if (!userQuery.data) return null;
    const repos = userQuery.data.repositories || [];
    const totalStars = repos.reduce(
      (acc, r) => acc + (r.stargazersCount || 0),
      0,
    );
    const totalForks = repos.reduce((acc, r) => acc + (r.forksCount || 0), 0);
    const prsMerged = (userQuery.data.externalContributions || []).filter(
      (c) => c.mergedAt !== null,
    ).length;
    return {
      stars: totalStars,
      forks: totalForks,
      prsMerged,
    };
  }, [userQuery.data]);

  // Perform dynamic score calculations
  const clientIntel = useDeveloperScores({
    userRepos: userQuery.data?.repositories || [],
    orgsQueries: orgsQuery.queries,
    includeUserRepos,
    npmUser: npmQuery.data || null,
    stackoverflowUser: soQuery.data || null,
    userLogin: userQuery.data?.metadata?.login || githubUsername || "",
    userName: userQuery.data?.metadata?.name || githubUsername || "",
    externalContributions: userQuery.data?.externalContributions || [],
    organizations: userQuery.data?.metadata?.organizations || [],
  });

  const fullAnalysisData = useMemo(() => {
    return {
      ...clientIntel,
      type: "user" as const,
      metadata: userQuery.data?.metadata || {
        login: githubUsername,
        name: githubUsername,
      },
    };
  }, [clientIntel, userQuery.data, githubUsername]);

  const isLoadingCombined =
    userQuery.isLoading ||
    orgsQuery.isLoading ||
    npmQuery.isLoading ||
    soQuery.isLoading;
  const isFetchingCombined =
    userQuery.isFetching ||
    orgsQuery.isFetching ||
    npmQuery.isFetching ||
    soQuery.isFetching;
  const errorCombined =
    userQuery.error || orgsQuery.error || npmQuery.error || soQuery.error;

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
        <LoadingOverlay
          isLoading={isLoadingCombined}
          title={`Syncing OSS Identity for ${githubUsername || username || "developer"}...`}
          steps={STEPS}
        />

        {/* Dashboard Panels */}
        {!githubUsername && !isLoadingCombined ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 max-w-md mx-auto space-y-6">
            <AlertTriangle className="h-12 w-12 text-indigo-400 animate-pulse" />
            <div>
              <h3 className="text-lg font-bold text-slate-200">
                GitHub Connection Required
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Unified scoring and repository analysis require a linked GitHub
                profile. Enter a GitHub profile username below to bind your
                metrics:
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <input
                type="text"
                placeholder="Enter GitHub Username..."
                className="bg-slate-900 border border-slate-800 rounded-xl p-3 w-full text-slate-200 outline-none focus:border-indigo-500 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setGithubUsername((e.target as HTMLInputElement).value);
                  }
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget
                    .previousSibling as HTMLInputElement;
                  if (input.value) setGithubUsername(input.value);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
              >
                Link
              </button>
            </div>
          </div>
        ) : (
          userQuery.data &&
          clientIntel &&
          !isLoadingCombined && (
            <div className="space-y-8 animate-fade-in">
              {/* Status Header Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <User className="h-3.5 w-3.5" /> Unified OSS Identity
                  </div>
                  {isFetchingCombined && (
                    <span className="text-xs text-indigo-400 font-semibold animate-pulse">
                      Refreshing cache items...
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTokensConfig(!showTokensConfig)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 border border-slate-800 text-slate-350 hover:text-white text-xs font-bold rounded-xl transition-all"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-indigo-400" /> API
                    Keys
                  </button>

                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="flex items-center gap-1 px-4 py-2 bg-slate-950 border border-slate-800 text-slate-350 hover:text-white text-xs font-bold rounded-xl transition-all"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh Analysis
                  </button>
                </div>
              </div>

              {/* Tokens Config panel */}
              {showTokensConfig && (
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 max-w-xl mx-auto animate-fade-in-up">
                  <h4 className="text-sm font-bold text-slate-200">
                    Ecosystem Tokens & Credentials
                  </h4>

                  <div className="space-y-3 text-left">
                    <div>
                      <label
                        htmlFor="github-token-input"
                        className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1"
                      >
                        GitHub Personal Access Token (PAT)
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="github-token-input"
                          type="password"
                          placeholder={
                            hasGithubPat
                              ? "•••••••••••••••• (Configured)"
                              : "Enter GitHub PAT..."
                          }
                          value={patInput}
                          onChange={(e) => setPatInput(e.target.value)}
                          className="bg-slate-950 border border-slate-800 outline-none rounded-lg p-2.5 flex-1 text-slate-200 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (patInput) {
                              await saveSecureToken(patInput, "github");
                              setHasGithubPat(true);
                              setPatInput("");
                            } else {
                              await saveSecureToken("", "github");
                              setHasGithubPat(false);
                            }
                            setShowTokensConfig(false);
                            setRateLimitReset(null);
                            setCooldown("");
                            handleRefresh();
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shrink-0"
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          htmlFor="stackoverflow-key-input"
                          className="text-xs font-bold text-slate-400 uppercase tracking-wider block"
                        >
                          Stack Exchange API Key
                        </label>
                        <a
                          href="https://stackapps.com/apps/oauth/register"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5"
                        >
                          Get API Key <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                      <div className="flex gap-2">
                        <input
                          id="stackoverflow-key-input"
                          type="password"
                          placeholder={
                            hasSoApiKey
                              ? "•••••••••••••••• (Configured)"
                              : "Enter Stack Overflow Key..."
                          }
                          value={soApiKeyInput}
                          onChange={(e) => setSoApiKeyInput(e.target.value)}
                          className="bg-slate-950 border border-slate-800 outline-none rounded-lg p-2.5 flex-1 text-slate-200 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (soApiKeyInput) {
                              await saveSecureToken(
                                soApiKeyInput,
                                "stackoverflow",
                              );
                              setHasSoApiKey(true);
                              setSoApiKeyInput("");
                            } else {
                              await saveSecureToken("", "stackoverflow");
                              setHasSoApiKey(false);
                            }
                            setShowTokensConfig(false);
                            handleRefresh();
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shrink-0"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTokensConfig(false)}
                      className="px-4 py-2 bg-slate-950 text-slate-400 hover:text-white rounded-xl text-xs font-bold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                  <OverviewCard
                    data={fullAnalysisData}
                    npmStats={npmStats}
                    soStats={soStats}
                    impactStats={impactStats}
                  />
                  <DimensionBreakdown scores={clientIntel.scores} />

                  {/* Identity Resolution Links */}
                  <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-4">
                    <h4 className="text-sm font-bold text-slate-200">
                      Linked OSS Identities
                    </h4>
                    <div className="space-y-3">
                      {/* GitHub */}
                      <div className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-850 rounded-xl">
                        <div className="flex items-center gap-2">
                          <GithubIcon className="h-4 w-4 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-200">
                            GitHub
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-400 truncate max-w-[120px]">
                          {githubUsername ? `@${githubUsername}` : "Not linked"}
                        </span>
                      </div>

                      {/* npm */}
                      <div className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-850 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 bg-red-500/10 text-red-400 flex items-center justify-center rounded text-[10px] font-bold">
                            N
                          </div>
                          <span className="text-xs font-semibold text-slate-200">
                            npm
                          </span>
                        </div>
                        {linkedNpm ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-400 truncate max-w-[80px]">
                              ~{linkedNpm}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleLinkNpm("")}
                              className="text-[10px] text-red-500 hover:underline"
                            >
                              Unlink
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const val = prompt("Enter npm username:");
                              if (val) handleLinkNpm(val);
                            }}
                            className="text-[10px] text-indigo-400 hover:underline font-bold"
                          >
                            Link Profile
                          </button>
                        )}
                      </div>

                      {/* Stack Overflow */}
                      <div className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-850 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 bg-orange-500/10 text-orange-400 flex items-center justify-center rounded text-[10px] font-bold">
                            S
                          </div>
                          <span className="text-xs font-semibold text-slate-200">
                            Stack Overflow
                          </span>
                        </div>
                        {linkedSO ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-400 truncate max-w-[80px]">
                              ID: {linkedSO}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleLinkSO("")}
                              className="text-[10px] text-red-500 hover:underline"
                            >
                              Unlink
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const val = prompt(
                                "Enter Stack Overflow User ID:",
                              );
                              if (val) handleLinkSO(val);
                            }}
                            className="text-[10px] text-indigo-400 hover:underline font-bold"
                          >
                            Link Profile
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

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
                        Include @{githubUsername} repositories
                      </span>
                    </label>
                  </div>

                  {/* Organization Selection checklist Component */}
                  <OrgSelector
                    organizations={
                      userQuery.data?.metadata?.organizations || []
                    }
                    selectedOrgs={selectedOrgs}
                    onChangeSelectedOrgs={setSelectedOrgs}
                  />
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                  {/* Profile Details Component */}
                  <ProfileCard
                    avatarUrl={userQuery.data?.metadata?.avatarUrl}
                    name={userQuery.data?.metadata?.name}
                    login={userQuery.data?.metadata?.login}
                    bio={userQuery.data?.metadata?.bio}
                    company={userQuery.data?.metadata?.company}
                    location={userQuery.data?.metadata?.location}
                    email={userQuery.data?.metadata?.email}
                    htmlUrl={userQuery.data?.metadata?.htmlUrl}
                    twitterUsername={userQuery.data?.metadata?.twitterUsername}
                    blog={userQuery.data?.metadata?.blog}
                    readme={userQuery.data?.metadata?.readme}
                    npmUrl={
                      linkedNpm ? `https://www.npmjs.com/~${linkedNpm}` : null
                    }
                    stackoverflowUrl={stackoverflowUrl}
                    linkedinUrl={linkedinUrl}
                  />

                  {/* Skill Radar */}
                  {clientIntel.scores.skills &&
                    clientIntel.scores.skills.length > 0 && (
                      <SkillRadar skills={clientIntel.scores.skills} />
                    )}

                  {/* Ecosystem Graph */}
                  {clientIntel.scores.skills &&
                    clientIntel.scores.skills.length > 0 && (
                      <EcosystemGraph skills={clientIntel.scores.skills} />
                    )}

                  {/* Granular Platform Stats */}
                  <PlatformCards
                    npmUser={npmQuery.data || null}
                    stackoverflowUser={soQuery.data || null}
                  />

                  <AINarrator promptContext={clientIntel.promptContext} />

                  {userQuery.data?.externalContributions && (
                    <OpenSourceImpact
                      contributions={userQuery.data.externalContributions}
                      limit={contribLimit}
                      onLimitChange={setContribLimit}
                      onRefresh={handleRefresh}
                      badges={clientIntel.scores.badges}
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
          )
        )}

        {/* Floating Toast Container */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 max-w-sm w-full pointer-events-none">
          {/* Toast 1: General Error */}
          {errorCombined &&
            !errorCombined.message.includes("Rate Limit Exceeded") &&
            !dismissedError && (
              <ErrorAlert
                message={errorCombined.message}
                onRetry={handleRefresh}
                onDismiss={() => setDismissedError(true)}
              />
            )}

          {/* Toast 2: Rate Limit */}
          {userQuery.error?.message?.includes("Rate Limit Exceeded") &&
            !dismissedRateLimit && (
              <RateLimitWarning
                cooldown={cooldown}
                patInput={patInput}
                setPatInput={setPatInput}
                showPatConfig={showTokensConfig}
                setShowPatConfig={setShowTokensConfig}
                onSavePat={handleSaveTokens}
                onDismiss={() => setDismissedRateLimit(true)}
              />
            )}

          {/* Toast 3: npm Suggestion */}
          {userQuery.data?.metadata?.suggestions?.npm &&
            !linkedNpm &&
            !dismissedNpm && (
              <SuggestionToast
                title="Suggested npm Identity"
                message={`Link npm account @${userQuery.data.metadata.suggestions.npm.username} to aggregate package download metrics?`}
                onConfirm={() =>
                  handleLinkNpm(
                    userQuery.data.metadata.suggestions?.npm?.username || "",
                  )
                }
                onOverride={() => {
                  const userOverride = prompt(
                    "Enter custom npm username to override:",
                  );
                  if (userOverride) handleLinkNpm(userOverride);
                }}
                onDismiss={() => setDismissedNpm(true)}
              />
            )}

          {/* Toast 4: StackOverflow Suggestion */}
          {userQuery.data?.metadata?.suggestions?.stackoverflow &&
            !linkedSO &&
            !dismissedSO && (
              <SuggestionToast
                title="Suggested Stack Overflow Profile"
                message={`Link Stack Overflow profile ID ${userQuery.data.metadata.suggestions.stackoverflow.profileId} (${userQuery.data.metadata.suggestions.stackoverflow.displayName})?`}
                onConfirm={() =>
                  handleLinkSO(
                    userQuery.data.metadata.suggestions?.stackoverflow
                      ?.profileId || "",
                  )
                }
                onOverride={() => {
                  const soOverride = prompt(
                    "Enter custom Stack Overflow Profile ID to override:",
                  );
                  if (soOverride) handleLinkSO(soOverride);
                }}
                onDismiss={() => setDismissedSO(true)}
              />
            )}
        </div>
      </main>
    </div>
  );
}
