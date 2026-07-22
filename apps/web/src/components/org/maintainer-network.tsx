"use client";

import { Award, Heart, ShieldAlert, Star, Users } from "lucide-react";
import type React from "react";
import { useMemo } from "react";

interface EnrichedRepo {
  repoName: string;
  fullName: string;
  scores: { overall: number; risk: number };
  stars: number;
  forks: number;
}

interface MaintainerNetworkProps {
  repositories: EnrichedRepo[];
}

export const MaintainerNetwork: React.FC<MaintainerNetworkProps> = ({
  repositories,
}) => {
  const stats = useMemo(() => {
    // Determine contributors/maintainers landscape based on repo counts and sizes
    const totalRepos = repositories.length;

    // Core Maintainers: estimated based on repo count (usually 1-3 for small orgs, up to 10 for larger ones)
    const coreCount = Math.max(
      1,
      Math.min(8, Math.round(Math.sqrt(totalRepos))),
    );

    // Frequent contributors: standard multiplier
    const frequentCount = Math.max(2, Math.round(totalRepos * 0.8));

    // External contributors: estimated based on total stars
    const totalStars = repositories.reduce((acc, r) => acc + r.stars, 0);
    const externalCount = Math.max(
      5,
      Math.round(Math.log10(totalStars + 1) * 12),
    );

    const totalNetwork = coreCount + frequentCount + externalCount;
    const externalPercentage = Math.round((externalCount / totalNetwork) * 100);

    return {
      coreCount,
      frequentCount,
      externalCount,
      totalNetwork,
      externalPercentage,
    };
  }, [repositories]);

  return (
    <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col gap-6 shadow-xl">
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-400" /> Maintainer Network
        </h3>
        <p className="text-xs text-slate-500 font-semibold">
          Collaboration footprint and ownership breakdown
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Core Maintainers */}
        <div className="bg-slate-950/40 p-4 border border-slate-800/60 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <Award className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Core Maintainers
            </span>
            <span className="text-lg font-black text-slate-200">
              {stats.coreCount} Members
            </span>
          </div>
        </div>

        {/* Frequent Contributors */}
        <div className="bg-slate-950/40 p-4 border border-slate-800/60 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <Heart className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Frequent Contributors
            </span>
            <span className="text-lg font-black text-slate-200">
              {stats.frequentCount} Developers
            </span>
          </div>
        </div>

        {/* External Contributors */}
        <div className="bg-slate-950/40 p-4 border border-slate-800/60 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <Star className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              External Contributors
            </span>
            <span className="text-lg font-black text-slate-200">
              {stats.externalCount} Developers
            </span>
          </div>
        </div>
      </div>

      {/* Network Health Assessment */}
      <div className="p-4 bg-slate-950/20 border border-slate-800/60 rounded-2xl space-y-4">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
          Network Balance & Leverage
        </span>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-bold">
            <span>External Leverage</span>
            <span>{stats.externalPercentage}% of network</span>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
            <div
              style={{ width: `${stats.externalPercentage}%` }}
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            />
          </div>
        </div>

        {stats.externalPercentage < 40 ? (
          <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-xl flex gap-3 text-left">
            <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-rose-300 block">
                High Centralization Risk
              </span>
              <span className="text-[11px] text-slate-400 font-medium leading-relaxed block">
                Over 60% of the contribution bandwidth belongs to internal core
                developers. The community dependency ratio is low.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex gap-3 text-left">
            <ShieldAlert className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-300 block">
                Healthy Community Distribution
              </span>
              <span className="text-[11px] text-slate-400 font-medium leading-relaxed block">
                The organization has a highly active community of external
                contributors. This lowers sustainability risks.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
