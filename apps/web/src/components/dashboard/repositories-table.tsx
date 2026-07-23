"use client";

import {
  ArrowRight,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Compass,
  Filter,
} from "lucide-react";
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
  isContribution?: boolean;
}

interface RepositoriesTableProps {
  repositories: RepositoryScoreItem[];
  username?: string;
  externalContributions?: RepositoryScoreItem[];
}

type SortField = "repoName" | "stars" | "forks" | "overall" | "risk";
type SortOrder = "asc" | "desc";

const SortIcon = ({ active, order }: { active: boolean; order: SortOrder }) => {
  if (!active) {
    return (
      <ArrowUpDown className="h-3 w-3 text-muted-foreground/30 group-hover/btn:text-muted-foreground/60 transition-colors shrink-0" />
    );
  }
  return order === "asc" ? (
    <ChevronUp className="h-3.5 w-3.5 text-primary shrink-0 animate-fade-in" />
  ) : (
    <ChevronDown className="h-3.5 w-3.5 text-primary shrink-0 animate-fade-in" />
  );
};

const RangeFilterDropdown = ({
  label,
  ranges,
  selectedRanges,
  onToggle,
  alignClass = "right-0 md:left-3",
}: {
  label: string;
  ranges: { key: string; label: string }[];
  selectedRanges: string[];
  onToggle: (key: string, checked: boolean) => void;
  alignClass?: string;
}) => (
  <div
    className={`absolute ${alignClass} top-10 z-20 bg-card border border-border shadow-sm rounded-xl p-3 w-52 text-left normal-case text-foreground font-medium space-y-2`}
  >
    <Label className="text-[10px] mb-1">{label}</Label>
    <div className="space-y-1">
      {ranges.map((range) => (
        <label
          key={range.key}
          className="flex items-center gap-2 py-1 hover:bg-muted rounded px-1.5 cursor-pointer text-xs"
        >
          <input
            type="checkbox"
            checked={selectedRanges.includes(range.key)}
            onChange={(e) => onToggle(range.key, e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary bg-muted"
          />
          <span>{range.label}</span>
        </label>
      ))}
    </div>
  </div>
);

export const RepositoriesTable: React.FC<RepositoriesTableProps> = ({
  repositories,
  username,
  externalContributions,
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

  const handleRangeToggle = (
    ranges: string[],
    setRanges: React.Dispatch<React.SetStateAction<string[]>>,
    key: string,
    checked: boolean,
  ) => {
    if (checked) {
      setRanges([...ranges, key]);
    } else {
      setRanges(ranges.filter((x) => x !== key));
    }
  };

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
    if (externalContributions && externalContributions.length > 0) {
      tabs.add("contributions");
    }
    return Array.from(tabs);
  }, [repositories, finalUserLogin, externalContributions]);

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
      if (currentTab === "contributions") {
        result = [...(externalContributions || [])];
      } else if (currentTab === "personal") {
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
    externalContributions,
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
      className="p-6 bg-card border border-border rounded-2xl flex flex-col gap-6 shadow-sm relative"
      ref={dropdownRef}
    >
      {/* Header toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-base font-bold flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" /> Monitored Repositories &
          Scores
        </h3>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border/80 max-w-max">
          <button
            type="button"
            onClick={() => setViewMode("tabs")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === "tabs"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tabbed View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("single")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === "single"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Single List View
          </button>
        </div>
      </div>

      {/* Tabs list (if tabbed mode enabled) */}
      {viewMode === "tabs" && groupedTabs.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border/60">
          {groupedTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border shrink-0 ${
                activeTab === tab
                  ? "bg-primary/5 border border-primary/10 text-primary shadow-sm"
                  : "bg-muted/40 border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "personal"
                ? `Personal (@${finalUserLogin})`
                : tab === "contributions"
                  ? "Contributions"
                  : `@${tab}`}
            </button>
          ))}
        </div>
      )}

      {/* Table view */}
      <div className="overflow-x-auto rounded-xl border border-border bg-muted/40">
        <table className="w-full text-left text-xs font-semibold text-foreground/90 min-w-[500px]">
          <thead>
            <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider bg-muted">
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
                    className="p-1 text-muted-foreground/80 hover:text-foreground hover:bg-muted rounded transition-colors"
                  >
                    <Filter className="h-3.5 w-3.5" />
                  </button>
                </div>
                {activeDropdown === "repo" && (
                  <div className="absolute left-3 top-10 z-20 bg-card border border-border shadow-sm rounded-xl p-3 w-56 text-left normal-case text-foreground font-medium space-y-3">
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSortField("repoName");
                          setSortOrder("asc");
                          setActiveDropdown(null);
                        }}
                        className="w-full py-1 px-2 hover:bg-muted rounded text-xs font-bold text-left flex items-center gap-1.5"
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
                        className="w-full py-1 px-2 hover:bg-muted rounded text-xs font-bold text-left flex items-center gap-1.5"
                      >
                        <ArrowUpDown className="h-3.5 w-3.5" /> Sort Z to A
                      </button>
                    </div>
                    <div className="border-t border-border pt-2">
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
                  className="inline-flex items-center gap-1.5 hover:text-foreground uppercase tracking-wider cursor-pointer font-bold select-none group/btn mx-auto"
                >
                  <span>Stars</span>
                  <SortIcon active={sortField === "stars"} order={sortOrder} />
                </button>
              </th>

              {/* Forks Column */}
              <th className="py-3.5 px-3 text-center">
                <button
                  type="button"
                  onClick={() => toggleSort("forks")}
                  className="inline-flex items-center gap-1.5 hover:text-foreground uppercase tracking-wider cursor-pointer font-bold select-none group/btn mx-auto"
                >
                  <span>Forks</span>
                  <SortIcon active={sortField === "forks"} order={sortOrder} />
                </button>
              </th>

              {/* Overall score Column */}
              <th className="py-3.5 px-3 relative text-center">
                <div className="inline-flex items-center gap-1.5 justify-center">
                  <button
                    type="button"
                    onClick={() => toggleSort("overall")}
                    className="inline-flex items-center gap-1.5 hover:text-foreground uppercase tracking-wider cursor-pointer font-bold select-none group/btn"
                  >
                    <span>Overall</span>
                    <SortIcon
                      active={sortField === "overall"}
                      order={sortOrder}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === "overall" ? null : "overall",
                      )
                    }
                    className="p-0.5 text-muted-foreground/80 hover:text-foreground hover:bg-muted rounded transition-colors"
                  >
                    <Filter className="h-3 w-3" />
                  </button>
                </div>
                {activeDropdown === "overall" && (
                  <RangeFilterDropdown
                    label="Filter Overall score"
                    ranges={[
                      { key: "high", label: "Excellent (≥80)" },
                      { key: "mid", label: "Moderate (40-79)" },
                      { key: "low", label: "Poor (<40)" },
                    ]}
                    selectedRanges={selectedOverallRanges}
                    onToggle={(key, checked) =>
                      handleRangeToggle(
                        selectedOverallRanges,
                        setSelectedOverallRanges,
                        key,
                        checked,
                      )
                    }
                  />
                )}
              </th>

              {/* Risk Column */}
              <th className="py-3.5 px-3 relative text-center">
                <div className="inline-flex items-center gap-1.5 justify-center">
                  <button
                    type="button"
                    onClick={() => toggleSort("risk")}
                    className="inline-flex items-center gap-1.5 hover:text-foreground uppercase tracking-wider cursor-pointer font-bold select-none group/btn"
                  >
                    <span>Risk</span>
                    <SortIcon active={sortField === "risk"} order={sortOrder} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === "risk" ? null : "risk",
                      )
                    }
                    className="p-0.5 text-muted-foreground/80 hover:text-foreground hover:bg-muted rounded transition-colors"
                  >
                    <Filter className="h-3 w-3" />
                  </button>
                </div>
                {activeDropdown === "risk" && (
                  <RangeFilterDropdown
                    label="Filter Risk"
                    ranges={[
                      { key: "high", label: "High Risk (>50%)" },
                      { key: "mid", label: "Medium Risk (20-50%)" },
                      { key: "low", label: "Low Risk (<20%)" },
                    ]}
                    selectedRanges={selectedRiskRanges}
                    onToggle={(key, checked) =>
                      handleRangeToggle(
                        selectedRiskRanges,
                        setSelectedRiskRanges,
                        key,
                        checked,
                      )
                    }
                    alignClass="right-3"
                  />
                )}
              </th>

              {/* Action Link Column */}
              <th className="py-3.5 px-3 text-center uppercase tracking-wider">
                Audit
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {processedRepos.map((repo) => (
              <tr
                key={repo.repoName}
                onClick={() => handleRowClick(repo.fullName)}
                className="hover:bg-muted/30 cursor-pointer transition-colors group"
              >
                <td className="py-3.5 px-3 font-bold text-foreground">
                  <div className="flex flex-col gap-0.5">
                    <span>{repo.repoName}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">
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
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border border-emerald-500/10"
                        : repo.scores.overall >= 40
                          ? "text-amber-600 dark:text-amber-400 bg-amber-500/5 border border-amber-500/10"
                          : "text-destructive bg-destructive/5 border border-destructive/10"
                    }`}
                  >
                    {repo.scores.overall}
                  </span>
                </td>
                <td className="py-3.5 px-3 text-center font-bold">
                  <span
                    className={
                      repo.scores.risk > 50
                        ? "text-destructive"
                        : repo.scores.risk >= 20
                          ? "text-amber-600"
                          : "text-emerald-600"
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
                    className="p-1.5 bg-muted/40 border border-border group-hover:border-primary/30 group-hover:text-primary rounded-lg transition-all"
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
                  className="py-8 text-center text-muted-foreground italic"
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
