"use client";

import { detectInput } from "@ossintel/github-normalizer";
import {
  AlertTriangle,
  ArrowRight,
  Binary,
  Search,
  Sparkles,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { GithubIcon } from "@/components/icons";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hasGithubPat, setHasGithubPat] = useState(false);

  // Check token status on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      fetch("/api/auth/status", { credentials: "same-origin" })
        .then((r) => r.json())
        .then((data) => {
          setHasGithubPat(!!data.hasGithubPat);
        })
        .catch(() => {
          setHasGithubPat(false);
        });

      const params = new URLSearchParams(window.location.search);
      const authError = params.get("auth_error");
      if (authError) {
        setError(decodeURIComponent(authError));
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setError(null);

    const performAnalyze = async () => {
      try {
        const detection = detectInput(query);
        const externalBase = process.env.NEXT_PUBLIC_EXTERNAL_DASHBOARD_URL;
        let targetPath = "";

        if (detection.platform === "github") {
          if (detection.type === "repo") {
            targetPath = `/repo/${detection.owner}/${detection.repo}`;
          } else {
            targetPath = `/user/${detection.owner}`;
          }
        } else if (detection.platform === "npm") {
          if (detection.type === "package") {
            targetPath = `/repo/npm/${detection.name}`;
          } else {
            targetPath = `/user/${detection.name}?platform=npm`;
          }
        } else if (detection.platform === "stackoverflow") {
          targetPath = `/user/${detection.profileId}?platform=stackoverflow&id=${detection.profileId}`;
        } else {
          const cleaned = query.trim();
          if (cleaned.includes("/")) {
            targetPath = `/repo/${cleaned}`;
          } else {
            targetPath = `/user/${cleaned}`;
          }
        }

        if (externalBase) {
          window.location.href = `${externalBase}${targetPath}`;
        } else {
          router.push(targetPath);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Invalid search query";
        setError(message);
      }
    };
    performAnalyze();
  };

  const handleQuickSearch = async (q: string, searchType: "repo" | "user") => {
    const externalBase = process.env.NEXT_PUBLIC_EXTERNAL_DASHBOARD_URL;
    let targetPath = "";
    if (searchType === "repo") {
      const parts = q.split("/");
      targetPath = `/repo/${parts[0]}/${parts[1]}`;
    } else {
      targetPath = `/user/${q}`;
    }

    if (externalBase) {
      window.location.href = `${externalBase}${targetPath}`;
    } else {
      router.push(targetPath);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500/30 flex flex-col justify-between">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none opacity-50" />

      {/* Main Search Panel */}
      <main className="relative max-w-7xl mx-auto px-6 py-20 z-10 flex-1 flex flex-col justify-center items-center gap-10">
        <section className="flex flex-col gap-8 text-center max-w-3xl mx-auto w-full">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-none animate-fade-in pb-4">
              Open Source Intelligence
            </h2>
            <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto font-medium">
              Unified platform metrics, impact scorecards, active community
              health, and security risk audits for developers, repositories, and
              organizations.
            </p>
            {process.env.NEXT_PUBLIC_EXTERNAL_DASHBOARD_URL && (
              <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-semibold max-w-max mx-auto">
                <span>
                  Showcase Redirect: Analyses will open in the Vercel Cloud
                  platform.
                </span>
              </div>
            )}
          </div>

          <form
            onSubmit={handleAnalyze}
            className="p-1.5 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2.5 w-full"
          >
            <div className="flex-1 flex items-center gap-3 px-3 bg-slate-950/50 border border-slate-800 rounded-xl focus-within:border-indigo-500/50 transition-colors">
              <Search className="h-5 w-5 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Enter GitHub user, organization, repository, or npm package URL..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-transparent border-0 outline-none w-full py-3.5 text-slate-200 placeholder:text-slate-600 text-sm font-medium"
              />
            </div>

            <div className="flex gap-2 justify-center">
              <button
                type="submit"
                className="px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 whitespace-nowrap animate-fade-in"
              >
                Analyze <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* GitHub Connection Banner */}
          {hasGithubPat ? (
            <div className="p-4 bg-emerald-950/10 border border-emerald-500/20 rounded-2xl max-w-xl mx-auto w-full flex items-center justify-between gap-4 mt-2 animate-fade-in-up text-left">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />{" "}
                  Connected to GitHub
                </h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Ecosystem queries are running with an elevated limit of 5,000
                  requests/hour.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  setHasGithubPat(false);
                }}
                className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-950/60 border border-rose-900/30 text-rose-300 rounded-xl text-xs font-bold transition-all shrink-0"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl max-w-xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 animate-fade-in-up text-left">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Enhance
                  API Limits
                </h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Connect your GitHub account to increase API rate limits to
                  5,000 requests/hour. We only request basic public profile
                  access.
                </p>
              </div>
              <a
                href="/api/auth/github"
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-md"
              >
                <GithubIcon className="h-3.5 w-3.5 shrink-0" /> Connect GitHub
              </a>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="max-w-lg mx-auto w-full p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex gap-3 items-center text-rose-300 text-xs font-semibold leading-normal">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Examples */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <span className="text-xs font-semibold text-slate-500">
              Quick searches:
            </span>
            <button
              type="button"
              onClick={() => handleQuickSearch("facebook/react", "repo")}
              className="px-3 py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 rounded-lg text-xs font-semibold text-slate-300 transition-colors"
            >
              facebook/react
            </button>
            <button
              type="button"
              onClick={() => handleQuickSearch("ossintel/ossintel", "repo")}
              className="px-3 py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 rounded-lg text-xs font-semibold text-slate-300 transition-colors"
            >
              ossintel/ossintel
            </button>
            <button
              type="button"
              onClick={() => handleQuickSearch("mayank1513", "user")}
              className="px-3 py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 rounded-lg text-xs font-semibold text-slate-300 transition-colors"
            >
              mayank1513
            </button>
          </div>
        </section>
      </main>

      {/* Structured SEO JSON-LD block */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data injection
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "OSSIntel",
            url: "https://ossintel.js.org",
            description:
              "Unified platform metrics, impact scorecards, active community health, and security risk audits for developers, repositories, and organizations.",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "All",
            author: {
              "@type": "Person",
              name: "Mayank Kumar Chaudhari",
            },
            license: "https://opensource.org/licenses/MIT",
            softwareHelp: "https://ossintel.js.org/docs",
            hasPart: [
              {
                "@type": "SoftwareSourceCode",
                name: "@ossintel/scoring",
                description: "Deterministic reputation metrics engine",
                codeRepository:
                  "https://github.com/ossintel/ossintel/tree/main/packages/scoring",
              },
              {
                "@type": "SoftwareSourceCode",
                name: "@ossintel/github-normalizer",
                description: "GitHub API data normalizer",
                codeRepository:
                  "https://github.com/ossintel/ossintel/tree/main/packages/github-normalizer",
              },
              {
                "@type": "SoftwareSourceCode",
                name: "@ossintel/insights",
                description: "Rule-based audit insights engine",
                codeRepository:
                  "https://github.com/ossintel/ossintel/tree/main/packages/insights",
              },
            ],
          }),
        }}
      />

      {/* Reusable Packages Showcase Section */}
      <section className="relative border-t border-slate-900 bg-slate-950/40 w-full py-24 z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-widest">
              Modular Architecture
            </h3>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
              Powered by Reusable Core Packages
            </h2>
            <p className="text-sm md:text-base text-slate-400 font-medium leading-relaxed">
              OSSIntel is built as a set of decoupled, standard npm modules.
              Developers can install, extend, and integrate these engines in
              their own applications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Scoring Package Card */}
            <div className="group relative p-6 bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/30 rounded-3xl transition-all duration-300 flex flex-col justify-between hover:shadow-indigo-500/5 hover:shadow-2xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-tr-3xl rounded-bl-full pointer-events-none group-hover:from-indigo-500/15 transition-all" />
              <div className="space-y-4">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl w-max text-indigo-400 group-hover:border-indigo-500/30 group-hover:text-indigo-300 transition-all">
                  <Workflow className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-slate-200">
                    @ossintel/scoring
                  </h4>
                  <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
                    Deterministic reputation metrics engine
                  </p>
                </div>
                <p className="text-xs text-slate-450 leading-relaxed">
                  Evaluates software health, community activity, maintainer
                  metrics, and organization footprints using pure, deterministic
                  mathematical models.
                </p>
                <ul className="text-[11px] text-slate-500 space-y-1">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />{" "}
                    No side-effects, fully deterministic
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />{" "}
                    Extensible weights and tiers
                  </li>
                </ul>
              </div>
              <div className="pt-6 mt-auto">
                <Link
                  href="/docs/scoring"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors group/link"
                >
                  Explore API Docs{" "}
                  <ArrowRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Normalizer Package Card */}
            <div className="group relative p-6 bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/30 rounded-3xl transition-all duration-300 flex flex-col justify-between hover:shadow-indigo-500/5 hover:shadow-2xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-tr-3xl rounded-bl-full pointer-events-none group-hover:from-indigo-500/15 transition-all" />
              <div className="space-y-4">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl w-max text-indigo-400 group-hover:border-indigo-500/30 group-hover:text-indigo-300 transition-all">
                  <Binary className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-slate-200">
                    @ossintel/github-normalizer
                  </h4>
                  <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
                    GitHub API data normalizer
                  </p>
                </div>
                <p className="text-xs text-slate-450 leading-relaxed">
                  Fetches and normalizes raw GitHub REST/GraphQL payloads,
                  handling paginated requests, cache mapping, and rate limits
                  gracefully.
                </p>
                <ul className="text-[11px] text-slate-500 space-y-1">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />{" "}
                    Auto-paginated contributions fetcher
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />{" "}
                    Input type detection (user, org, repo)
                  </li>
                </ul>
              </div>
              <div className="pt-6 mt-auto">
                <Link
                  href="/docs/github-normalizer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors group/link"
                >
                  Explore API Docs{" "}
                  <ArrowRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Insights Package Card */}
            <div className="group relative p-6 bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/30 rounded-3xl transition-all duration-300 flex flex-col justify-between hover:shadow-indigo-500/5 hover:shadow-2xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-tr-3xl rounded-bl-full pointer-events-none group-hover:from-indigo-500/15 transition-all" />
              <div className="space-y-4">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl w-max text-indigo-400 group-hover:border-indigo-500/30 group-hover:text-indigo-300 transition-all">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-slate-200">
                    @ossintel/insights
                  </h4>
                  <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
                    Rule-based audit insights engine
                  </p>
                </div>
                <p className="text-xs text-slate-450 leading-relaxed">
                  Generates natural language software findings, flags key risks,
                  outlines actionable recommendations, and compiles LLM context
                  blocks.
                </p>
                <ul className="text-[11px] text-slate-500 space-y-1">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />{" "}
                    Configurable ruleset definitions
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />{" "}
                    Clean prompt context export
                  </li>
                </ul>
              </div>
              <div className="pt-6 mt-auto">
                <Link
                  href="/docs/insights"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors group/link"
                >
                  Explore API Docs{" "}
                  <ArrowRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Utility Packages Sub-grid */}
          <div className="pt-8 border-t border-slate-900/60 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5">
              <h5 className="text-sm font-bold text-slate-300">
                Additional Modules
              </h5>
              <p className="text-xs text-slate-400 leading-normal">
                Includes{" "}
                <Link href="/docs/npm">
                  <code className="text-indigo-400 font-mono">
                    @ossintel/npm
                  </code>{" "}
                  (NPM registry statistics fetcher)
                </Link>{" "}
                and{" "}
                <Link href="/docs/stackoverflow">
                  <code className="text-indigo-400 font-mono">
                    @ossintel/stackoverflow
                  </code>{" "}
                </Link>
                (StackOverflow profile statistics fetcher).
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/docs"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/10 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
              >
                Ecosystem Overview
              </Link>
              <Link
                href="/docs/scoring"
                className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-750 hover:bg-slate-900/80 text-slate-300 text-xs font-bold rounded-xl transition-all whitespace-nowrap"
              >
                Read Scoring Docs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-900 bg-slate-950/20 z-10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <span>&copy; 2026 OSSIntel. Licensed under MIT.</span>
          <a
            href="https://mayankchaudhari.com/"
            target="_blank"
            rel="noreferrer noopener"
            className="flex gap-4"
          >
            <span className="text-slate-400">Mayank Chaudhari</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
