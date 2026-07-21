import { Globe, Languages } from "lucide-react";
import type React from "react";
import { GithubIcon } from "@/components/icons";
import type { AnalysisData } from "@/lib/types";

interface OverviewCardProps {
  data: AnalysisData;
}

export const OverviewCard: React.FC<OverviewCardProps> = ({ data }) => {
  return (
    <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col items-center text-center gap-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full filter blur-2xl pointer-events-none" />

      {data.type === "repo" ? (
        <div className="space-y-1">
          <h3 className="text-xl font-bold tracking-tight">
            {data.metadata.name}
          </h3>
          <p className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-1.5">
            <GithubIcon className="h-3.5 w-3.5" /> {data.metadata.fullName}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          {/* biome-ignore lint/performance/noImgElement: Github avatars are dynamic external resources loaded at runtime */}
          <img
            src={data.metadata.avatarUrl || undefined}
            alt={data.metadata.login}
            className="h-16 w-16 rounded-2xl border-2 border-slate-800 shadow-md object-cover"
          />
          <div className="space-y-1">
            <h3 className="text-xl font-bold tracking-tight">
              {data.metadata.name || data.metadata.login}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              @{data.metadata.login}
            </p>
          </div>
        </div>
      )}

      {/* Circle Progress Meter */}
      <div className="relative flex items-center justify-center">
        <svg className="w-44 h-44 transform -rotate-90">
          <title>Overall OSSIQ progress gauge</title>
          <circle
            cx="88"
            cy="88"
            r="76"
            stroke="#1e293b"
            strokeWidth="12"
            fill="transparent"
          />
          <circle
            cx="88"
            cy="88"
            r="76"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={String(2 * Math.PI * 76)}
            strokeDashoffset={String(
              2 * Math.PI * 76 * (1 - data.scores.overall / 100),
            )}
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
            stroke={
              data.scores.overall >= 75
                ? "#10b981"
                : data.scores.overall >= 40
                  ? "#f59e0b"
                  : "#f43f5e"
            }
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-5xl font-black tracking-tight">
            {data.scores.overall}
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            OSSIQ Score
          </span>
          {"confidence" in data.scores && (
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded border mt-1.5 uppercase tracking-wider ${
                data.scores.confidence === "High"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : data.scores.confidence === "Medium"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
            >
              Confidence: {data.scores.confidence}
            </span>
          )}
        </div>
      </div>

      <div className="w-full border-t border-slate-800/80 pt-4 text-left space-y-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Metadata Breakdown
        </span>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {data.type === "repo" ? (
            <>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/50 space-y-1">
                <span className="text-slate-500 font-medium block">
                  Language
                </span>
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Languages className="h-3.5 w-3.5 text-indigo-400" />{" "}
                  {data.metadata.language || "None"}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/50 space-y-1">
                <span className="text-slate-500 font-medium block">
                  Default Branch
                </span>
                <span className="font-bold text-slate-200 font-mono">
                  {data.metadata.defaultBranch}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/50 space-y-1">
                <span className="text-slate-500 font-medium block">
                  Public Repos
                </span>
                <span className="font-bold text-slate-200">
                  {data.metadata.publicRepos}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/50 space-y-1">
                <span className="text-slate-500 font-medium block">
                  Followers
                </span>
                <span className="font-bold text-slate-200">
                  {data.metadata.followers}
                </span>
              </div>
            </>
          )}
        </div>
        {data.metadata.htmlUrl && (
          <a
            href={data.metadata.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 transition-all"
          >
            View on GitHub <Globe className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};
