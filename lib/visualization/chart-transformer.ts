/**
 * Chart Transformer
 *
 * Transforms detected data patterns into recharts-compatible formats
 * Supports optional dataMapping hints from visualization metadata
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
 * Data mapping hints from visualization metadata
 * Specifies which fields should map to which chart dimensions
 */
export interface DataMapping {
  xAxis?: string;
  yAxis?: string[];
  category?: string;
  value?: string;
}

/**
 * Default color palette for charts (unified across all chart types)
 * Must match the palette used in chart components for consistency
 */
const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

/**
 * Transform time-series data for Area/Line chart
 * @param pattern Data pattern with structured data
 * @param dataMapping Optional hints specifying xAxis and yAxis field mappings
 */
export function transformTimeSeriesData(pattern: DataPattern, dataMapping?: DataMapping): TimeSeriesData {
  const { data } = pattern;
  const keys = Object.keys(data);

  // Determine time key: prefer dataMapping hint, then heuristic detection
  let timeKey = '';
  let valueKeys: string[] = [];

  if (dataMapping?.xAxis && keys.includes(dataMapping.xAxis)) {
    // Use explicit xAxis from dataMapping
    timeKey = dataMapping.xAxis;
    valueKeys = dataMapping.yAxis && Array.isArray(dataMapping.yAxis)
      ? dataMapping.yAxis.filter((k) => keys.includes(k))
      : keys.filter((k) => k !== timeKey);
  } else {
    // Fallback to heuristic detection
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
 * @param pattern Data pattern with structured data
 * @param dataMapping Optional hints specifying category and value field mappings
 */
export function transformComparisonData(pattern: DataPattern, dataMapping?: DataMapping): ComparisonData {
  const { data } = pattern;
  const keys = Object.keys(data);

  // Determine category key: prefer dataMapping hint, then heuristic detection
  let categoryKey = '';
  let valueKeys: string[] = [];

  if (dataMapping?.category && keys.includes(dataMapping.category)) {
    // Use explicit category from dataMapping
    categoryKey = dataMapping.category;
    valueKeys = dataMapping.yAxis && Array.isArray(dataMapping.yAxis)
      ? dataMapping.yAxis.filter((k) => keys.includes(k) && k !== categoryKey)
      : keys.filter((k) => k !== categoryKey && (typeof data[k] === 'number' || Array.isArray(data[k])));
  } else {
    // Fallback to heuristic detection
    // Prefer the key with string values (for category labels)
    categoryKey = keys.find((k) => {
      if (typeof data[k] === 'string') return true;
      if (Array.isArray(data[k]) && data[k].length > 0 && typeof data[k][0] === 'string') {
        return true;
      }
      return false;
    }) || keys[0];

    // Find value keys: numeric values or numeric arrays, excluding the category key
    valueKeys = keys.filter(
      (k) => k !== categoryKey && (typeof data[k] === 'number' || Array.isArray(data[k]))
    );
  }

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
 * @param pattern Data pattern with structured data
 * @param dataMapping Optional hints specifying category and value field mappings
 */
export function transformDistributionData(pattern: DataPattern, dataMapping?: DataMapping): DistributionData {
  const { data } = pattern;
  const keys = Object.keys(data);

  // Determine category and value keys: prefer dataMapping hints
  let categoryKey = '';
  let valueKey = '';

  if (dataMapping?.category && keys.includes(dataMapping.category)) {
    categoryKey = dataMapping.category;
  } else {
    categoryKey = keys.find((k) => typeof data[k] === 'string') || keys[0];
  }

  if (dataMapping?.value && keys.includes(dataMapping.value)) {
    valueKey = dataMapping.value;
  } else {
    valueKey = keys.find((k) => typeof data[k] === 'number') || keys.find((k) => k !== categoryKey) || keys[1];
  }

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
 * @param pattern Data pattern with structured data
 * @param dataMapping Optional hints specifying field mappings (from visualization metadata)
 */
export function transformPatternToChartData(
  pattern: DataPattern,
  dataMapping?: DataMapping
): TimeSeriesData | ComparisonData | DistributionData | TableData {
  switch (pattern.type) {
    case 'timeseries':
      return transformTimeSeriesData(pattern, dataMapping);
    case 'comparison':
      return transformComparisonData(pattern, dataMapping);
    case 'distribution':
      return transformDistributionData(pattern, dataMapping);
    case 'table':
      return transformTableData(pattern);
    default:
      throw new Error(`Unknown pattern type: ${(pattern as any).type}`);
  }
}
