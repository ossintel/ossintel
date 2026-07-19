"use client";

import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
}

interface RecommendationsGridProps {
  recommendations: Recommendation[];
}

export const RecommendationsGrid: React.FC<RecommendationsGridProps> = ({
  recommendations,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col gap-4 shadow-xl">
      <h3 className="text-base font-bold flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-indigo-400" /> Actionable
        Recommendations
      </h3>
      {recommendations && recommendations.length > 0 ? (
        <div className="divide-y divide-slate-800/80">
          {recommendations.map((r) => {
            const isExpanded = expandedId === r.id;
            const priorityColorClass =
              r.priority === "high"
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                : r.priority === "medium"
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  : "bg-blue-500/10 border-blue-500/20 text-blue-400";
            return (
              <div
                key={r.id}
                className="py-2.5 first:pt-0 last:pb-0 flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(r.id)}
                  className="w-full flex items-center justify-between py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg transition-colors hover:bg-slate-950/20 px-2"
                  aria-expanded={isExpanded}
                >
                  <div className="flex gap-4 items-center">
                    <span
                      className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${priorityColorClass}`}
                    >
                      {r.priority} Priority
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-200">
                      {r.title}
                    </h4>
                  </div>
                  <span className="text-slate-500">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </span>
                </button>

                {isExpanded && (
                  <div className="pl-24 pr-4 pb-2 pt-1 animate-fade-in-up">
                    <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                      {r.description}
                    </p>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">
                      Category: {r.category}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 bg-slate-950/40 border border-slate-800/60 rounded-2xl text-center space-y-2">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
          <h4 className="font-bold text-sm">Perfect Score Guidelines Met</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            This repository has satisfied all standard metrics audits. No
            further actions recommended.
          </p>
        </div>
      )}
    </div>
  );
};
