/**
 * Data Extractor
 *
 * Extracts structured data from plain text content
 * Handles: tables, time-series data, key-value pairs, and other structured formats
 */

import { DataPattern } from './chart-detector';

/**
 * Detects if a line is a table separator (dashes, pipes, etc.)
 */
function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  // Check for patterns like "--- --- ---" or "| --- | --- |"
  return /^[\s\-|]*$/.test(trimmed) && trimmed.length > 2;
}

/**
 * Extracts whitespace-aligned table from plain text
 * Simplified approach: split by 2+ whitespace
 * Example:
 * Date       Price   Change
 * Oct 28     100.5   +2%
 * Oct 29     102.1   +1.6%
 */
function extractPlainTextTable(content: string): DataPattern | null {
  const lines = content.split('\n').map((l) => l.trim()).filter((l) => l);

  if (lines.length < 3) return null;

  // Extract headers from first line
  const headerLine = lines[0];
  const headerParts = headerLine
    .split(/\s{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Need at least 2 columns
  if (headerParts.length < 2) return null;

  // Extract data rows
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Skip separator lines (dashes, pipes)
    if (isTableSeparator(line)) continue;

    // Split by 2+ spaces (standard table alignment)
    const cells = line
      .split(/\s{2,}/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Validate row structure
    // Allow ±1 flexibility for ragged columns
    const expectedCells = headerParts.length;
    if (cells.length < expectedCells - 1 || cells.length > expectedCells + 2) {
      // Row doesn't match header structure, skip it
      continue;
    }

    // Pad or trim to match header count
    while (cells.length < expectedCells) {
      cells.push('');
    }
    while (cells.length > expectedCells) {
      cells.pop();
    }

    rows.push(cells);
  }

  // Need at least 2 data rows to be a valid table
  if (rows.length < 2) return null;

  return {
    type: 'table',
    confidence: 0.85,
    data: {
      headers: headerParts,
      rows,
    },
    metadata: {
      title: 'Data Table',
      description: 'Extracted from plain text',
    },
  };
}

/**
 * Detects time-series patterns in plain text
 * Example: "Jan: 100, Feb: 200, Mar: 150"
 */
function extractTimeSeriesFromText(content: string): DataPattern | null {
  const months = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ];
  const monthPattern = new RegExp(`(${months.join('|')})`, 'gi');

  if (!monthPattern.test(content)) return null;

  // Try to extract month: value pairs
  const dataPoints: Record<string, number> = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const monthMatches = line.matchAll(/(\w+)\s*:?\s*([\d,.-]+)/gi);
    for (const match of monthMatches) {
      const month = match[1].toLowerCase().substring(0, 3);
      if (months.includes(month)) {
        const value = parseFloat(match[2].replace(/,/g, ''));
        if (!isNaN(value)) {
          dataPoints[month] = value;
        }
      }
    }
  }

  if (Object.keys(dataPoints).length < 2) return null;

  const sortedMonths = months.filter((m) => m in dataPoints);
  const dates = sortedMonths.map((m) => m.charAt(0).toUpperCase() + m.slice(1));
  const values = sortedMonths.map((m) => dataPoints[m]);

  return {
    type: 'timeseries',
    confidence: 0.75,
    data: {
      date: dates,
      value: values,
    },
    metadata: {
      title: 'Time Series Data',
      xAxisLabel: 'Month',
      yAxisLabel: 'Value',
    },
  };
}

/**
 * Extracts key-value data from plain text
 * Example: "Error Rate: 5.2%, Success Rate: 94.8%"
 */
function extractKeyValueData(content: string): DataPattern | null {
  // Look for patterns like "Key: Value" or "Key = Value"
  const kvPattern = /([A-Za-z][A-Za-z0-9\s]*)[:\=]\s*([\d,.-]+%?)/g;
  const dataPoints: Record<string, number | string> = {};
  let match;
  let count = 0;

  while ((match = kvPattern.exec(content)) !== null) {
    const key = match[1].trim();
    let value: any = match[2].trim();

    // Parse numeric value
    if (value.includes('%')) {
      value = parseFloat(value);
    } else {
      const parsed = parseFloat(value.replace(/,/g, ''));
      value = isNaN(parsed) ? value : parsed;
    }

    dataPoints[key] = value;
    count++;
  }

  if (count < 2) return null;

  // If all values are numeric, this could be a comparison or distribution
  const allNumeric = Object.values(dataPoints).every((v) => typeof v === 'number');

  if (allNumeric) {
    return {
      type: count > 5 ? 'distribution' : 'comparison',
      confidence: 0.7,
      data: dataPoints,
      metadata: {
        title: 'Data Summary',
        description: 'Extracted from key-value pairs',
      },
    };
  }

  return null;
}

