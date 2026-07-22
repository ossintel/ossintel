"use client";

import {
  AlertTriangle,
  Archive,
  Code2,
  FolderGit2,
  GitFork,
  Rocket,
  Star,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";

interface EnrichedRepo {
  repoName: string;
  fullName: string;
  scores: { overall: number; risk: number };
  stars: number;
  forks: number;
  isArchived: boolean;
  isFork: boolean;
  createdAt: string;
  pushedAt: string;
  language: string | null;
  topics: string[];
  description: string | null;
  openIssuesCount: number;
}

interface RepoPortfolioProps {
  repositories: EnrichedRepo[];
}

type CategoryType =
  | "core"
  | "growing"
  | "maintenance"
  | "experimental"
  | "archived";

export const RepositoryPortfolio: React.FC<RepoPortfolioProps> = ({
  repositories,
}) => {
  const [activeTab, setActiveTab] = useState<CategoryType>("core");

  const categories = useMemo(() => {
    const core: EnrichedRepo[] = [];
    const growing: EnrichedRepo[] = [];
    const maintenance: EnrichedRepo[] = [];
    const experimental: EnrichedRepo[] = [];
    const archived: EnrichedRepo[] = [];

    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;

    for (const r of repositories) {
      if (r.isArchived) {
        archived.push(r);
        continue;
      }

      const createdTime = r.createdAt ? new Date(r.createdAt).getTime() : 0;
      const pushedTime = r.pushedAt ? new Date(r.pushedAt).getTime() : 0;

      // 1. Core Projects: high stargazers or high scores
      if (r.stars >= 100 || r.scores.overall >= 75) {
        core.push(r);
      }
      // 2. Growing Projects: created recently & active
      else if (
        createdTime > oneYearAgo &&
        pushedTime > sixMonthsAgo &&
        r.stars >= 10
      ) {
        growing.push(r);
      }
      // 3. Maintenance: older, not updated recently, but has some stars
      else if (pushedTime < sixMonthsAgo && r.stars >= 5) {
        maintenance.push(r);
      }
      // 4. Experimental / Incubator: low stars, active
      else {
        experimental.push(r);
      }
    }

    return { core, growing, maintenance, experimental, archived };
  }, [repositories]);

  const tabList: Array<{
    id: CategoryType;
    label: string;
    icon: React.ReactNode;
    count: number;
  }> = [
    {
      id: "core",
      label: "Core Projects",
      icon: <Star className="h-4 w-4 text-yellow-400" />,
      count: categories.core.length,
    },
    {
      id: "growing",
      label: "Growing",
      icon: <Rocket className="h-4 w-4 text-emerald-400" />,
      count: categories.growing.length,
    },
    {
      id: "experimental",
      label: "Experimental",
      icon: <Code2 className="h-4 w-4 text-indigo-400" />,
      count: categories.experimental.length,
    },
    {
      id: "maintenance",
      label: "Maintenance Mode",
      icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
      count: categories.maintenance.length,
    },
    {
      id: "archived",
      label: "Archived",
      icon: <Archive className="h-4 w-4 text-slate-500" />,
      count: categories.archived.length,
    },
  ];

  const currentList = categories[activeTab];

  return (
    <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col gap-6 shadow-xl">
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
          <FolderGit2 className="h-5 w-5 text-indigo-400" /> Repository
          Portfolio
        </h3>
        <p className="text-xs text-slate-500 font-semibold">
          Categorized collection of ecosystem projects
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-3">
        {tabList.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              activeTab === t.id
                ? "bg-slate-950 border-slate-700 text-slate-100"
                : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
            <span className="px-1.5 py-0.5 bg-slate-950/60 border border-slate-800/60 text-[9px] rounded-full text-slate-400 font-black">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Projects List */}
      <div className="space-y-3.5">
        {currentList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentList.map((repo) => (
              <div
                key={repo.fullName}
                className="p-4 bg-slate-950/40 border border-slate-800/50 hover:border-slate-700/60 rounded-2xl flex flex-col justify-between gap-3 shadow hover:shadow-lg transition-all duration-300"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="font-bold text-sm text-slate-200 truncate"
                      title={repo.fullName}
                    >
                      {repo.repoName}
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 border rounded-full font-black uppercase tracking-wider ${
                        repo.scores.overall >= 75
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : repo.scores.overall >= 45
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      }`}
                    >
                      Score: {repo.scores.overall}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed line-clamp-2 h-8">
                    {repo.description || "No description provided."}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-900/60 pt-2 text-[10px] text-slate-500 font-bold">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-yellow-500/90" />{" "}
                      {repo.stars.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="h-3.5 w-3.5 text-indigo-400" />{" "}
                      {repo.forks.toLocaleString()}
                    </span>
                  </div>
                  {repo.language && (
                    <span className="px-2 py-0.5 bg-slate-900/80 border border-slate-800/80 text-[9px] text-slate-400 rounded-lg">
                      {repo.language}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-950/20 border border-slate-900/30 rounded-2xl">
            <span className="text-xs text-slate-500 font-bold block">
              No repositories matched this category.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
