"use client";

import { Sparkles } from "lucide-react";
import * as React from "react";

interface LoadingOverlayProps {
  isLoading: boolean;
  title: string;
  steps: string[];
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  title,
  steps,
}) => {
  const [loadingStep, setLoadingStep] = React.useState(0);

  React.useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 900);
    return () => clearInterval(interval);
  }, [isLoading, steps.length]);

  if (!isLoading) return null;

  return (
    <div className="max-w-xl mx-auto w-full p-8 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl flex flex-col gap-6 items-center text-center">
      <div className="relative">
        <div className="h-16 w-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
        <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-indigo-400 animate-pulse" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-slate-400 max-w-sm h-12 flex items-center justify-center">
          {steps[loadingStep]}
        </p>
      </div>
      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
          style={{
            width: `${((loadingStep + 1) / steps.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
};
