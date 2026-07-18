import { Activity, AlertTriangle, Award, Heart, Users } from "lucide-react";
import type React from "react";

interface DimensionBreakdownProps {
  scores: {
    health: number;
    impact: number;
    activity: number;
    community: number;
    risk: number;
  };
}

export const DimensionBreakdown: React.FC<DimensionBreakdownProps> = ({
  scores,
}) => {
  const getScoreColorClass = (score: number) => {
    if (score >= 75)
      return "text-emerald-500 stroke-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 40)
      return "text-amber-500 stroke-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-rose-500 stroke-rose-500 bg-rose-500/10 border-rose-500/20";
  };

  const getScoreBgClass = (score: number) => {
    if (score >= 75) return "bg-emerald-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-rose-500";
  };

  const metrics = [
    { label: "Health Score", val: scores.health, icon: Heart },
    { label: "Impact Score", val: scores.impact, icon: Award },
    { label: "Activity Score", val: scores.activity, icon: Activity },
    { label: "Community Score", val: scores.community, icon: Users },
    {
      label: "Risk Score",
      val: scores.risk,
      icon: AlertTriangle,
      inverse: true,
    },
  ];

  return (
    <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col gap-4 shadow-xl">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
        Dimension Breakdown
      </h4>
      <div className="space-y-3.5">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const displayColorVal = metric.inverse
            ? 100 - metric.val
            : metric.val;
          return (
            <div key={metric.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Icon className="h-4 w-4 text-slate-500" /> {metric.label}
                </span>
                <span
                  className={getScoreColorClass(displayColorVal).split(" ")[0]}
                >
                  {metric.val}
                </span>
              </div>
              <div className="bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getScoreBgClass(displayColorVal)}`}
                  style={{ width: `${metric.val}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
