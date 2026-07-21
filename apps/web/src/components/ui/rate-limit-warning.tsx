"use client";

import { AlertTriangle, X } from "lucide-react";
import type * as React from "react";
import { useEffect, useState } from "react";
import { FaKey as KeyIcon } from "react-icons/fa";
import { savePatCookie } from "@/lib/api-client";
import { parseRateLimitError } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";

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
  const [hasGithubPat, setHasGithubPat] = useState(false);
  const [patInput, setPatInput] = useState("");
  const [showPatConfig, setShowPatConfig] = useState(true);
  const [cooldown, setCooldown] = useState("");

  // Check token status on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      fetch("/api/auth/status", { credentials: "same-origin" })
        .then((r) => r.json())
        .then((data) => {
          setHasGithubPat(!!data.hasGithubPat);
        })
        .catch(() => {
          setHasGithubPat(false);
        });
    }
  }, []);

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

  const handleSavePat = async () => {
    if (patInput) {
      await savePatCookie(patInput);
      setPatInput("");
    }
    onRetry();
  };

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

      {/* PAT retry interface */}
      <div className="border-t border-slate-800/80 pt-4 mt-1 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <KeyIcon className="text-indigo-400 h-3.5 w-3.5" /> Have a token?
          </span>
          <button
            type="button"
            onClick={() => setShowPatConfig(!showPatConfig)}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline"
          >
            {showPatConfig ? "Cancel" : "Add Git PAT"}
          </button>
        </div>
        {showPatConfig && (
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder={
                hasGithubPat
                  ? "•••••••••••••••• (Configured)"
                  : "Enter GitHub PAT..."
              }
              value={patInput}
              onChange={(e) => setPatInput(e.target.value)}
              className="flex-1 text-xs h-9 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl"
            />
            <Button
              type="button"
              onClick={handleSavePat}
              size="sm"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              Save & Retry
            </Button>
          </div>
        )}
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
