"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Building,
  Sparkles,
  User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AINarrator } from "@/components/dashboard/ai-narrator";
import { DimensionBreakdown } from "@/components/dashboard/dimension-breakdown";
import { FindingsList } from "@/components/dashboard/findings-list";
import { OverviewCard } from "@/components/dashboard/overview-card";
import { RecommendationsGrid } from "@/components/dashboard/recommendations-grid";
import { RepositoriesTable } from "@/components/dashboard/repositories-table";
import type { AnalysisData } from "@/lib/types";

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

  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Identity aggregation state
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [linkedNpm, setLinkedNpm] = useState<string>("");
  const [linkedSO, setLinkedSO] = useState<string>("");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!username) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem("github_token") || "";
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: username,
            token,
            selectedOrgs,
            linkedNpm,
            linkedSO,
          }),
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(
            result.error || "Failed to analyze developer portfolio",
          );
        }
        setData(result);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to fetch developer details";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [username, selectedOrgs, linkedNpm, linkedSO]);

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
            <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold">OSSIntel</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-6 py-12 z-10 flex flex-col gap-10">
        {loading && (
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

        {error && (
          <div className="max-w-lg mx-auto w-full p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3.5 items-start text-rose-200">
            <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm">Analysis Failed</h4>
              <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-8 animate-fade-in">
            {/* Identity Badge Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {data.type === "org" ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <Building className="h-3.5 w-3.5" /> Organization Profile
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <User className="h-3.5 w-3.5" /> Developer Maintainer
                    Profile
                  </div>
                )}
              </div>
            </div>

            {/* Suggestions Prompts */}
            {data.type === "user" && data.metadata.suggestions && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.metadata.suggestions.npm && !linkedNpm && (
                  <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex flex-col justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        Suggested npm Identity
                      </h4>
                      <p className="text-sm text-slate-200 mt-1">
                        Link npm account{" "}
                        <strong>
                          @{data.metadata.suggestions.npm.username}
                        </strong>{" "}
                        to aggregate package download metrics?
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setLinkedNpm(
                            data.metadata.suggestions?.npm?.username || "",
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
                  </div>
                )}
                {data.metadata.suggestions.stackoverflow && !linkedSO && (
                  <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex flex-col justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        Suggested Stack Overflow Profile
                      </h4>
                      <p className="text-sm text-slate-200 mt-1">
                        Link Stack Overflow profile ID{" "}
                        <strong>
                          {data.metadata.suggestions.stackoverflow.profileId}
                        </strong>{" "}
                        ({data.metadata.suggestions.stackoverflow.displayName})?
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setLinkedSO(
                            data.metadata.suggestions?.stackoverflow
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
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                <OverviewCard data={data} />
                <DimensionBreakdown scores={data.scores} />

                {/* Organization Selection checklist */}
                {data.type === "user" &&
                  data.metadata.organizations &&
                  data.metadata.organizations.length > 0 && (
                    <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
                      <h4 className="text-sm font-bold text-slate-200">
                        Include Organization Repositories
                      </h4>
                      <p className="text-xs text-slate-400">
                        Select which organizations' repositories should
                        contribute to your lifetime impact and scores.
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {data.metadata.organizations.map((org) => (
                          <label
                            key={org.login}
                            className="flex items-center gap-3 p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl cursor-pointer hover:border-slate-700 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedOrgs.includes(org.login)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedOrgs([...selectedOrgs, org.login]);
                                } else {
                                  setSelectedOrgs(
                                    selectedOrgs.filter((o) => o !== org.login),
                                  );
                                }
                              }}
                              className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-950 bg-slate-950"
                            />
                            {/* biome-ignore lint/performance/noImgElement: Github avatars are dynamic external resources loaded at runtime */}
                            <img
                              src={org.avatarUrl}
                              alt={org.login}
                              className="h-6 w-6 rounded-md object-cover"
                            />
                            <span className="text-xs font-semibold text-slate-200">
                              @{org.login}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Right Column */}
              <div className="lg:col-span-2 flex flex-col gap-8">
                <AINarrator promptContext={data.promptContext} />
                <FindingsList findings={data.findings} />
                <RecommendationsGrid recommendations={data.recommendations} />
                {data.repositories && (
                  <RepositoriesTable repositories={data.repositories} />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
