/**
 * Chart Detector
 *
 * Intelligently detects visualizable data patterns in agent responses
 * Supports: time-series, comparisons, distributions, breakdowns, tables
 */

import { isTableTimeSeries, convertTableToTimeSeries } from './data-extractor';

export interface DataPattern {
  type: 'timeseries' | 'comparison' | 'distribution' | 'breakdown' | 'table';
  confidence: number; // 0-1
  data: any;
  metadata: {
    title?: string;
    description?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
  };
}

/**
 * Extracts JSON blocks from text content
 * Uses balanced brace counting for reliable extraction
 */
function extractJsonBlocks(content: string): any[] {
  const jsonBlocks: any[] = [];


  // Strategy 1: Look for code blocks with ```json
  const jsonCodeBlockRegex = /```json\s*\n([\s\S]*?)\n```/g;
  let match;
  while ((match = jsonCodeBlockRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      jsonBlocks.push(parsed);
    } catch (e) {
    }
  }

  // Strategy 2: Look for bare JSON objects using brace counting
  const chars = content.split('');
  let braceCount = 0;
  let start = -1;

  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === '{') {
      if (braceCount === 0) {
        start = i;
      }
      braceCount++;
    } else if (chars[i] === '}') {
      braceCount--;
      if (braceCount === 0 && start !== -1) {
        try {
          const jsonStr = content.substring(start, i + 1);
          const parsed = JSON.parse(jsonStr);
          jsonBlocks.push(parsed);
          start = -1;
        } catch (e) {
          start = -1;
        }
      }
    }
  }

  return jsonBlocks;
}

/**
 * Extracts markdown tables from content
 * Strict validation to avoid catching broken/partial data
 */
function extractMarkdownTables(
  content: string
): { headers: string[]; rows: string[][] }[] {
  const tables: { headers: string[]; rows: string[][] }[] = [];
  const lines = content.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // Look for lines that start and end with pipes
    if (!line.startsWith('|') || !line.endsWith('|')) {
      i++;
      continue;
    }

    // Next line should be separator
    if (i + 1 >= lines.length) {
      i++;
      continue;
    }

    const separatorLine = lines[i + 1].trim();
    if (!separatorLine.startsWith('|') || !separatorLine.includes('-')) {
      i++;
      continue;
    }

    // Parse header
    const headerCells = line
      .split('|')
      .map((cell) => cell.trim())
      .filter((cell) => cell && cell !== '');

    if (headerCells.length < 2) {
      i++;
      continue;
    }

    // Parse separator to validate column count
    const separatorCells = separatorLine
      .split('|')
      .map((cell) => cell.trim())
      .filter((cell) => cell !== '');

    // Separator should have same number of columns as header
    if (separatorCells.length !== headerCells.length) {
      i++;
      continue;
    }

    // Collect data rows
    const rows: string[][] = [];
    let j = i + 2;

    while (j < lines.length) {
      const dataLine = lines[j].trim();

      // Stop if line doesn't look like table row
      if (!dataLine.startsWith('|') || !dataLine.endsWith('|')) {
        break;
      }

      const cells = dataLine
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell !== '');

      // Row should have consistent column count
      if (cells.length !== headerCells.length) {
        break;
      }

      rows.push(cells);
      j++;
    }

    // Only accept tables with at least 1 data row
    if (rows.length > 0) {
      tables.push({
        headers: headerCells,
        rows,
      });
      i = j;
    } else {
      i++;
    }
  }

  return tables;
}

/**
 * Checks if data is a valid time-series
 */
function isTimeSeries(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const keys = Object.keys(data);

  if (keys.length < 2) {
    return false;
  }

  // Look for time-related keys with numeric values
  const hasTimeKey = keys.some(
    (k) =>
      k.toLowerCase().includes('time') ||
      k.toLowerCase().includes('date') ||
      k.toLowerCase().includes('hour') ||
      k.toLowerCase().includes('day') ||
      k.toLowerCase().includes('week') ||
      k.toLowerCase().includes('month')
  );

  // Check if values contain numeric sequences
  const hasNumericValues = keys.some((k) => {
    const value = data[k];
    const isNumArray = Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === 'number');
    return isNumArray;
  });


  return hasTimeKey || (hasNumericValues && keys.length <= 5);
}

/**
 * Checks if data is a comparison (one category, multiple values)
 */
function isComparison(data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  const keys = Object.keys(data);
  if (keys.length < 2) return false;

  // Count numeric values
  const numericCount = keys.filter((k) => typeof data[k] === 'number').length;
  const percentNumeric = numericCount / keys.length;

  // Likely a comparison if >70% numeric values
  return percentNumeric >= 0.7 && numericCount >= 2;
}

/**
 * Checks if data is a distribution (key-value pairs)
 */
function isDistribution(data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  const keys = Object.keys(data);
  if (keys.length < 2) return false;

  // Check if it looks like a breakdown/distribution
  const hasPercentages = keys.some(
    (k) => k.toLowerCase().includes('percent') || k.toLowerCase().includes('distribution')
  );

  const numericValues = keys.filter((k) => typeof data[k] === 'number');
  return hasPercentages || numericValues.length >= keys.length * 0.6;
}

/**
 * Main detection function
 */
export function detectVisualizablePatterns(content: string): DataPattern[] {
  const patterns: DataPattern[] = [];


  // Extract and analyze JSON blocks
  const jsonBlocks = extractJsonBlocks(content);

  for (const block of jsonBlocks) {

    if (isTimeSeries(block)) {
      patterns.push({
        type: 'timeseries',
        confidence: 0.85,
        data: block,
        metadata: {
          title: 'Time Series Data',
          xAxisLabel: 'Time',
          yAxisLabel: 'Value',
        },
      });
    } else if (isDistribution(block)) {
      patterns.push({
        type: 'distribution',
        confidence: 0.8,
        data: block,
        metadata: {
          title: 'Distribution',
        },
      });
    } else if (isComparison(block)) {
      patterns.push({
        type: 'comparison',
        confidence: 0.75,
        data: block,
        metadata: {
          title: 'Comparison',
        },
      });
    } else {
    }
  }

  // Extract and analyze markdown tables
  const tables = extractMarkdownTables(content);

  for (const table of tables) {
    // Check if this table is actually time-series data and convert if applicable
    if (isTableTimeSeries(table.headers, table.rows)) {
      const timeSeriesPattern = convertTableToTimeSeries(table.headers, table.rows);
      patterns.push(timeSeriesPattern);
    } else {
      // Keep as regular table if not time-series
      patterns.push({
        type: 'table',
        confidence: 0.95,
        data: table,
        metadata: {
          title: 'Data Table',
        },
      });
    }
  }

  // Return only high-confidence patterns
  const filtered = patterns.filter((p) => p.confidence >= 0.75).slice(0, 3);
  return filtered; // Max 3 visualizations per message
}

/**
 * Check if message has any visualizable data
 */
export function hasVisualizableData(content: string): boolean {
  const patterns = detectVisualizablePatterns(content);
  return patterns.length > 0;
}
