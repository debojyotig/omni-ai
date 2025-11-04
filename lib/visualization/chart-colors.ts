/**
 * Unified Color Palette for All Charts
 *
 * This is the SINGLE SOURCE OF TRUTH for chart colors.
 * Used by:
 * - chart-transformer.ts (data transformation)
 * - bar-chart.tsx, area-chart.tsx, pie-chart.tsx (rendering)
 *
 * Ensure all chart-related files import from here
 */

export const CHART_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
] as const;

/**
 * Get color by index with wrapping
 * @param index The index of the color
 * @returns The color at that index (wraps if index exceeds palette length)
 */
export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * Get colors for a dataset
 * @param count Number of colors needed
 * @returns Array of colors
 */
export function getChartColors(count: number): string[] {
  return Array.from({ length: count }, (_, i) => getChartColor(i));
}
