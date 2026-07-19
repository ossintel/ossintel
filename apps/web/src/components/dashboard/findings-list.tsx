"use client";

import { AlertTriangle, Award, ChevronDown, ChevronUp } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface Finding {
  id: string;
  type: "highlight" | "warning";
  category: string;
  title: string;
  description: string;
  score?: number;
}

interface FindingsListProps {
  findings: Finding[];
}

export const FindingsList: React.FC<FindingsListProps> = ({ findings }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col gap-4 shadow-xl">
      <h3 className="text-base font-bold flex items-center gap-2">
        <Award className="h-5 w-5 text-indigo-400" /> Audit Findings
      </h3>
      {findings && findings.length > 0 ? (
        <div className="divide-y divide-slate-800/80">
          {findings.map((f) => {
            const isExpanded = expandedId === f.id;
            return (
              <div
                key={f.id}
                className="py-2.5 first:pt-0 last:pb-0 flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(f.id)}
                  className="w-full flex items-center justify-between py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg transition-colors hover:bg-slate-950/20 px-2"
                  aria-expanded={isExpanded}
                >
                  <div className="flex gap-4 items-center">
                    <span
                      className={`p-2 rounded-xl border shrink-0 ${
                        f.type === "warning"
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-sm flex items-center gap-2">
                        {f.title}
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            f.type === "warning"
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {f.type}
                        </span>
                      </h4>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        Category: {f.category}
                      </span>
                    </div>
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
                  <div className="pl-14 pr-4 pb-2 pt-1 animate-fade-in-up">
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {f.description}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-500 italic">
          No significant findings reported.
        </p>
      )}
    </div>
  );
};
