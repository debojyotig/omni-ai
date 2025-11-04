/**
 * Chart Detector
 *
 * Intelligently detects visualizable data patterns in agent responses
 * Supports: time-series, comparisons, distributions, breakdowns, tables
 */

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
 */
function extractJsonBlocks(content: string): any[] {
  const jsonBlocks: any[] = [];
  const jsonRegex = /```json\n([\s\S]*?)\n```|{[\s\S]*?}|\[[\s\S]*?]/g;
  let match;

  while ((match = jsonRegex.exec(content)) !== null) {
    try {
      const jsonStr = match[1] || match[0];
      const parsed = JSON.parse(jsonStr);
      jsonBlocks.push(parsed);
    } catch {
      // Skip invalid JSON
    }
  }

  return jsonBlocks;
}

/**
 * Extracts markdown tables from content
 */
function extractMarkdownTables(
  content: string
): { headers: string[]; rows: string[][] }[] {
  const tables: { headers: string[]; rows: string[][] }[] = [];
  const tableRegex = /\|[\s\S]*?\|/g;
  const matches = content.match(tableRegex);

  if (!matches) return tables;

  let currentTableLines: string[] = [];
  for (const match of matches) {
    const lines = match.trim().split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        currentTableLines.push(line);
      }
    }
  }

  if (currentTableLines.length >= 2) {
    const headerLine = currentTableLines[0]
      .split('|')
      .map((h) => h.trim())
      .filter((h) => h && h !== '-');

    const separatorLine = currentTableLines[1];
    if (separatorLine.includes('-')) {
      const rows = currentTableLines.slice(2).map((line) =>
        line
          .split('|')
          .map((cell) => cell.trim())
          .filter((cell) => cell)
      );

      tables.push({
        headers: headerLine,
        rows,
      });
    }
  }

  return tables;
}

/**
 * Checks if data is a valid time-series
 */
function isTimeSeries(data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  const keys = Object.keys(data);
  if (keys.length < 2) return false;

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
    return (
      Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === 'number')
    );
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
    }
  }

  // Extract and analyze markdown tables
  const tables = extractMarkdownTables(content);
  for (const table of tables) {
    patterns.push({
      type: 'table',
      confidence: 0.95,
      data: table,
      metadata: {
        title: 'Data Table',
      },
    });
  }

  // Return only high-confidence patterns
  return patterns.filter((p) => p.confidence >= 0.75).slice(0, 3); // Max 3 visualizations per message
}

/**
 * Check if message has any visualizable data
 */
export function hasVisualizableData(content: string): boolean {
  const patterns = detectVisualizablePatterns(content);
  return patterns.length > 0;
}
