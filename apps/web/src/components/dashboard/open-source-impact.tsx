"use client";

import type { NormalizedContribution } from "@ossintel/github-normalizer";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronDown,
  GitPullRequest,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAuthStatus } from "@/hooks/use-auth-status";
import { formatCompactNumber } from "@/lib/format";
import { GithubIcon } from "../icons";

interface OpenSourceImpactProps {
  contributions: NormalizedContribution[];
  limit: number;
  onLimitChange: (limit: number) => void;
  badges?: string[];
}

export const OpenSourceImpact: React.FC<OpenSourceImpactProps> = ({
  contributions,
  limit,
  onLimitChange,
  badges = [],
}) => {
  const { data: authData, isLoading: loadingToken } = useAuthStatus();
  const hasToken = !!authData?.hasGithubPat;
  const [ecosystemExpanded, setEcosystemExpanded] = useState<boolean>(true);
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>(
    {},
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"repo" | "count" | "stars">("count");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 1. Group statistics
  const totalPRs = contributions.length;
  const uniqueRepos = Array.from(
    new Set(contributions.map((c) => c.repoFullName)),
  );
  const totalOrgs = uniqueRepos.length;

  const maxStars = contributions.reduce(
    (max, c) => Math.max(c.targetRepoStars, max),
    0,
  );

  const codeCount = contributions.filter((c) => c.type === "code").length;
  const docsCount = contributions.filter((c) => c.type === "docs").length;
  const testCount = contributions.filter((c) => c.type === "test").length;

  // 2. Repo distribution calculations
  const repoDistribution = useMemo(() => {
    return uniqueRepos
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
      .filter((item) =>
        item.repo.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === "repo") {
          cmp = a.repo.localeCompare(b.repo);
        } else if (sortBy === "count") {
          cmp = a.count - b.count;
        } else if (sortBy === "stars") {
          cmp = a.stars - b.stars;
        }
        return sortOrder === "asc" ? cmp : -cmp;
      });
  }, [uniqueRepos, contributions, searchQuery, sortBy, sortOrder]);

  const maxRepoPRs = useMemo(() => {
    const rawDist = uniqueRepos.map((repo) => {
      const prs = contributions.filter((c) => c.repoFullName === repo);
      return prs.length;
    });
    return rawDist.length > 0 ? Math.max(...rawDist) : 1;
  }, [uniqueRepos, contributions]);

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
  const genericBadgeDefinitions = [
    {
      id: "Framework Contributor",
      name: "Framework Contributor",
      description: "Contributed code to a major web framework",
      icon: <Zap className="h-5 w-5 text-amber-600" />,
    },
    {
      id: "OSS Founder",
      name: "OSS Founder",
      description: "Founded or manages an active organization namespace",
      icon: <Users className="h-5 w-5 text-primary" />,
    },
    {
      id: "Package Publisher",
      name: "Package Publisher",
      description: "Author and publisher of npm library packages",
      icon: <BookOpen className="h-5 w-5 text-emerald-600" />,
    },
    {
      id: "Test Champion",
      name: "Test Champion",
      description: "Merged 5+ PRs targeting testing and coverage",
      icon: <ShieldCheck className="h-5 w-5 text-sky-600" />,
    },
    {
      id: "Security Champion",
      name: "Security Champion",
      description: "Contributed security vulnerability patches and fixes",
      icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />,
    },
    {
      id: "Prodigious Contributor",
      name: "Prodigious Contributor",
      description: "Merged 15+ external upstream pull requests",
      icon: <Zap className="h-5 w-5 text-primary" />,
    },
    {
      id: "1k Stars Earned",
      name: "1k Stars Earned",
      description: "Accrued 1,000+ stars on personal projects",
      icon: <Star className="h-5 w-5 text-amber-600" />,
    },
    {
      id: "1M npm Downloads",
      name: "1M npm Downloads",
      description: "Ecosystem packages exceed 1M downloads/week",
      icon: <Award className="h-5 w-5 text-violet-600" />,
    },
  ];

  const mappedBadges = genericBadgeDefinitions.map((badgeDef) => {
    const isEligible = badges.includes(badgeDef.id);
    let displayName = badgeDef.name;
    let desc = badgeDef.description;

    if (isEligible && badgeDef.id === "Framework Contributor") {
      const hasReact = contributions.some(
        (c) => c.repoFullName === "facebook/react",
      );
      const hasNext = contributions.some(
        (c) => c.repoFullName === "vercel/next.js",
      );
      if (hasReact && hasNext) {
        displayName = "React & Next.js Contributor";
        desc = "Contributed to both React and Next.js core frameworks";
      } else if (hasReact) {
        displayName = "React Contributor";
        desc = "Contributed code to facebook/react core";
      } else if (hasNext) {
        displayName = "Next.js Contributor";
        desc = "Contributed code to vercel/next.js core";
      }
    }

    return {
      id: badgeDef.id,
      name: displayName,
      description: desc,
      icon: badgeDef.icon,
      eligible: isEligible,
    };
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2 tracking-tight">
            <Award className="h-6 w-6 text-primary" /> Open Source Impact
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Analyzing PR contributions to external GitHub ecosystems
          </p>
        </div>

        {/* Dynamic Limit Control */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="contrib-limit"
            className="text-xs font-bold text-muted-foreground"
          >
            Limit Repos:
          </label>
          <select
            id="contrib-limit"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-muted/40 border border-border text-xs font-bold rounded-xl px-3 py-2 text-foreground outline-none cursor-pointer focus:border-primary/40"
          >
            <option value={5}>5 Repositories</option>
            <option value={10}>10 Repositories</option>
            <option value={25}>25 Repositories</option>
            <option value={50}>50 Repositories</option>
            <option value={Infinity}>All Repositories</option>
          </select>
        </div>
      </div>

      {/* Warning Card for rate limits */}
      {limit > 10 && !hasToken && !loadingToken && (
        <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> GitHub Connection Recommended
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              Analyzing more than 10 external projects can exhaust GitHub public
              API rate limits. Connect your GitHub account to ensure successful
              execution.
            </p>
          </div>
          <a
            href="/api/auth/github"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-md text-center"
          >
            <GithubIcon className="h-3.5 w-3.5 shrink-0" /> Connect GitHub
          </a>
        </div>
      )}

      {totalPRs === 0 ? (
        <div className="p-8 text-center bg-muted/40 border border-border/80 rounded-xl">
          <GitPullRequest className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">
            No external merged PR contributions detected.
          </p>
          <p className="text-xs text-muted-foreground/80 mt-1">
            Contributions are gathered from merged pull requests in non-owned
            repositories.
          </p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/40 border border-border/60 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                PRs Merged
              </span>
              <div className="text-2xl font-black text-primary">{totalPRs}</div>
              <div className="text-[10px] text-muted-foreground">
                Merged pull requests
              </div>
            </div>
            <div className="p-4 bg-muted/40 border border-border/60 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Projects Impacted
              </span>
              <div className="text-2xl font-black text-primary">
                {totalOrgs}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Unique external repos
              </div>
            </div>
            <div className="p-4 bg-muted/40 border border-border/60 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Max Project Stars
              </span>
              <div className="text-2xl font-black text-primary">
                {formatCompactNumber(maxStars)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Highest star repo reached
              </div>
            </div>
            <div className="p-4 bg-muted/40 border border-border/60 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Contribution Mix
              </span>
              <div className="text-sm font-bold text-foreground mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                {codeCount > 0 && (
                  <span className="text-primary">{codeCount} Code</span>
                )}
                {docsCount > 0 && (
                  <span className="text-emerald-600">{docsCount} Docs</span>
                )}
                {testCount > 0 && (
                  <span className="text-sky-600">{testCount} Tests</span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground">
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
              <h3 className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider group-hover:text-foreground transition-colors">
                Ecosystem Distribution
              </h3>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground/80 group-hover:text-foreground transition-transform duration-200 ${
                  ecosystemExpanded ? "transform rotate-180" : ""
                }`}
              />
            </button>
            {ecosystemExpanded && (
              <div className="space-y-4 animate-fade-in">
                {/* Search query input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search ecosystem repositories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-muted/40 border border-border text-xs rounded-xl px-3 py-2 text-foreground outline-none focus:border-primary/40"
                  />
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto border border-border rounded-xl bg-muted/40">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px] bg-muted">
                        <th className="p-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (sortBy === "repo") {
                                setSortOrder(
                                  sortOrder === "asc" ? "desc" : "asc",
                                );
                              } else {
                                setSortBy("repo");
                                setSortOrder("asc");
                              }
                            }}
                            className="hover:text-foreground transition-colors flex items-center gap-1 focus:outline-none"
                          >
                            Repository{" "}
                            {sortBy === "repo" &&
                              (sortOrder === "asc" ? "▲" : "▼")}
                          </button>
                        </th>
                        <th className="p-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (sortBy === "count") {
                                setSortOrder(
                                  sortOrder === "asc" ? "desc" : "asc",
                                );
                              } else {
                                setSortBy("count");
                                setSortOrder("desc");
                              }
                            }}
                            className="hover:text-foreground transition-colors flex items-center gap-1 focus:outline-none"
                          >
                            Contributions{" "}
                            {sortBy === "count" &&
                              (sortOrder === "asc" ? "▲" : "▼")}
                          </button>
                        </th>
                        <th className="p-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (sortBy === "stars") {
                                setSortOrder(
                                  sortOrder === "asc" ? "desc" : "asc",
                                );
                              } else {
                                setSortBy("stars");
                                setSortOrder("desc");
                              }
                            }}
                            className="hover:text-foreground transition-colors flex items-center gap-1 focus:outline-none"
                          >
                            Stars{" "}
                            {sortBy === "stars" &&
                              (sortOrder === "asc" ? "▲" : "▼")}
                          </button>
                        </th>
                        <th className="p-3 text-right">Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repoDistribution.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-4 text-center text-muted-foreground font-medium"
                          >
                            No matching repositories found.
                          </td>
                        </tr>
                      ) : (
                        repoDistribution.map((dist) => {
                          const percentage = Math.round(
                            (dist.count / maxRepoPRs) * 100,
                          );
                          return (
                            <tr
                              key={dist.repo}
                              className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                            >
                              <td className="p-3 font-semibold text-foreground">
                                {dist.repo}
                              </td>
                              <td className="p-3 font-bold text-primary">
                                <div className="flex items-center gap-2">
                                  <span className="w-8 shrink-0">
                                    {dist.count} PRs
                                  </span>
                                  <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden shrink-0 border border-border/40">
                                    <div
                                      className="h-full bg-primary rounded-full"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-foreground/90">
                                <div className="flex items-center gap-1 text-[11px]">
                                  <Star className="h-3.5 w-3.5 fill-amber-500/20 text-amber-500 shrink-0" />
                                  {formatCompactNumber(dist.stars)}
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <a
                                  href={`https://github.com/${dist.repo}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 bg-muted/40 border border-border hover:border-border/80 text-[10px] font-bold rounded-lg text-muted-foreground hover:text-foreground transition-all inline-block"
                                >
                                  GitHub
                                </a>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Badges Panel */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider">
              Earned Contribution Badges
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mappedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-4 border rounded-2xl flex items-start gap-3 transition-colors ${
                    badge.eligible
                      ? "bg-primary/5 border border-primary/10 text-foreground"
                      : "bg-muted/20 border border-border/40 text-muted-foreground opacity-60"
                  }`}
                >
                  <div className="p-2 bg-muted border border-border rounded-xl shrink-0">
                    {badge.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold flex items-center gap-1.5">
                      {badge.name}
                      {badge.eligible && (
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {badge.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider">
              Contribution Timeline
            </h3>
            <div className="relative border-l border-border pl-4 ml-2 space-y-6">
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
                    <div className="absolute -left-[21px] top-1.5 p-1 bg-card border border-border rounded-full shrink-0 z-10">
                      <Calendar className="h-3 w-3 text-primary" />
                    </div>
                    <button
                      type="button"
                      onClick={toggleYear}
                      className="w-full flex items-center justify-between text-left focus:outline-none group/year"
                    >
                      <h4 className="text-sm font-bold text-foreground group-hover/year:text-primary transition-colors">
                        {year} ({timelineByYear[year].length} contribution
                        {timelineByYear[year].length > 1 ? "s" : ""})
                      </h4>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground group-hover/year:text-primary transition-transform duration-200 ${
                          isYearExpanded ? "transform rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isYearExpanded && (
                      <ul className="space-y-2 animate-fade-in">
                        {timelineByYear[year].map((c) => (
                          <li
                            key={`${c.repoFullName}-${c.number}`}
                            className="p-3.5 bg-muted/40 border border-border/80 rounded-xl hover:border-border transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                              <div>
                                <span className="text-[10px] font-bold text-muted-foreground bg-muted border border-border rounded px-1.5 py-0.5 uppercase tracking-wider mr-2">
                                  {c.type}
                                </span>
                                <a
                                  href={c.htmlUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-semibold text-foreground hover:text-primary underline transition-colors"
                                >
                                  {c.title}
                                </a>
                              </div>
                              <span className="text-[10px] font-bold text-muted-foreground shrink-0">
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
