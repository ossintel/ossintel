"use client";

import { AlertTriangle, X } from "lucide-react";
import type * as React from "react";
import { useEffect, useState } from "react";
import { parseRateLimitError } from "@/lib/utils";
import { GithubIcon } from "../icons";

interface RateLimitWarningProps {
  error: unknown;
  onRetry: () => void;
  onDismiss?: () => void;
}

export const RateLimitWarning: React.FC<RateLimitWarningProps> = ({
  error,
  onRetry,
  onDismiss,
}) => {
  const [cooldown, setCooldown] = useState("");

  // Cooldown countdown timer
  useEffect(() => {
    const { resetTime } = parseRateLimitError(error);
    const targetReset =
      resetTime || new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const interval = setInterval(() => {
      const resetDate = new Date(targetReset);
      const diffSec = Math.ceil((resetDate.getTime() - Date.now()) / 1000);
      if (diffSec <= 0) {
        setCooldown("");
        clearInterval(interval);
        onRetry();
      } else {
        const hours = Math.floor(diffSec / 3600);
        const mins = Math.floor((diffSec % 3600) / 60);
        const secs = diffSec % 60;
        if (hours > 0) {
          setCooldown(`${hours}h ${mins}m ${secs}s`);
        } else if (mins > 0) {
          setCooldown(`${mins}m ${secs}s`);
        } else {
          setCooldown(`${secs}s`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [error, onRetry]);

  return (
    <div className="relative pointer-events-auto p-6 bg-slate-900/95 border border-rose-500/30 rounded-2xl shadow-2xl flex flex-col gap-4 text-left">
      <div className="flex gap-4 items-start text-rose-200">
        <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0 mt-1" />
        <div className="space-y-1 pr-6">
          <h4 className="font-extrabold text-sm text-rose-400">
            GitHub API Rate Limit Exceeded
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your search rate limit was reached. It will automatically reset in{" "}
            <strong className="text-indigo-400">
              {cooldown || "a moment"}
            </strong>
            .
          </p>
        </div>
      </div>

      {/* OAuth Sign In Action */}
      <div className="border-t border-slate-800/80 pt-4 mt-1 space-y-3">
        <p className="text-xs text-slate-400">
          Connect your GitHub account to immediately increase your limit to
          5,000 requests/hour.
        </p>
        <a
          href="/api/auth/github"
          className="flex items-center justify-center gap-2 w-full p-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md text-center"
        >
          <GithubIcon className="h-4 w-4 shrink-0" /> Connect GitHub Account
        </a>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
