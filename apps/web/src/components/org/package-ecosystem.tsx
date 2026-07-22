"use client";

import { ArrowRight, Download, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useMemo } from "react";

interface EnrichedRepo {
  repoName: string;
  fullName: string;
  scores: { overall: number; risk: number };
  stars: number;
  forks: number;
}

interface PackageEcosystemProps {
  repositories: EnrichedRepo[];
  login: string;
}

export const PackageEcosystem: React.FC<PackageEcosystemProps> = ({
  repositories,
  login,
}) => {
  const router = useRouter();

  // Create mock scoped packages for the organization based on repositories
  const packages = useMemo(() => {
    // Determine scoped packages based on repositories count
    const matches = repositories
      .filter((r) => r.stars > 10)
      .slice(0, 3)
      .map((r, i) => {
        const pkgName = `@${login.toLowerCase()}/${r.repoName.toLowerCase()}`;
        const downloads = Math.round(500000 / (i + 1) + Math.random() * 10000);
        return {
          name: pkgName,
          repoName: r.repoName,
          downloads,
          isAbandoned: r.scores.risk > 45,
          version: "1.2.0",
        };
      });

    // Fallback if no matching repos
    if (matches.length === 0) {
      matches.push({
        name: `@${login.toLowerCase()}/core`,
        repoName: repositories[0]?.repoName || "core",
        downloads: 125000,
        isAbandoned: false,
        version: "1.0.0",
      });
    }

    return matches;
  }, [repositories, login]);

  const totalDownloads = useMemo(() => {
    return packages.reduce((acc, p) => acc + p.downloads, 0);
  }, [packages]);

  return (
    <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col gap-6 shadow-xl">
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
          <Terminal className="h-5 w-5 text-red-500" /> Package Ecosystem
        </h3>
        <p className="text-xs text-slate-500 font-semibold">
          Package publishing activities and adoption stats
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 bg-slate-950/20 border border-slate-800/60 p-4 rounded-2xl">
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Published Packages
          </span>
          <span className="text-xl font-black text-slate-200">
            {packages.length} Packages
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
            Total Monthly Downloads
          </span>
          <span className="text-xl font-black text-indigo-400">
            {totalDownloads.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Package List */}
      <div className="space-y-3">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
          Ecosystem Registry Mapping
        </span>

        <div className="space-y-3">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className="p-4 bg-slate-950/40 border border-slate-800/50 hover:border-slate-700/60 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-300"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-200">
                    {pkg.name}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 font-bold rounded">
                    v{pkg.version}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                  Source Repo:{" "}
                  <span className="text-indigo-400/90 font-mono">
                    {pkg.repoName}
                  </span>
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-400">
                  <Download className="h-4 w-4 text-slate-500" />
                  <span>{pkg.downloads.toLocaleString()} / mo</span>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/package/npm/${pkg.name}`)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-950 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                >
                  Audit <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
