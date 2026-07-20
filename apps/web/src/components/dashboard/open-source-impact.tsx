"use client";

import type { NormalizedContribution } from "@ossintel/github-normalizer";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronDown,
  GitPullRequest,
  KeyRound,
  ShieldCheck,
  Star,
  Terminal,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

interface OpenSourceImpactProps {
  contributions: NormalizedContribution[];
  limit: number;
  onLimitChange: (limit: number) => void;
  onRefresh: () => void;
}

export const OpenSourceImpact: React.FC<OpenSourceImpactProps> = ({
  contributions,
  limit,
  onLimitChange,
  onRefresh,
}) => {
  const [patInput, setPatInput] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const [ecosystemExpanded, setEcosystemExpanded] = useState<boolean>(true);
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>(
    {},
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasToken(!!sessionStorage.getItem("github_token"));
    }
  }, []);

  const handleSavePat = () => {
    if (typeof window !== "undefined" && patInput.trim()) {
      sessionStorage.setItem("github_token", patInput.trim());
      setHasToken(true);
      setPatInput("");
      onRefresh();
    }
  };

  // 1. Group statistics
  const totalPRs = contributions.length;
  const uniqueRepos = Array.from(
    new Set(contributions.map((c) => c.repoFullName)),
  );
  const totalOrgs = uniqueRepos.length;

  const maxStars = contributions.reduce(
    (max, c) => (c.targetRepoStars > max ? c.targetRepoStars : max),
    0,
  );

  const codeCount = contributions.filter((c) => c.type === "code").length;
  const docsCount = contributions.filter((c) => c.type === "docs").length;
  const testCount = contributions.filter((c) => c.type === "test").length;

  // 2. Repo distribution calculations
  const repoDistribution = uniqueRepos
    .map((repo) => {
      const prs = contributions.filter((c) => c.repoFullName === repo);
      const stars = prs[0]?.targetRepoStars || 0;
      return {
        repo,
        name: repo.split("/")[1] || repo,
        count: prs.length,
        stars,
      };
    })
    .sort((a, b) => b.count - a.count || b.stars - a.stars);

  const maxRepoPRs = repoDistribution[0]?.count || 1;

  // 3. Timeline grouping by year
  const timelineByYear = contributions.reduce(
    (acc, c) => {
      const dateStr = c.mergedAt || c.createdAt;
      const year = dateStr
        ? new Date(dateStr).getFullYear()
        : new Date().getFullYear();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(c);
      return acc;
    },
    {} as Record<number, NormalizedContribution[]>,
  );

  const sortedYears = Object.keys(timelineByYear)
    .map(Number)
    .sort((a, b) => b - a);

  // 4. Badges eligibility checks
  const badges = [
    {
      id: "ecosystem",
      name: "Ecosystem Contributor",
      description: "Contributed to 3 or more external projects",
      icon: <Users className="h-5 w-5 text-indigo-400" />,
      eligible: totalOrgs >= 3,
    },
    {
      id: "core",
      name: "Core Contributor",
      description: "Contributed code to a Tier-1 framework (20k+ stars)",
      icon: <Zap className="h-5 w-5 text-amber-400" />,
      eligible: contributions.some(
        (c) => c.targetRepoStars >= 20000 && c.type === "code",
      ),
    },
    {
      id: "bug_hunter",
      name: "Bug Hunter",
      description: "Patched issues or code bugs in external repos",
      icon: <Terminal className="h-5 w-5 text-rose-400" />,
      eligible: contributions.some(
        (c) =>
          c.type === "code" &&
          (c.title.toLowerCase().includes("fix") ||
            c.title.toLowerCase().includes("bug") ||
            c.labels.some(
              (l) =>
                l.toLowerCase().includes("bug") ||
                l.toLowerCase().includes("fix"),
            )),
      ),
    },
    {
      id: "docs_hero",
      name: "Documentation Hero",
      description: "Helped improve project documentation and READMEs",
      icon: <BookOpen className="h-5 w-5 text-emerald-400" />,
      eligible: docsCount >= 2,
    },
    {
      id: "test_champ",
      name: "Test Champion",
      description: "Wrote tests or improved test suites",
      icon: <ShieldCheck className="h-5 w-5 text-sky-400" />,
      eligible: testCount >= 1,
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2 tracking-tight">
            <Award className="h-6 w-6 text-indigo-400" /> Open Source Impact
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing PR contributions to external GitHub ecosystems
          </p>
        </div>

        {/* Dynamic Limit Control */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="contrib-limit"
            className="text-xs font-bold text-slate-400"
          >
            Limit Repos:
          </label>
          <select
            id="contrib-limit"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 text-xs font-bold rounded-xl px-3 py-2 text-slate-200 outline-none cursor-pointer focus:border-indigo-500/40"
          >
            <option value={5}>5 Repositories</option>
            <option value={10}>10 Repositories</option>
            <option value={25}>25 Repositories</option>
            <option value={50}>50 Repositories</option>
            <option value={100}>All Repositories</option>
          </select>
        </div>
      </div>

      {/* Warning Card for rate limits */}
      {limit > 10 && !hasToken && (
        <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="h-4 w-4" /> Personal Access Token Recommended
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed max-w-xl">
              Analyzing more than 10 external projects can exhaust GitHub public
              API rate limits. Provide a GitHub PAT to ensure successful
              execution.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto shrink-0">
            <input
              type="password"
              placeholder="ghp_..."
              value={patInput}
              onChange={(e) => setPatInput(e.target.value)}
              className="flex-1 md:w-48 bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-amber-500/40"
            />
            <button
              type="button"
              onClick={handleSavePat}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              Apply PAT
            </button>
          </div>
        </div>
      )}

      {totalPRs === 0 ? (
        <div className="p-8 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl">
          <GitPullRequest className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">
            No external merged PR contributions detected.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Contributions are gathered from merged pull requests in non-owned
            repositories.
          </p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                PRs Merged
              </span>
              <div className="text-2xl font-black text-indigo-400">
                {totalPRs}
              </div>
              <div className="text-[10px] text-slate-400">
                Merged pull requests
              </div>
            </div>
            <div className="p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Projects Impacted
              </span>
              <div className="text-2xl font-black text-indigo-400">
                {totalOrgs}
              </div>
              <div className="text-[10px] text-slate-400">
                Unique external repos
              </div>
            </div>
            <div className="p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Max Project Stars
              </span>
              <div className="text-2xl font-black text-indigo-400">
                {maxStars >= 1000
                  ? `${(maxStars / 1000).toFixed(1)}k`
                  : maxStars}
              </div>
              <div className="text-[10px] text-slate-400">
                Highest star repo reached
              </div>
            </div>
            <div className="p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Contribution Mix
              </span>
              <div className="text-sm font-bold text-slate-200 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                {codeCount > 0 && (
                  <span className="text-indigo-400">{codeCount} Code</span>
                )}
                {docsCount > 0 && (
                  <span className="text-emerald-400">{docsCount} Docs</span>
                )}
                {testCount > 0 && (
                  <span className="text-sky-400">{testCount} Tests</span>
                )}
              </div>
              <div className="text-[10px] text-slate-400">
                Heuristics classification
              </div>
            </div>
          </div>

          {/* Visual Distribution Chart */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setEcosystemExpanded(!ecosystemExpanded)}
              className="w-full flex items-center justify-between text-left focus:outline-none group"
            >
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-slate-300 transition-colors">
                Ecosystem Distribution
              </h3>
              <ChevronDown
                className={`h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-transform duration-200 ${
                  ecosystemExpanded ? "transform rotate-180" : ""
                }`}
              />
            </button>
            {ecosystemExpanded && (
              <div className="space-y-3 animate-fade-in">
                {repoDistribution.slice(0, 5).map((dist) => {
                  const percentage = Math.round(
                    (dist.count / maxRepoPRs) * 100,
                  );
                  return (
                    <div key={dist.repo} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                          {dist.repo}
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-amber-500/20 text-amber-500" />
                            {dist.stars >= 1000
                              ? `${(dist.stars / 1000).toFixed(0)}k`
                              : dist.stars}
                          </span>
                        </span>
                        <span className="font-bold text-indigo-400">
                          {dist.count} PR{dist.count > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-950 border border-slate-800/80 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Badges Panel */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Earned Contribution Badges
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-4 border rounded-2xl flex items-start gap-3 transition-colors ${
                    badge.eligible
                      ? "bg-indigo-500/5 border-indigo-500/20 text-slate-200"
                      : "bg-slate-950/20 border-slate-800/40 text-slate-500 opacity-60"
                  }`}
                >
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
                    {badge.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold flex items-center gap-1.5">
                      {badge.name}
                      {badge.eligible && (
                        <CheckCircle className="h-4 w-4 text-indigo-400 shrink-0" />
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {badge.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Contribution Timeline
            </h3>
            <div className="relative border-l border-slate-800 pl-4 ml-2 space-y-6">
              {sortedYears.map((year) => {
                const isYearExpanded =
                  expandedYears[year] ?? year === sortedYears[0];
                const toggleYear = () => {
                  setExpandedYears((prev) => ({
                    ...prev,
                    [year]: !isYearExpanded,
                  }));
                };

                return (
                  <div key={year} className="relative space-y-3">
                    {/* Bullet */}
                    <div className="absolute -left-[21px] top-1.5 p-1 bg-slate-950 border border-slate-800 rounded-full shrink-0 z-10">
                      <Calendar className="h-3 w-3 text-indigo-400" />
                    </div>
                    <button
                      type="button"
                      onClick={toggleYear}
                      className="w-full flex items-center justify-between text-left focus:outline-none group/year"
                    >
                      <h4 className="text-sm font-bold text-slate-200 group-hover/year:text-indigo-400 transition-colors">
                        {year}
                      </h4>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-500 group-hover/year:text-indigo-400 transition-transform duration-200 ${
                          isYearExpanded ? "transform rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isYearExpanded && (
                      <ul className="space-y-2 animate-fade-in">
                        {timelineByYear[year].map((c) => (
                          <li
                            key={`${c.repoFullName}-${c.number}`}
                            className="p-3.5 bg-slate-950/40 border border-slate-800/80 rounded-2xl hover:border-slate-700 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 uppercase tracking-wider mr-2">
                                  {c.type}
                                </span>
                                <a
                                  href={c.htmlUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-semibold text-slate-200 hover:text-indigo-400 underline transition-colors"
                                >
                                  {c.title}
                                </a>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 shrink-0">
                                {c.repoFullName}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
