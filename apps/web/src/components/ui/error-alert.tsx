"use client";

import { AlertTriangle, X } from "lucide-react";
import type * as React from "react";
import { parseRateLimitError } from "@/lib/utils";
import { RateLimitWarning } from "./rate-limit-warning";

interface ErrorAlertProps {
  error?: unknown;
  message: string;
  onRetry: () => void;
  onDismiss?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  message,
  onRetry,
  onDismiss,
}) => {
  const { isRateLimit } = parseRateLimitError(error);

  if (isRateLimit) {
    return (
      <RateLimitWarning error={error} onRetry={onRetry} onDismiss={onDismiss} />
    );
  }
  return (
    <div className="relative pointer-events-auto p-5 bg-rose-950/90 border border-rose-500/30 rounded-2xl flex gap-3.5 items-start text-rose-200 shadow-2xl animate-slide-in">
      <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0" />
      <div className="space-y-1 pr-6">
        <h4 className="font-bold text-sm">Analysis Failed</h4>
        <p className="text-xs text-rose-300 leading-relaxed">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline mt-2 block"
        >
          Retry Request
        </button>
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
