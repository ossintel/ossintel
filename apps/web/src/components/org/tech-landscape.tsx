"use client";

import { Code, Layers } from "lucide-react";
import type React from "react";
import { useMemo } from "react";

interface EnrichedRepo {
  repoName: string;
  fullName: string;
  scores: { overall: number; risk: number };
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
}

interface TechLandscapeProps {
  repositories: EnrichedRepo[];
}

export const TechLandscape: React.FC<TechLandscapeProps> = ({
  repositories,
}) => {
  const languageStats = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;

    for (const r of repositories) {
      if (r.language) {
        counts[r.language] = (counts[r.language] || 0) + 1;
        total++;
      }
    }

    if (total === 0) {
      return [];
    }

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [repositories]);

  const topTopics = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of repositories) {
      for (const t of r.topics) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [repositories]);

  // Language bar colors mapping
  const colorMap: Record<string, string> = {
    TypeScript: "bg-blue-500",
    JavaScript: "bg-yellow-500",
    Python: "bg-indigo-400",
    Go: "bg-sky-400",
    Rust: "bg-orange-500",
    HTML: "bg-red-400",
    CSS: "bg-purple-400",
    C: "bg-slate-500",
    "C++": "bg-pink-500",
    Java: "bg-red-600",
  };

  return (
    <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col gap-6 shadow-xl">
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
          <Code className="h-5 w-5 text-indigo-400" /> Technology Landscape
        </h3>
        <p className="text-xs text-slate-500 font-semibold">
          Languages and capabilities owned by the organization
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language Breakdown */}
        <div className="space-y-4">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Language Breakdown
          </span>

          <div className="space-y-3">
            {languageStats.length > 0 ? (
              languageStats.slice(0, 4).map((lang) => (
                <div key={lang.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${colorMap[lang.name] || "bg-indigo-500"}`}
                      />
                      {lang.name}
                    </span>
                    <span>{lang.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${lang.percentage}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${colorMap[lang.name] || "bg-indigo-500"}`}
                    />
                  </div>
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-500 font-bold">
                No languages logged.
              </span>
            )}
          </div>
        </div>

        {/* Top Topics / Categories */}
        <div className="space-y-4">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Ecosystem Capabilities
          </span>

          <div className="flex flex-wrap gap-2">
            {topTopics.length > 0 ? (
              topTopics.map((topic) => (
                <span
                  key={topic.name}
                  className="px-3 py-1 bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Layers className="h-3 w-3 text-indigo-400" />
                  {topic.name}
                  <span className="px-1.5 py-0.2 bg-slate-900 border border-slate-800/80 rounded text-[9px] text-slate-500 font-black">
                    {topic.count}
                  </span>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 font-bold">
                No capability tags logged.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
