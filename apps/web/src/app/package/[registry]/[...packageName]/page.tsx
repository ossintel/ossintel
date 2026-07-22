"use client";

import {
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { ErrorAlert } from "@/components/ui/error-alert";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useNpmPackage } from "@/hooks/use-npm-package";

const STEPS = [
  "Connecting to Package Registry...",
  "Fetching package metadata and version manifest...",
  "Retrieving download statistics...",
  "Analyzing package quality and type declarations...",
  "Calculating package scoring and metrics...",
  "Generating package intelligence findings...",
  "Finalizing Package report...",
];

export default function PackagePage() {
  const params = useParams();
  const router = useRouter();
  const registry = params.registry as string;
  const packageNameParts = (params.packageName as string[]) ?? [];
  const packageName = packageNameParts.join("/").replace("%40", "@");

  // If not npm, show placeholder coming soon
  if (registry !== "npm") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="text-center space-y-4 max-w-md p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
          <Terminal className="h-10 w-10 text-indigo-400 mx-auto" />
          <h1 className="text-xl font-extrabold tracking-tight">
            {registry.toUpperCase()} Registry Support Coming Soon
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Support for auditing {registry} packages is in our backlog. Check
            back soon!
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-bold rounded-xl transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // NPM Package details dashboard
  return <NpmPackageDashboard packageName={packageName} />;
}

