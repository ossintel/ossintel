import { AlertTriangle, Award } from "lucide-react";
import type React from "react";
import { DashboardPanel } from "@/components/ui/dashboard-panel";

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
    <DashboardPanel
      title="Audit Findings"
      icon={Award}
      badgeCount={findings ? findings.length : undefined}
    >
      {findings && findings.length > 0 ? (
        <div className="space-y-4">
          {findings.map((f) => (
            <div
              key={f.id}
              className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl flex gap-4 items-start"
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
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-100">
                    {f.title}
                  </h4>
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      f.type === "warning"
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {f.type}
                  </span>
                </div>
                <p className="text-xs text-slate-350 leading-relaxed font-medium">
                  {f.description}
                </p>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Category: {f.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500 italic text-center py-4">
          No significant findings reported.
        </p>
      )}
    </DashboardPanel>
  );
};
