import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatLastUpdated = (date: string | Date) => {
  const d = new Date(date);
  const now = new Date();

  const diff = (now.getTime() - d.getTime()) / 1000;

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export interface RateLimitErrorDetails {
  isRateLimit: boolean;
  resetTime: string | null;
}

export function parseRateLimitError(error: unknown): RateLimitErrorDetails {
  if (!error) return { isRateLimit: false, resetTime: null };

  const errObj = error as {
    isRateLimit?: boolean;
    resetTime?: string;
    message?: string;
  };

  const isRateLimit = !!(
    errObj.isRateLimit ||
    errObj.message?.includes("rate_limit") ||
    errObj.message?.includes("Rate Limit Exceeded")
  );

  return {
    isRateLimit,
    resetTime: isRateLimit ? errObj.resetTime || null : null,
  };
}
