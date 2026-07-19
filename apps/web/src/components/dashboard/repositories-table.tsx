"use client";

import { ArrowRight, ArrowUpDown, Compass, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

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
  username?: string;
}

type SortField = "repoName" | "stars" | "forks" | "overall" | "risk";
type SortOrder = "asc" | "desc";

export const RepositoriesTable: React.FC<RepositoriesTableProps> = ({
  repositories,
  username,
}) => {
  const router = useRouter();

  // UX View Mode
  const [viewMode, setViewMode] = useState<"single" | "tabs">("tabs");
  const [activeTab, setActiveTab] = useState<string>("personal");

  // Excel Sorting/Filtering States
  const [sortField, setSortField] = useState<SortField>("overall");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOverallRanges, setSelectedOverallRanges] = useState<string[]>([
    "high",
    "mid",
    "low",
  ]);
  const [selectedRiskRanges, setSelectedRiskRanges] = useState<string[]>([
    "high",
    "mid",
    "low",
  ]);

  // Floating Dropdown menu states
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Determine owner type for grouping (Personal vs specific Orgs)
  const finalUserLogin = useMemo(() => {
    const fallback =
      repositories && repositories.length > 0
        ? repositories[0].fullName.split("/")[0]
        : "";
    return (username || fallback || "personal").toLowerCase();
  }, [username, repositories]);

  const groupedTabs = useMemo(() => {
    const tabs = new Set<string>();
    // Only include personal tab if user has active repositories in the list
    const hasPersonal = repositories.some(
      (r) => r.fullName.split("/")[0].toLowerCase() === finalUserLogin,
    );
    if (hasPersonal) {
      tabs.add("personal");
    }
    for (const repo of repositories) {
      const owner = repo.fullName.split("/")[0].toLowerCase();
      if (owner !== finalUserLogin) {
        tabs.add(owner);
      }
    }
    return Array.from(tabs);
  }, [repositories, finalUserLogin]);

  // Set initial active tab
  useEffect(() => {
    if (groupedTabs.length > 0 && !groupedTabs.includes(activeTab)) {
      setActiveTab(groupedTabs[0]);
    }
  }, [groupedTabs, activeTab]);

  // Filter & Sort Logic
  const processedRepos = useMemo(() => {
    let result = [...repositories];

    // 1. Group by Tab if tabbed mode is enabled
    if (viewMode === "tabs" && groupedTabs.length > 0) {
      const currentTab = activeTab || groupedTabs[0];
      if (currentTab === "personal") {
        result = result.filter(
          (r) => r.fullName.split("/")[0].toLowerCase() === finalUserLogin,
        );
      } else {
        result = result.filter(
          (r) => r.fullName.split("/")[0].toLowerCase() === currentTab,
        );
      }
    }

    // 2. Filter by Search Query (Repository Name)
    if (searchQuery.trim()) {
      result = result.filter((r) =>
        r.repoName.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // 3. Filter by Overall Score Range
    result = result.filter((r) => {
      if (r.scores.overall >= 80) return selectedOverallRanges.includes("high");
      if (r.scores.overall >= 40) return selectedOverallRanges.includes("mid");
      return selectedOverallRanges.includes("low");
    });

    // 4. Filter by Risk Range
    result = result.filter((r) => {
      if (r.scores.risk > 50) return selectedRiskRanges.includes("high");
      if (r.scores.risk >= 20) return selectedRiskRanges.includes("mid");
      return selectedRiskRanges.includes("low");
    });

    // 5. Apply Sort
    result.sort((a, b) => {
      let valA: string | number = 0;
      let valB: string | number = 0;

      if (sortField === "repoName") {
        valA = a.repoName.toLowerCase();
        valB = b.repoName.toLowerCase();
      } else if (sortField === "stars") {
        valA = a.stars;
        valB = b.stars;
      } else if (sortField === "forks") {
        valA = a.forks;
        valB = b.forks;
      } else if (sortField === "overall") {
        valA = a.scores.overall;
        valB = b.scores.overall;
      } else if (sortField === "risk") {
        valA = a.scores.risk;
        valB = b.scores.risk;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return sortOrder === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });

    return result;
  }, [
    repositories,
    viewMode,
    activeTab,
    groupedTabs,
    finalUserLogin,
    searchQuery,
    selectedOverallRanges,
    selectedRiskRanges,
    sortField,
    sortOrder,
  ]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleRowClick = (fullName: string) => {
    router.push(`/repo/${fullName}`);
  };

  if (!repositories || repositories.length === 0) return null;

  return (
    <div
      className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col gap-6 shadow-xl relative"
      ref={dropdownRef}
    >
      {/* Header toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-base font-bold flex items-center gap-2">
          <Compass className="h-5 w-5 text-indigo-400" /> Monitored Repositories
          & Scores
        </h3>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800/80 max-w-max">
          <button
            type="button"
            onClick={() => setViewMode("tabs")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === "tabs"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Tabbed View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("single")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === "single"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Single List View
          </button>
        </div>
      </div>

      {/* Tabs list (if tabbed mode enabled) */}
      {viewMode === "tabs" && groupedTabs.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800/60">
          {groupedTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 ${
                activeTab === tab
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-sm shadow-indigo-500/5"
                  : "bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "personal" ? `Personal (@${finalUserLogin})` : `@${tab}`}
            </button>
          ))}
        </div>
      )}

      {/* Table view */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/20">
        <table className="w-full text-left text-xs font-semibold text-slate-300 min-w-[500px]">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider bg-slate-900/40">
              {/* Repository Column */}
              <th className="py-3.5 px-3 relative">
                <div className="flex items-center gap-1">
                  <span>Repository</span>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === "repo" ? null : "repo",
                      )
                    }
                    className="p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                  >
                    <Filter className="h-3.5 w-3.5" />
                  </button>
                </div>
                {activeDropdown === "repo" && (
                  <div className="absolute left-3 top-10 z-20 bg-slate-900 border border-slate-800 shadow-xl rounded-xl p-3 w-56 text-left normal-case text-slate-200 font-medium space-y-3">
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSortField("repoName");
                          setSortOrder("asc");
                          setActiveDropdown(null);
                        }}
                        className="w-full py-1 px-2 hover:bg-slate-800 rounded text-xs font-bold text-left flex items-center gap-1.5"
                      >
                        <ArrowUpDown className="h-3.5 w-3.5" /> Sort A to Z
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSortField("repoName");
                          setSortOrder("desc");
                          setActiveDropdown(null);
                        }}
                        className="w-full py-1 px-2 hover:bg-slate-800 rounded text-xs font-bold text-left flex items-center gap-1.5"
                      >
                        <ArrowUpDown className="h-3.5 w-3.5" /> Sort Z to A
                      </button>
                    </div>
                    <div className="border-t border-slate-800 pt-2">
                      <Label className="text-[10px] mb-1">
                        Search Repository
                      </Label>
                      <Input
                        type="text"
                        placeholder="Type name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 py-1 px-2 text-xs"
                      />
                    </div>
                  </div>
                )}
              </th>

              {/* Stars Column */}
              <th className="py-3.5 px-3 text-center">
                <button
                  type="button"
                  onClick={() => toggleSort("stars")}
                  className="inline-flex items-center gap-1 hover:text-slate-200 uppercase tracking-wider"
                >
                  Stars{" "}
                  {sortField === "stars" && (sortOrder === "asc" ? "▲" : "▼")}
                </button>
              </th>

              {/* Forks Column */}
              <th className="py-3.5 px-3 text-center">
                <button
                  type="button"
                  onClick={() => toggleSort("forks")}
                  className="inline-flex items-center gap-1 hover:text-slate-200 uppercase tracking-wider"
                >
                  Forks{" "}
                  {sortField === "forks" && (sortOrder === "asc" ? "▲" : "▼")}
                </button>
              </th>

              {/* Overall score Column */}
              <th className="py-3.5 px-3 relative text-center">
                <div className="inline-flex items-center gap-1 justify-center">
                  <button
                    type="button"
                    onClick={() => toggleSort("overall")}
                    className="hover:text-slate-200 uppercase tracking-wider"
                  >
                    Overall{" "}
                    {sortField === "overall" &&
                      (sortOrder === "asc" ? "▲" : "▼")}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === "overall" ? null : "overall",
                      )
                    }
                    className="p-0.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                  >
                    <Filter className="h-3 w-3" />
                  </button>
                </div>
                {activeDropdown === "overall" && (
                  <div className="absolute right-0 md:left-3 top-10 z-20 bg-slate-900 border border-slate-800 shadow-xl rounded-xl p-3 w-52 text-left normal-case text-slate-200 font-medium space-y-2">
                    <Label className="text-[10px] mb-1">
                      Filter Overall score
                    </Label>
                    <div className="space-y-1">
                      {[
                        { key: "high", label: "Excellent (≥80)" },
                        { key: "mid", label: "Moderate (40-79)" },
                        { key: "low", label: "Poor (<40)" },
                      ].map((range) => (
                        <label
                          key={range.key}
                          className="flex items-center gap-2 py-1 hover:bg-slate-800 rounded px-1.5 cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={selectedOverallRanges.includes(range.key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOverallRanges([
                                  ...selectedOverallRanges,
                                  range.key,
                                ]);
                              } else {
                                setSelectedOverallRanges(
                                  selectedOverallRanges.filter(
                                    (x) => x !== range.key,
                                  ),
                                );
                              }
                            }}
                            className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                          />
                          <span>{range.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </th>

              {/* Risk Column */}
              <th className="py-3.5 px-3 relative text-center">
                <div className="inline-flex items-center gap-1 justify-center">
                  <button
                    type="button"
                    onClick={() => toggleSort("risk")}
                    className="hover:text-slate-200 uppercase tracking-wider"
                  >
                    Risk{" "}
                    {sortField === "risk" && (sortOrder === "asc" ? "▲" : "▼")}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === "risk" ? null : "risk",
                      )
                    }
                    className="p-0.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                  >
                    <Filter className="h-3 w-3" />
                  </button>
                </div>
                {activeDropdown === "risk" && (
                  <div className="absolute right-3 top-10 z-20 bg-slate-900 border border-slate-800 shadow-xl rounded-xl p-3 w-52 text-left normal-case text-slate-200 font-medium space-y-2">
                    <Label className="text-[10px] mb-1">Filter Risk</Label>
                    <div className="space-y-1">
                      {[
                        { key: "high", label: "High Risk (>50%)" },
                        { key: "mid", label: "Medium Risk (20-50%)" },
                        { key: "low", label: "Low Risk (<20%)" },
                      ].map((range) => (
                        <label
                          key={range.key}
                          className="flex items-center gap-2 py-1 hover:bg-slate-800 rounded px-1.5 cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={selectedRiskRanges.includes(range.key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRiskRanges([
                                  ...selectedRiskRanges,
                                  range.key,
                                ]);
                              } else {
                                setSelectedRiskRanges(
                                  selectedRiskRanges.filter(
                                    (x) => x !== range.key,
                                  ),
                                );
                              }
                            }}
                            className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                          />
                          <span>{range.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </th>

              {/* Action Link Column */}
              <th className="py-3.5 px-3 text-center uppercase tracking-wider">
                Audit
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {processedRepos.map((repo) => (
              <tr
                key={repo.repoName}
                onClick={() => handleRowClick(repo.fullName)}
                className="hover:bg-slate-900/30 cursor-pointer transition-colors group"
              >
                <td className="py-3.5 px-3 font-bold text-slate-200">
                  <div className="flex flex-col gap-0.5">
                    <span>{repo.repoName}</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {repo.fullName}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-center">
                  {repo.stars.toLocaleString()}
                </td>
                <td className="py-3.5 px-3 text-center">
                  {repo.forks.toLocaleString()}
                </td>
                <td className="py-3.5 px-3 text-center font-black">
                  <span
                    className={`px-2 py-1 rounded-lg ${
                      repo.scores.overall >= 80
                        ? "text-emerald-400 bg-emerald-500/5 border border-emerald-500/10"
                        : repo.scores.overall >= 40
                          ? "text-amber-400 bg-amber-500/5 border border-amber-500/10"
                          : "text-rose-400 bg-rose-500/5 border border-rose-500/10"
                    }`}
                  >
                    {repo.scores.overall}
                  </span>
                </td>
                <td className="py-3.5 px-3 text-center font-bold">
                  <span
                    className={
                      repo.scores.risk > 50
                        ? "text-rose-400"
                        : repo.scores.risk >= 20
                          ? "text-amber-400"
                          : "text-emerald-400"
                    }
                  >
                    {repo.scores.risk}%
                  </span>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(repo.fullName);
                    }}
                    className="p-1.5 bg-slate-900/80 border border-slate-800 group-hover:border-indigo-500/30 group-hover:text-indigo-400 rounded-lg transition-all"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {processedRepos.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-slate-500 italic"
                >
                  No repositories match the active column filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