/**
 * Checks if extracted table data is actually time-series data
 */
function isTableTimeSeries(headers: string[], rows: string[][]): boolean {
  if (rows.length < 2 || headers.length < 2) return false;

  // Look for date/time related headers
  const hasDateHeader = headers.some(
    (h) =>
      h.toLowerCase().includes('date') ||
      h.toLowerCase().includes('time') ||
      h.toLowerCase().includes('month') ||
      h.toLowerCase().includes('day')
  );

  if (!hasDateHeader) return false;

  // Check if other columns are mostly numeric
  const numericHeaders = headers.filter(
    (h) => !h.toLowerCase().includes('date') && !h.toLowerCase().includes('time')
  );

  let numericColumnCount = 0;
  for (const header of numericHeaders) {
    let isNumeric = true;
    for (const row of rows) {
      const idx = headers.indexOf(header);
      if (idx === -1) continue;

      const cell = row[idx]?.trim() || '';
      // Check if looks numeric (handles currency, percentages, etc.)
      if (
        cell &&
        !cell.match(/^[\d,.-]+%?$/) &&
        !cell.toLowerCase().includes('baseline')
      ) {
        isNumeric = false;
        break;
      }
    }
    if (isNumeric) numericColumnCount++;
  }

  return numericColumnCount >= Math.max(1, numericHeaders.length * 0.7);
}

/**
 * Converts a table to time-series format if it looks like time-series
 */
function convertTableToTimeSeries(headers: string[], rows: string[][]): DataPattern {
  const dateHeaderIdx = headers.findIndex(
    (h) =>
      h.toLowerCase().includes('date') ||
      h.toLowerCase().includes('time') ||
      h.toLowerCase().includes('month') ||
      h.toLowerCase().includes('day')
  );

  const dateHeader = dateHeaderIdx !== -1 ? headers[dateHeaderIdx] : 'Date';

  // Build time-series data structure
  const timeSeriesData: Record<string, any> = {
    [dateHeader]: rows.map((row) => row[dateHeaderIdx] || ''),
  };

  // Add numeric columns as values
  for (let i = 0; i < headers.length; i++) {
    if (i !== dateHeaderIdx) {
      const values = rows.map((row) => {
        const val = row[i]?.trim() || '';
        // Try to parse as number, removing currency symbols, commas, percentages
        const numeric = parseFloat(val.replace(/[$,%]/g, ''));
        return isNaN(numeric) ? val : numeric;
      });

      // Only include if mostly numeric
      const numericCount = values.filter((v) => typeof v === 'number').length;
      if (numericCount >= values.length * 0.7) {
        timeSeriesData[headers[i]] = values;
      }
    }
  }

  return {
    type: 'timeseries',
    confidence: 0.9,
    data: timeSeriesData,
    metadata: {
      title: 'Time Series Data',
      xAxisLabel: dateHeader,
      yAxisLabel: 'Value',
    },
  };
}

/**
 * Main extraction function - prioritizes Recharts visualizations
 * Tries multiple strategies in order of preference:
 * 1. Key-value pairs (for comparison/distribution charts)
 * 2. Time-series extraction from text
 * 3. Plain text tables (converted to time-series if applicable)
 */
export function extractStructuredData(content: string): DataPattern | null {
  // Strategy 1: Try key-value extraction (often reveals comparison data)
  const kvData = extractKeyValueData(content);
  if (kvData) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DataExtractor] Extracted key-value data:', kvData.type);
    }
    return kvData;
  }

  // Strategy 2: Try time-series extraction
  const timeSeriesData = extractTimeSeriesFromText(content);
  if (timeSeriesData) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DataExtractor] Extracted time-series from text');
    }
    return timeSeriesData;
  }

  // Strategy 3: Try plain text table (and convert to chart if possible)
  const tableData = extractPlainTextTable(content);
  if (tableData && tableData.data.headers && tableData.data.rows) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DataExtractor] Extracted table with headers:', tableData.data.headers);
    }

    // Aggressively try to convert to time-series chart
    if (isTableTimeSeries(tableData.data.headers, tableData.data.rows)) {
      const timeSeries = convertTableToTimeSeries(tableData.data.headers, tableData.data.rows);
      if (process.env.NODE_ENV === 'development') {
        console.log('[DataExtractor] Converted table to time-series chart');
      }
      return timeSeries;
    }

    // Return as table (fallback for non-visualizable data)
    if (process.env.NODE_ENV === 'development') {
      console.log('[DataExtractor] Keeping as plain table');
    }
    return tableData;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[DataExtractor] No structured data found');
  }
  return null;
}

/**
 * Check if content has visualizable plain text data
 */
export function hasStructuredData(content: string): boolean {
  return extractStructuredData(content) !== null;
}
