"use client";

import type React from "react";
import { FaGithub } from "react-icons/fa";

interface ReadmeCardProps {
  readme: string;
}

export const ReadmeCard: React.FC<ReadmeCardProps> = ({ readme }) => {
  if (!readme) return null;

  // Simple profile README regex markdown parser (safe and zero-dependency)
  const renderReadme = (md: string) => {
    const lines = md
      .split("\n")
      .map((text, id) => ({ id: `readme-line-${id}`, text }));
    return lines.map((line) => {
      const clean = line.text.trim();
      if (clean.startsWith("# ")) {
        return (
          <h1
            key={line.id}
            className="text-lg font-bold text-slate-100 mt-4 mb-2 border-b border-slate-800 pb-1"
          >
            {clean.slice(2)}
          </h1>
        );
      }
      if (clean.startsWith("## ")) {
        return (
          <h2
            key={line.id}
            className="text-base font-bold text-slate-200 mt-3.5 mb-1.5"
          >
            {clean.slice(3)}
          </h2>
        );
      }
      if (clean.startsWith("### ")) {
        return (
          <h3
            key={line.id}
            className="text-sm font-bold text-slate-300 mt-2 mb-1"
          >
            {clean.slice(4)}
          </h3>
        );
      }
      if (clean.startsWith("- ") || clean.startsWith("* ")) {
        return (
          <li
            key={line.id}
            className="text-xs text-slate-400 ml-4 list-disc my-0.5"
          >
            {clean.slice(2)}
          </li>
        );
      }
      return (
        <p
          key={line.id}
          className="text-xs text-slate-400 min-h-[1.25em] leading-relaxed my-1 font-medium"
        >
          {clean}
        </p>
      );
    });
  };

  return (
    <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl flex flex-col gap-4">
      <h3 className="text-base font-bold flex items-center gap-2 text-indigo-400">
        <FaGithub className="h-5 w-5" /> GitHub Profile README
      </h3>
      <div className="max-h-60 overflow-y-auto pr-2 rounded-xl bg-slate-950/40 p-4 border border-slate-850">
        <div className="space-y-1">{renderReadme(readme)}</div>
      </div>
    </div>
  );
};
