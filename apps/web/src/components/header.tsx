"use client";

import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import icon from "@/app/icon.png";
import { GithubIcon } from "@/components/icons";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  // Let Fumadocs handle its own header layout for docs
  if (pathname?.startsWith("/docs")) {
    return null;
  }

  const isHome = pathname === "/";

  if (isHome) {
    return (
      <header className="relative border-b border-slate-900 bg-slate-950/20 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg shadow-slate-900/10">
              <img
                src={icon.src}
                alt="OSSIntel Logo"
                className="h-9 w-9 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
                OSS<span className="text-green-700">Intel</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Open Source Intelligence Platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/docs"
              className="text-sm font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="h-4 w-4" /> Docs
            </Link>
            <a
              href="https://github.com/mayank1513/ossintel"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <GithubIcon className="h-4 w-4" /> GitHub
            </a>
          </div>
        </div>
      </header>
    );
  }

  // Dashboard, Repo, and User page headers
  return (
    <header className="relative border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Search
        </button>
        <div className="flex items-center gap-2">
          <div className="p-0.5 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <img
              src={icon.src}
              alt="OSSIntel Logo"
              className="h-6 w-6 object-contain"
            />
          </div>
          <span className="text-sm font-bold">OSSIntel</span>
        </div>
      </div>
    </header>
  );
}
