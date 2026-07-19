"use client";

import { detectInput } from "@ossintel/github-normalizer";
import {
  AlertTriangle,
  ArrowRight,
  Globe,
  Search,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { GithubIcon } from "@/components/icons";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [token, setToken] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setError(null);

    if (token) {
      sessionStorage.setItem("github_token", token);
    } else {
      sessionStorage.removeItem("github_token");
    }

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
          targetPath = `/user/${detection.name}`;
        }
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

  const handleQuickSearch = (q: string, searchType: "repo" | "user") => {
    if (token) {
      sessionStorage.setItem("github_token", token);
    } else {
      sessionStorage.removeItem("github_token");
    }

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

      {/* Header */}
      <header className="relative border-b border-slate-900 bg-slate-950/20 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/10">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
                OSSIntel
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Open Source Intelligence Platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/mayank1513/ossintel"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <GithubIcon className="h-4 w-4" /> GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Main Search Panel */}
      <main className="relative max-w-7xl mx-auto px-6 py-20 z-10 flex-1 flex flex-col justify-center items-center gap-10">
        <section className="flex flex-col gap-8 text-center max-w-3xl mx-auto w-full">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-none animate-fade-in">
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
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-3 border rounded-xl transition-all ${
                  showSettings || token
                    ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
                    : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                }`}
                title="GitHub PAT Settings"
              >
                <Globe className="h-5 w-5" />
              </button>
              <button
                type="submit"
                className="px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Analyze <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Token Settings */}
          {showSettings && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-left max-w-xl mx-auto w-full space-y-2 animate-fade-in-up">
              <label
                htmlFor="github-pat-input"
                className="text-xs font-bold text-slate-400 uppercase tracking-wider block"
              >
                GitHub Personal Access Token (PAT)
              </label>
              <input
                id="github-pat-input"
                type="password"
                placeholder="ghp_..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="bg-slate-950 border border-slate-800 outline-none rounded-lg p-2.5 w-full text-slate-200 text-xs font-mono"
              />
              <p className="text-[10px] text-slate-500 leading-normal">
                Avoid rate limit exhaustion on busy public IP networks. The
                token remains in local session storage and is used only for
                audit calculations.
              </p>
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
              onClick={() => handleQuickSearch("mayank1513/ossintel", "repo")}
              className="px-3 py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 rounded-lg text-xs font-semibold text-slate-300 transition-colors"
            >
              mayank1513/ossintel
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

      {/* Footer */}
      <footer className="relative border-t border-slate-900 bg-slate-950/20 z-10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <span>&copy; 2026 OSSIntel. Licensed under MIT.</span>
          <div className="flex gap-4">
            <span className="text-slate-400">Aesthetics Built Premium</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