function NpmPackageDashboard({ packageName }: { packageName: string }) {
  const router = useRouter();
  const { data, error, isLoading, isFetching, refresh } =
    useNpmPackage(packageName);

  // Custom deterministic scoring calculations
  const scores = data
    ? (() => {
        const popularity = Math.min(
          100,
          Math.round(Math.log10(data.monthlyDownloads + 1) * 16),
        );
        let quality = 20; // base score
        if (data.hasTypeScript) quality += 25;
        if (data.hasESM) quality += 20;
        if (data.hasCJS) quality += 15;
        if (!data.isDeprecated) quality += 20;

        const overall = Math.round(popularity * 0.4 + quality * 0.6);
        return { overall, popularity, quality };
      })()
    : { overall: 0, popularity: 0, quality: 0 };

  const findings = data
    ? (() => {
        const list = [];
        if (data.isDeprecated) {
          list.push({
            type: "danger",
            title: "Package is Deprecated",
            description:
              data.deprecationMessage ||
              "This package has been marked as deprecated by its maintainers.",
          });
        }
        if (data.hasTypeScript) {
          list.push({
            type: "success",
            title: "First-Class TypeScript Support",
            description:
              "Ship types natively. Great integration for typescript-based workflows.",
          });
        } else {
          list.push({
            type: "warning",
            title: "Missing Type Declarations",
            description:
              "This package does not ship type declarations natively. Users will need to install @types packages if available.",
          });
        }
        if (data.weeklyDownloads > 100000) {
          list.push({
            type: "success",
            title: "High Popularity & Adoption",
            description: `With ${data.weeklyDownloads.toLocaleString()} weekly downloads, this package has significant ecosystem adoption.`,
          });
        }
        if (data.releaseFrequency < 1) {
          list.push({
            type: "warning",
            title: "No Recent Releases",
            description:
              "No new package versions published in the last 365 days. Verify if the project is actively maintained.",
          });
        }
        return list;
      })()
    : [];

  const recommendations = data
    ? (() => {
        const list = [];
        if (!data.hasTypeScript) {
          list.push({
            title: "Migrate to TypeScript",
            description:
              "Add typescript declarations to improve security, developer experience, and package intelligence scoring.",
          });
        }
        if (!data.hasESM) {
          list.push({
            title: "Support ESM format",
            description:
              "Provide an ESM build tag to align with modern JavaScript bundling standards.",
          });
        }
        if (data.isDeprecated) {
          list.push({
            title: "Migrate to Active Alternative",
            description:
              "This package is deprecated. Check for the recommended replacement in the deprecation notice.",
          });
        }
        return list;
      })()
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-50" />

      <main className="relative max-w-7xl mx-auto px-6 py-12 z-10 flex flex-col gap-10">
        <LoadingOverlay
          isLoading={isLoading || isFetching}
          title={`Scanning NPM Package ${packageName}...`}
          steps={STEPS}
        />

        {error && (
          <div className="max-w-xl mx-auto w-full">
            <ErrorAlert
              error={error}
              message={error.message}
              onRetry={refresh}
            />
          </div>
        )}

        {data && !isLoading && !isFetching && (
          <div className="space-y-8 animate-fade-in">
            {/* Backlinks */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-md">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Backlinks:
                </span>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="px-3 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition-all"
                >
                  Home
                </button>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={refresh}
                  className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
                  title="Force Refresh Data"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Title Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <Terminal className="h-6 w-6 text-red-500" />
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent animate-fade-in">
                  {data.name}
                </h1>
                <span className="text-xs px-2.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 font-semibold rounded-full">
                  npm package
                </span>
              </div>
              <p className="text-slate-400 text-sm max-w-2xl">
                {data.description || "No description provided."}
              </p>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Overall Score & Metrics */}
              <div className="space-y-8 lg:col-span-1">
                {/* Score Panel */}
                <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                    Package score
                  </span>

                  <div className="relative flex items-center justify-center w-36 h-36">
                    <svg
                      className="w-full h-full transform -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <title>Package score gauge</title>
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-slate-950"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-red-500 transition-all duration-1000 ease-out"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray="251.2"
                        strokeDashoffset={
                          251.2 - (251.2 * scores.overall) / 100
                        }
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-4xl font-extrabold text-white">
                        {scores.overall}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        Points
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full mt-6 pt-6 border-t border-slate-800/80">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-slate-500 font-semibold">
                        Popularity
                      </span>
                      <span className="text-lg font-bold text-slate-200">
                        {scores.popularity}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-slate-500 font-semibold">
                        Quality
                      </span>
                      <span className="text-lg font-bold text-slate-200">
                        {scores.quality}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Registry Details */}
                <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Registry Info
                  </h3>
                  <div className="space-y-3.5 text-sm font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Version</span>
                      <span className="text-slate-300 font-mono">
                        {data.version}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Weekly Downloads</span>
                      <span className="text-slate-300">
                        {data.weeklyDownloads.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Monthly Downloads</span>
                      <span className="text-slate-300">
                        {data.monthlyDownloads.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">License</span>
                      <span className="text-slate-300">
                        {data.license || "None"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Versions</span>
                      <span className="text-slate-300">
                        {data.versionsCount}
                      </span>
                    </div>
                  </div>

                  {data.repository && (
                    <a
                      href={
                        data.repository.startsWith("git+")
                          ? data.repository.slice(4)
                          : data.repository
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex items-center justify-center gap-2 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all shadow"
                    >
                      View Repository <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Right Column: Details & Intelligence */}
              <div className="lg:col-span-2 space-y-8">
                {/* Package Quality Badges */}
                <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Ecosystem Quality Signals
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-1.5 items-center justify-center text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        TypeScript
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${data.hasTypeScript ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-slate-900 text-slate-500 border border-slate-800"}`}
                      >
                        {data.hasTypeScript ? "Supported" : "Missing"}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-1.5 items-center justify-center text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        ESM Support
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${data.hasESM ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-900 text-slate-500 border border-slate-800"}`}
                      >
                        {data.hasESM ? "Yes" : "No"}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-1.5 items-center justify-center text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        CJS Support
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${data.hasCJS ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-slate-900 text-slate-500 border border-slate-800"}`}
                      >
                        {data.hasCJS ? "Yes" : "No"}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-1.5 items-center justify-center text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        Release Rate
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {data.releaseFrequency} / yr
                      </span>
                    </div>
                  </div>
                </div>

                {/* Findings List */}
                <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Findings
                  </h3>
                  {findings.length > 0 ? (
                    <div className="space-y-4">
                      {findings.map((f) => (
                        <div
                          key={f.title}
                          className={`p-4 border rounded-xl flex gap-3 text-left ${
                            f.type === "danger"
                              ? "bg-red-500/5 border-red-500/20 text-red-200"
                              : f.type === "warning"
                                ? "bg-amber-500/5 border-amber-500/20 text-amber-200"
                                : "bg-emerald-500/5 border-emerald-500/20 text-emerald-200"
                          }`}
                        >
                          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="font-bold text-sm block">
                              {f.title}
                            </span>
                            <span className="text-xs text-slate-400 leading-normal">
                              {f.description}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">
                      No critical findings scanned.
                    </p>
                  )}
                </div>

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                      Recommendations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendations.map((rec) => (
                        <div
                          key={rec.title}
                          className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-left"
                        >
                          <span className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-indigo-400" />
                            {rec.title}
                          </span>
                          <p className="text-xs text-slate-400 leading-normal">
                            {rec.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
