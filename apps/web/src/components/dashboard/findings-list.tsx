import { AlertTriangle, Award } from "lucide-react";
import type React from "react";

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
  return (
    <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col gap-4 shadow-xl">
      <h3 className="text-base font-bold flex items-center gap-2">
        <Award className="h-5 w-5 text-indigo-400" /> Audit Findings
      </h3>
      {findings && findings.length > 0 ? (
        <div className="divide-y divide-slate-800/80">
          {findings.map((f) => (
            <div
              key={f.id}
              className="py-4 first:pt-0 last:pb-0 flex gap-4 items-start"
            >
              <span
                className={`p-2 rounded-xl border shrink-0 ${
                  f.type === "warning"
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div className="space-y-1">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  {f.title}
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      f.type === "warning"
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {f.type}
                  </span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  {f.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500 italic">
          No significant findings reported.
        </p>
      )}
    </div>
  );
};
