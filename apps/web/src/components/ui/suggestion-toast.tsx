"use client";

import { X } from "lucide-react";
import type * as React from "react";

interface SuggestionToastProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onOverride: () => void;
  onDismiss: () => void;
}

export const SuggestionToast: React.FC<SuggestionToastProps> = ({
  title,
  message,
  onConfirm,
  onOverride,
  onDismiss,
}) => {
  return (
    <div className="relative pointer-events-auto p-5 bg-indigo-950/90 border border-indigo-500/30 rounded-2xl flex flex-col justify-between gap-4 shadow-2xl animate-slide-in">
      <div>
        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
          {title}
        </h4>
        <p className="text-sm text-slate-200 mt-1 pr-6">{message}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all"
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={onOverride}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
        >
          Override
        </button>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-200"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
