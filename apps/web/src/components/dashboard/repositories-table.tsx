import { Compass } from "lucide-react";
import type React from "react";

interface RepositoryScoreItem {
  repoName: string;
  fullName: string;
  scores: {
    overall: number;
    risk: number;
  };
  stars: number;
  forks: number;
}

interface RepositoriesTableProps {
  repositories: RepositoryScoreItem[];
}

export const RepositoriesTable: React.FC<RepositoriesTableProps> = ({
  repositories,
}) => {
  if (!repositories || repositories.length === 0) return null;

  return (
    <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col gap-4 shadow-xl">
      <h3 className="text-base font-bold flex items-center gap-2">
        <Compass className="h-5 w-5 text-indigo-400" /> Monitored Repositories &
        Scores
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-semibold text-slate-300">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3 px-2">Repository</th>
              <th className="py-3 px-2 text-center">Stars</th>
              <th className="py-3 px-2 text-center">Forks</th>
              <th className="py-3 px-2 text-center">Overall</th>
              <th className="py-3 px-2 text-center">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {repositories.map((repo) => (
              <tr
                key={repo.repoName}
                className="hover:bg-slate-950/30 transition-colors"
              >
                <td className="py-3 px-2 font-bold text-slate-200">
                  {repo.repoName}
                </td>
                <td className="py-3 px-2 text-center">{repo.stars}</td>
                <td className="py-3 px-2 text-center">{repo.forks}</td>
                <td className="py-3 px-2 text-center font-black">
                  {repo.scores.overall}
                </td>
                <td
                  className={`py-3 px-2 text-center font-bold ${
                    repo.scores.risk > 55 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {repo.scores.risk}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
