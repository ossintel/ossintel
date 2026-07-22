"use client";

import { Activity, AlertTriangle, ShieldCheck } from "lucide-react";
import type React from "react";
import { useMemo } from "react";

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

interface OrgHealthProps {
  repositories: EnrichedRepo[];
  orgScore: number;
}

export const OrgHealthDashboard: React.FC<OrgHealthProps> = ({
  repositories,
  orgScore,
}) => {
  const stats = useMemo(() => {
    const total = repositories.length;
    if (total === 0) {
      return {
        activeCount: 0,
        inactiveCount: 0,
        archivedCount: 0,
        healthyCount: 0,
        atRiskCount: 0,
        busFactor: 0,
      };
    }

    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    let activeCount = 0;
    let archivedCount = 0;
    let healthyCount = 0;
    let atRiskCount = 0;

    for (const r of repositories) {
      if (r.isArchived) {
        archivedCount++;
      } else {
        const pushTime = r.pushedAt ? new Date(r.pushedAt).getTime() : 0;
        if (pushTime > ninetyDaysAgo) {
          activeCount++;
        }
      }

      if (r.scores.risk > 40) {
        atRiskCount++;
      } else {
        healthyCount++;
      }
    }

    // Bus Factor estimation based on repository concentration and stars
    const sortedByStars = [...repositories].sort((a, b) => b.stars - a.stars);
    const topStars = sortedByStars
      .slice(0, 3)
      .reduce((acc, r) => acc + r.stars, 0);
    const totalStars = repositories.reduce((acc, r) => acc + r.stars, 0);

    // Heuristic: If 3 repos hold > 70% of stars, maintainer concentration is high (bus factor is lower)
    const ratio = totalStars > 0 ? topStars / totalStars : 0.5;
    const busFactor = Math.max(1, Math.round(10 * (1 - ratio)));

    return {
      activeCount,
      inactiveCount: total - activeCount - archivedCount,
      archivedCount,
      healthyCount,
      atRiskCount,
      busFactor,
    };
  }, [repositories]);

  const ratingColor =
    orgScore >= 75
      ? "text-emerald-400"
      : orgScore >= 45
        ? "text-amber-400"
        : "text-rose-400";
  const ratingText =
    orgScore >= 75
      ? "Highly Sustainable"
      : orgScore >= 45
        ? "Moderate Sustainability"
        : "Critical Risk";

  return (
    <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col gap-6 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-400" /> Organization
            Sustainability
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Ecosystem-level health audit
          </p>
        </div>
        <div className="text-right">
          <span className={`text-sm font-black ${ratingColor}`}>
            {orgScore} / 100
          </span>
          <span className="text-[9px] text-slate-500 font-bold block uppercase">
            {ratingText}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Active Projects */}
        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex flex-col justify-between gap-1.5 hover:border-slate-700/60 transition-all duration-300">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Active Repositories
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-100">
              {stats.activeCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              pushed &lt; 90d
            </span>
          </div>
        </div>

        {/* Bus Factor */}
        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex flex-col justify-between gap-1.5 hover:border-slate-700/60 transition-all duration-300">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Ecosystem Bus Factor
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">
              {stats.busFactor}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              core maintainers
            </span>
          </div>
        </div>

        {/* Healthy vs Risk */}
        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex items-start gap-3 hover:border-slate-700/60 transition-all duration-300">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Healthy Stacks
            </span>
            <span className="text-base font-extrabold text-slate-200">
              {stats.healthyCount} Repos
            </span>
          </div>
        </div>

        {/* At Risk Projects */}
        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex items-start gap-3 hover:border-slate-700/60 transition-all duration-300">
          <AlertTriangle
            className={`h-5 w-5 shrink-0 mt-0.5 ${stats.atRiskCount > 0 ? "text-rose-400" : "text-slate-600"}`}
          />
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Unstable Stacks
            </span>
            <span className="text-base font-extrabold text-slate-200">
              {stats.atRiskCount} Repos
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3 pt-2">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
          Activity Distribution
        </span>
        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex">
          <div
            style={{
              width: `${(stats.activeCount / Math.max(1, repositories.length)) * 100}%`,
            }}
            className="bg-indigo-500 h-full transition-all duration-500"
            title="Active"
          />
          <div
            style={{
              width: `${(stats.inactiveCount / Math.max(1, repositories.length)) * 100}%`,
            }}
            className="bg-amber-500/80 h-full transition-all duration-500"
            title="Inactive"
          />
          <div
            style={{
              width: `${(stats.archivedCount / Math.max(1, repositories.length)) * 100}%`,
            }}
            className="bg-slate-700 h-full transition-all duration-500"
            title="Archived"
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500" /> Active (
            {stats.activeCount})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500/80" /> Inactive (
            {stats.inactiveCount})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-700" /> Archived (
            {stats.archivedCount})
          </span>
        </div>
      </div>
    </div>
  );
};
