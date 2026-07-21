import { CheckCircle2 } from "lucide-react";
import type React from "react";
import { DashboardPanel } from "@/components/ui/dashboard-panel";

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
  return (
    <DashboardPanel
      title="Actionable Recommendations"
      icon={CheckCircle2}
      badgeCount={recommendations ? recommendations.length : undefined}
    >
      {recommendations && recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((r) => {
            const priorityColorClass =
              r.priority === "high"
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                : r.priority === "medium"
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  : "bg-blue-500/10 border-blue-500/20 text-blue-400";
            return (
              <div
                key={r.id}
                className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl flex gap-4 items-start"
              >
                <span
                  className={`text-[9px] font-extrabold uppercase px-2 py-1 rounded-full border shrink-0 mt-0.5 ${priorityColorClass}`}
                >
                  {r.priority}
                </span>
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-extrabold text-sm text-slate-100">
                    {r.title}
                  </h4>
                  <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                    {r.description}
                  </p>
                  <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider block">
                    Category: {r.category}
                  </span>
                </div>
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
    </DashboardPanel>
  );
};
