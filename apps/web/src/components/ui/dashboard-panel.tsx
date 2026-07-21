"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/utils";

interface DashboardPanelProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const DashboardPanel: React.FC<DashboardPanelProps> = ({
  title,
  icon: Icon,
  badgeCount,
  children,
  defaultOpen = false,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div
      className={cn(
        "bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden transition-all duration-300",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-t-3xl transition-colors hover:bg-slate-850/30"
      >
        <h3 className="text-base font-bold flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-indigo-400" />}
          <span>{title}</span>
          {badgeCount !== undefined && (
            <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-350 px-2 py-0.5 rounded-full font-bold ml-1">
              {badgeCount}
            </span>
          )}
        </h3>
        <span className="text-slate-500">
          {isOpen ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </span>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t border-slate-800/50 pt-4 animate-fade-in-up">
          {children}
        </div>
      )}
    </div>
  );
};
