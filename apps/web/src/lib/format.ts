/**
 * Format a number into a compact human-readable string.
 *
 * - 1,500,000 → "1.5M"
 * - 45,200    → "45.2k"
 * - 999       → "999"
 *
 * @param value - The number to format.
 * @param decimals - Decimal places for the compact suffix (default: 1).
 */
export const formatCompactNumber = (value: number, decimals = 1): string => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(decimals)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(decimals)}k`;
  }
  return value.toLocaleString();
};
