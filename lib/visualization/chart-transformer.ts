/**
 * Chart Transformer
 *
 * Transforms detected data patterns into recharts-compatible formats
 */

import { DataPattern } from './chart-detector';

export interface ChartDataPoint {
  [key: string]: string | number;
}

export interface TimeSeriesData {
  data: ChartDataPoint[];
  lines: { name: string; key: string; stroke: string }[];
}

export interface ComparisonData {
  data: ChartDataPoint[];
  bars: { name: string; key: string; fill: string }[];
}

export interface DistributionData {
  data: ChartDataPoint[];
  dataKey: string;
  nameKey: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

/**
 * Default color palette for charts
 */
const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#14b8a6', // teal
];

/**
 * Transform time-series data for Area/Line chart
 */
export function transformTimeSeriesData(pattern: DataPattern): TimeSeriesData {
  const { data } = pattern;
  const keys = Object.keys(data);

  // Find time/date key
  let timeKey = '';
  let valueKeys: string[] = [];

  for (const key of keys) {
    if (
      key.toLowerCase().includes('time') ||
      key.toLowerCase().includes('date') ||
      key.toLowerCase().includes('hour') ||
      key.toLowerCase().includes('day')
    ) {
      timeKey = key;
    } else if (typeof data[key] === 'number' || Array.isArray(data[key])) {
      valueKeys.push(key);
    }
  }

  // If no explicit time key, use first key
  if (!timeKey && keys.length > 0) {
    timeKey = keys[0];
    valueKeys = keys.slice(1);
  }

  // Build data points
  const chartData: ChartDataPoint[] = [];
  const maxLength = Math.max(
    ...(Array.isArray(data[timeKey])
      ? [data[timeKey].length]
      : valueKeys.map((k) => (Array.isArray(data[k]) ? data[k].length : 1)))
  );

  for (let i = 0; i < maxLength; i++) {
    const point: ChartDataPoint = {};

    if (Array.isArray(data[timeKey])) {
      point[timeKey] = data[timeKey][i];
    } else {
      point[timeKey] = `${timeKey} ${i + 1}`;
    }

    for (const key of valueKeys) {
      if (Array.isArray(data[key])) {
        point[key] = data[key][i];
      } else {
        point[key] = data[key];
      }
    }

    chartData.push(point);
  }

  const lines = valueKeys.map((key, idx) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    key,
    stroke: COLORS[idx % COLORS.length],
  }));

  return {
    data: chartData,
    lines,
  };
}

/**
 * Transform comparison data for Bar chart
 */
export function transformComparisonData(pattern: DataPattern): ComparisonData {
  const { data } = pattern;
  const keys = Object.keys(data);

  // Separate category and value keys
  // Prefer the key with string values (for category labels)
  let categoryKey = keys.find((k) => {
    if (typeof data[k] === 'string') return true;
    if (Array.isArray(data[k]) && data[k].length > 0 && typeof data[k][0] === 'string') {
      return true;
    }
    return false;
  }) || keys[0];

  // Find value keys: numeric values or numeric arrays, excluding the category key
  const valueKeys = keys.filter(
    (k) => k !== categoryKey && (typeof data[k] === 'number' || Array.isArray(data[k]))
  );

  const chartData: ChartDataPoint[] = [];

  // If arrays, zip them together
  if (Array.isArray(data[categoryKey])) {
    const categoryArray = data[categoryKey];
    const maxLength = categoryArray.length;

    for (let i = 0; i < maxLength; i++) {
      const point: ChartDataPoint = {
        [categoryKey]: categoryArray[i],
      };

      for (const key of valueKeys) {
        if (Array.isArray(data[key])) {
          point[key] = data[key][i];
        } else {
          point[key] = data[key];
        }
      }

      chartData.push(point);
    }
  } else {
    // Single category, multiple values
    const point: ChartDataPoint = { [categoryKey]: data[categoryKey] };
    for (const key of valueKeys) {
      point[key] = data[key];
    }
    chartData.push(point);
  }

  const bars = valueKeys.map((key, idx) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    key,
    fill: COLORS[idx % COLORS.length],
  }));

  return {
    data: chartData,
    bars,
  };
}

/**
 * Transform distribution data for Pie chart
 */
export function transformDistributionData(pattern: DataPattern): DistributionData {
  const { data } = pattern;
  const keys = Object.keys(data);

  const categoryKey = keys.find(
    (k) => typeof data[k] === 'string'
  ) || keys[0];

  const valueKey = keys.find(
    (k) => typeof data[k] === 'number'
  ) || keys.find((k) => k !== categoryKey) || keys[1];

  const chartData: ChartDataPoint[] = [];

  if (Array.isArray(data[categoryKey])) {
    const categories = data[categoryKey];
    const values = Array.isArray(data[valueKey]) ? data[valueKey] : [];

    for (let i = 0; i < categories.length; i++) {
      chartData.push({
        [categoryKey]: categories[i],
        [valueKey]: values[i] || 0,
      });
    }
  } else {
    for (const key of keys) {
      if (key !== categoryKey && typeof data[key] === 'number') {
        chartData.push({
          [categoryKey]: key,
          [valueKey]: data[key],
        });
      }
    }
  }

  return {
    data: chartData,
    nameKey: categoryKey,
    dataKey: valueKey,
  };
}

/**
 * Transform table data
 */
export function transformTableData(pattern: DataPattern): TableData {
  return {
    headers: pattern.data.headers,
    rows: pattern.data.rows,
  };
}

/**
 * Main transformer function
 */
export function transformPatternToChartData(
  pattern: DataPattern
): TimeSeriesData | ComparisonData | DistributionData | TableData {
  switch (pattern.type) {
    case 'timeseries':
      return transformTimeSeriesData(pattern);
    case 'comparison':
      return transformComparisonData(pattern);
    case 'distribution':
      return transformDistributionData(pattern);
    case 'table':
      return transformTableData(pattern);
    default:
      throw new Error(`Unknown pattern type: ${(pattern as any).type}`);
  }
}
