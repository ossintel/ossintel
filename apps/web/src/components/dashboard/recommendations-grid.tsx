import { CheckCircle2 } from "lucide-react";
import type React from "react";

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
    <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col gap-4 shadow-xl">
      <h3 className="text-base font-bold flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-indigo-400" /> Actionable
        Recommendations
      </h3>
      {recommendations && recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl flex flex-col justify-between gap-3"
              >
                <div className="space-y-1">
                  <span
                    className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${priorityColorClass}`}
                  >
                    {r.priority} Priority
                  </span>
                  <h4 className="font-extrabold text-sm text-slate-200 mt-1">
                    {r.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    {r.description}
                  </p>
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
    </div>
  );
};
