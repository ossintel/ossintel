import {
  Activity,
  AlertTriangle,
  Award,
  Heart,
  Info,
  Users,
} from "lucide-react";
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

  const getHealthReason = (score: number) => {
    if (score >= 75)
      return "Excellent health. Active updates and well-managed issue tracker relative to its size.";
    if (score >= 40)
      return "Moderate health. Updates are less frequent or there is a backlog of open issues.";
    return "Low health. Repository is archived, has long-delayed updates, or has an excessively high open issues ratio.";
  };

  const getImpactReason = (score: number) => {
    if (score >= 75)
      return "High impact. Massive stars, forks, and watchers count, indicating wide adoption.";
    if (score >= 40)
      return "Medium impact. Solid community adoption and interest with good traction.";
    return "Low impact. Project is still growing or has niche visibility with fewer stars/forks.";
  };

  const getActivityReason = (score: number) => {
    if (score >= 75)
      return "Highly active. Regular commits and frequent releases in the past year.";
    if (score >= 40)
      return "Moderate activity. Stable codebase with occasional commits or releases.";
    return "Low activity. No recent commits or releases; project may be mature or inactive.";
  };

  const getCommunityReason = (score: number) => {
    if (score >= 75)
      return "Strong community. Diverse contributor base, active topic tags, and complete metadata.";
    if (score >= 40)
      return "Healthy community. Stable developer participation and standard repository metadata.";
    return "Limited community. Low contributor headcount, or missing topics/homepage details.";
  };

  const getRiskReason = (score: number) => {
    if (score >= 50)
      return "High risk. Low developer count (single point of failure), stale updates, or excessive issues.";
    if (score >= 20)
      return "Moderate risk. Stale commits or small developer base; proceed with caution.";
    return "Low risk. Active development, diverse contributors, and healthy popularity ratio.";
  };

  const metrics = [
    {
      label: "Health Score",
      val: scores.health,
      icon: Heart,
      calc: "Evaluates the ratio of open issues to repo popularity (stars + forks) and the recency of code updates (last commit recency).",
      getReason: getHealthReason,
    },
    {
      label: "Impact Score",
      val: scores.impact,
      icon: Award,
      calc: "Logarithmic scale of GitHub stars (50%), forks (35%), and watchers (15%). Measures ecosystem footprint.",
      getReason: getImpactReason,
    },
    {
      label: "Activity Score",
      val: scores.activity,
      icon: Activity,
      calc: "Combines the recency of the last commit (60%) and the frequency of releases in the last 12 months (40%).",
      getReason: getActivityReason,
    },
    {
      label: "Community Score",
      val: scores.community,
      icon: Users,
      calc: "Evaluates total contributors count (70%), repository topics (15%), and repository documentation completeness (15%). Falls back to star-based contributor estimates when throttled.",
      getReason: getCommunityReason,
    },
    {
      label: "Risk Score",
      val: scores.risk,
      icon: AlertTriangle,
      inverse: true,
      calc: "Assesses risk based on lack of updates (>3 months), low contributor counts (<5 developers), fork status, and open issues exceeding popularity.",
      getReason: getRiskReason,
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
                  <Icon className="h-4 w-4 text-slate-500" />
                  {metric.label}
                  <div className="group relative flex items-center">
                    <Info className="h-3.5 w-3.5 text-slate-500 hover:text-indigo-400 transition-colors cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-950 border border-slate-800 text-slate-300 text-[10px] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 normal-case leading-normal font-medium">
                      <p className="font-bold text-slate-100 mb-1">
                        How it's calculated:
                      </p>
                      <p className="text-slate-400 mb-2">{metric.calc}</p>
                      <p className="font-bold text-slate-100 mb-1">Status:</p>
                      <p>{metric.getReason(metric.val)}</p>
                    </div>
                  </div>
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
