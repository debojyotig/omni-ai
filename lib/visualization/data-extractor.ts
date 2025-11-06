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
 * Detects column boundaries in fixed-width tables
 * Looks for gaps of 2+ spaces to identify column positions
 */
function detectColumnBoundaries(lines: string[]): number[] {
  const boundaries: Set<number> = new Set();

  // Analyze all non-separator lines to find column breaks
  for (const line of lines) {
    if (isTableSeparator(line)) continue;

    let inSpace = false;
    for (let i = 0; i < line.length; i++) {
      const isSpace = /\s/.test(line[i]);

      if (isSpace && !inSpace) {
        inSpace = true;
        // Mark potential boundary start
        if (i > 0 && i < line.length - 1) {
          boundaries.add(i);
        }
      } else if (!isSpace && inSpace) {
        inSpace = false;
        // Mark potential boundary end
        if (i > 0) {
          boundaries.add(i);
        }
      }
    }
  }

  return Array.from(boundaries).sort((a, b) => a - b);
}

/**
 * Extracts columns from a line using detected column boundaries
 */
function extractCellsByBoundaries(line: string, boundaries: number[]): string[] {
  if (boundaries.length === 0) {
    return [line.trim()];
  }

  const cells: string[] = [];
  let lastBoundary = 0;

  for (const boundary of boundaries) {
    if (boundary > lastBoundary + 1) {
      const cell = line.substring(lastBoundary, boundary).trim();
      if (cell.length > 0) {
        cells.push(cell);
      }
    }
    lastBoundary = boundary;
  }

  // Add final cell
  if (lastBoundary < line.length) {
    const cell = line.substring(lastBoundary).trim();
    if (cell.length > 0) {
      cells.push(cell);
    }
  }

  return cells;
}

/**
 * Extracts whitespace-aligned table from plain text
 * Uses fixed-width column detection and handles variable spacing
 * Example:
 * Date       Price   Change
 * Oct 28     100.5   +2%
 * Oct 29     102.1   +1.6%
 */
function extractPlainTextTable(content: string): DataPattern | null {
  const lines = content.split('\n');
  const nonEmptyLines = lines.filter((l) => l.trim().length > 0);

  if (nonEmptyLines.length < 3) return null;

  // First try: 2+ space delimiter (most common)
  const headerLine = nonEmptyLines[0];
  let headerParts = headerLine
    .split(/\s{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // If only 1 column, try fixed-width detection
  if (headerParts.length < 2) {
    const boundaries = detectColumnBoundaries(nonEmptyLines);
    if (boundaries.length > 1) {
      headerParts = extractCellsByBoundaries(headerLine, boundaries);
    }
  }

  // Need at least 2 columns
  if (headerParts.length < 2) return null;

  // Extract data rows
  const rows: string[][] = [];
  let useBoundaries = false;
  let boundaries: number[] = [];

  // Detect if we should use boundaries for data extraction
  if (headerParts.length === 1 || nonEmptyLines.length > 1) {
    boundaries = detectColumnBoundaries(nonEmptyLines);
    useBoundaries = boundaries.length > 1 && boundaries.length >= headerParts.length - 1;
  }

  for (let i = 1; i < nonEmptyLines.length; i++) {
    const line = nonEmptyLines[i];

    // Skip separator lines
    if (isTableSeparator(line)) continue;

    // Extract cells using appropriate method
    let cells: string[];
    if (useBoundaries && boundaries.length > 0) {
      cells = extractCellsByBoundaries(line, boundaries);
    } else {
      cells = line
        .split(/\s{2,}/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    // Validate row structure - allow some flexibility for ragged tables
    const expectedCells = headerParts.length;
    if (cells.length === 0 || cells.length > expectedCells + 2) {
      continue;
    }

    // Pad to match header count
    while (cells.length < expectedCells) {
      cells.push('');
    }
    while (cells.length > expectedCells) {
      cells.pop();
    }

    rows.push(cells);
  }

  // Need at least 1 data row to be a valid table
  if (rows.length < 1) return null;

  return {
    type: 'table',
    confidence: 0.5,  // Reduced from 0.85 - plain text table detection is very prone to false positives
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
 * Filters out false positives like dates ("February 6, 2018")
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

  // Try to extract month: value pairs, but only in time-series context (not dates)
  const dataPoints: Record<string, number> = {};
  const lines = content.split('\n');

  for (const line of lines) {
    // Skip lines that look like dates (contain "20XX" or day numbers > 28)
    if (/\b20\d{2}\b/.test(line) || /\b\d{1,2},\s+20\d{2}\b/.test(line)) {
      continue; // Skip date lines like "February 6, 2018"
    }

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
    confidence: 0.65,  // Restored to 0.65 - with improved date filtering above
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
 * Extracts comparison data from lines with name/category and numeric values
 * Handles formats like:
 * - "Movie Name  240.35"
 * - "Chainsaw Man: Reze Arc  240.35"
 * - "Category |---- 100 items"
 */
function extractComparisonFromLines(content: string): DataPattern | null {
  const lines = content.split('\n').filter((l) => l.trim().length > 0);

  // Look for lines with a name/label and a trailing number
  // Must have at least 2 columns of space separation
  const labels: string[] = [];
  const values: number[] = [];

  for (const line of lines) {
    // Skip lines that are headers or separators
    if (line.includes('---') || line.includes('===') || line.includes('|---')) {
      continue;
    }

    // Try to match: "Name/Label" + whitespace + number
    // This regex looks for text followed by 2+ spaces and then a number
    const match = line.match(/^(.{3,}?)\s{2,}([\d,.-]+)$/);
    if (match) {
      const label = match[1].trim();
      const value = parseFloat(match[2].replace(/,/g, ''));

      if (!isNaN(value) && label.length > 0) {
        labels.push(label);
        values.push(value);
      }
    }
  }

  // Need at least 2 data points
  if (labels.length < 2) return null;

  // Transform to arrays format that transformComparisonData expects
  const comparisonData = {
    category: labels,
    value: values,
  };

  return {
    type: 'comparison',
    confidence: 0.75,  // Restored from 0.8 (good balance between sensitivity and specificity)
    data: comparisonData,
    metadata: {
      title: 'Comparison Data',
      description: 'Extracted from formatted lines',
    },
  };
}

/**
 * Extracts key-value data from plain text
 * Example: "Error Rate: 5.2%, Success Rate: 94.8%"
 * Filters out false positives like dates ("First Flight: June 4, 2010")
 */
function extractKeyValueData(content: string): DataPattern | null {
  // Look for patterns like "Key: Value", "Key = Value", or "Key - Value" (common in formatted text)
  // Process line by line to avoid cross-line contamination
  const dataPoints: Record<string, number | string> = {};
  const lines = content.split('\n');
  const kvPattern = /([A-Za-z][A-Za-z0-9\s]*?)[:\=\-]\s*([\d,.-]+%?)/g;
  let count = 0;

  for (const line of lines) {
    let match;
    // Reset regex for each line
    kvPattern.lastIndex = 0;
    while ((match = kvPattern.exec(line)) !== null) {
      const key = match[1].trim();
      let value: any = match[2].trim();

      // Skip keys that are likely dates or metadata (First Flight, Last Updated, etc)
      const keyLower = key.toLowerCase();
      if (
        keyLower.includes('flight') ||
        keyLower.includes('date') ||
        keyLower.includes('time') ||
        keyLower.includes('launch') ||
        keyLower.includes('updated') ||
        keyLower.includes('first') ||
        keyLower.includes('last') ||
        key.length > 30 // Skip very long keys (likely descriptions)
      ) {
        continue;
      }

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
  }

  if (count < 2) return null;

  // If all values are numeric, this could be a comparison or distribution
  const allNumeric = Object.values(dataPoints).every((v) => typeof v === 'number');

  if (allNumeric) {
    return {
      type: count > 5 ? 'distribution' : 'comparison',
      confidence: 0.75,  // Restored to 0.75 - with improved validation above
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
 * More aggressive detection to convert tables to charts when possible
 */
export function isTableTimeSeries(headers: string[], rows: string[][]): boolean {
  if (rows.length < 2 || headers.length < 2) return false;

  // Look for date/time related headers
  const dateHeaderIdx = headers.findIndex(
    (h) =>
      h.toLowerCase().includes('date') ||
      h.toLowerCase().includes('time') ||
      h.toLowerCase().includes('month') ||
      h.toLowerCase().includes('day') ||
      h.toLowerCase().includes('period')
  );

  if (dateHeaderIdx === -1) return false;

  // Get non-date headers
  const numericHeaders = headers.filter(
    (_, idx) =>
      idx !== dateHeaderIdx &&
      !headers[idx].toLowerCase().includes('time')
  );

  if (numericHeaders.length === 0) return false;

  // Count how many columns are actually numeric
  let numericColumnCount = 0;

  for (const header of numericHeaders) {
    const colIdx = headers.indexOf(header);
    if (colIdx === -1) continue;

    let numericCount = 0;
    let totalCount = 0;

    for (const row of rows) {
      const cell = row[colIdx]?.trim() || '';
      if (!cell) continue;

      totalCount++;

      // Clean the cell: remove markdown, currency symbols, etc.
      const cleaned = cell
        .replace(/\*\*/g, '') // Remove markdown bold
        .replace(/[^\d.,%-]/g, '') // Keep only numbers, dots, commas, %, minus
        .trim();

      // Check if it's numeric (currency, percentage, or plain number)
      if (
        cleaned &&
        /[\d.,]/.test(cleaned) &&
        !cleaned.match(/^[a-zA-Z]+$/)
      ) {
        numericCount++;
      }
    }

    // If at least 70% of column is numeric, count it
    if (totalCount > 0 && numericCount >= totalCount * 0.7) {
      numericColumnCount++;
    }
  }

  // Need at least 1 numeric column for time-series
  return numericColumnCount >= Math.max(1, numericHeaders.length * 0.5);
}

/**
 * Converts a table to time-series format if it looks like time-series
 * Intelligently selects primary numeric column for visualization
 */
export function convertTableToTimeSeries(headers: string[], rows: string[][]): DataPattern {
  const dateHeaderIdx = headers.findIndex(
    (h) =>
      h.toLowerCase().includes('date') ||
      h.toLowerCase().includes('time') ||
      h.toLowerCase().includes('month') ||
      h.toLowerCase().includes('day') ||
      h.toLowerCase().includes('period')
  );

  const dateHeader = dateHeaderIdx !== -1 ? headers[dateHeaderIdx] : 'Date';

  // Clean date values (remove markdown bold syntax)
  const cleanedDates = rows.map((row) =>
    (row[dateHeaderIdx] || '')
      .replace(/\*\*/g, '') // Remove markdown bold
      .trim()
  );

  // Build time-series data structure
  const timeSeriesData: Record<string, any> = {
    [dateHeader]: cleanedDates,
  };

  // Identify and add numeric columns
  const numericColumns: { idx: number; header: string; values: number[] }[] = [];

  for (let i = 0; i < headers.length; i++) {
    if (i === dateHeaderIdx) continue;

    const values: number[] = [];
    let numericCount = 0;

    for (const row of rows) {
      const val = row[i]?.trim() || '';

      if (!val) {
        values.push(NaN);
        continue;
      }

      // Clean: remove markdown, currency, percentages, commas
      const cleaned = val
        .replace(/\*\*/g, '') // Markdown bold
        .replace(/[$]/g, '') // Currency
        .replace(/%/g, '') // Percent sign
        .replace(/,/g, '') // Thousand separators
        .trim();

      const numeric = parseFloat(cleaned);

      if (!isNaN(numeric)) {
        values.push(numeric);
        numericCount++;
      } else {
        values.push(NaN);
      }
    }

    // Include column if mostly numeric (>70%)
    if (numericCount >= values.length * 0.7) {
      numericColumns.push({
        idx: i,
        header: headers[i],
        values,
      });
    }
  }

  // Add numeric columns to time-series, replacing NaN with null for Recharts compatibility
  for (const col of numericColumns) {
    timeSeriesData[col.header] = col.values.map(v => isNaN(v) ? null : v);
  }

  // If no numeric columns found, return table pattern instead
  if (numericColumns.length === 0) {
    return {
      type: 'table',
      confidence: 0.7,
      data: { headers, rows },
      metadata: {
        title: 'Data Table',
      },
    };
  }

  // Determine appropriate y-axis label from numeric column
  const primaryColumn = numericColumns[0];
  let yAxisLabel = primaryColumn.header;

  if (primaryColumn.header.toLowerCase().includes('price')) {
    yAxisLabel = 'Price';
  } else if (primaryColumn.header.toLowerCase().includes('value')) {
    yAxisLabel = 'Value';
  } else if (primaryColumn.header.toLowerCase().includes('count')) {
    yAxisLabel = 'Count';
  }

  return {
    type: 'timeseries',
    confidence: 0.9,
    data: timeSeriesData,
    metadata: {
      title: 'Time Series Data',
      xAxisLabel: dateHeader,
      yAxisLabel,
      description: `${numericColumns.length} metric${numericColumns.length > 1 ? 's' : ''} over time`,
    },
  };
}

/**
 * Main extraction function - prioritizes Recharts visualizations
 * Tries multiple strategies in order of preference:
 * 1. Comparison lines (name/label + value format - highest confidence)
 * 2. Key-value pairs (for comparison/distribution charts)
 * 3. Time-series extraction from text
 * 4. Plain text tables (converted to time-series if applicable)
 */
export function extractStructuredData(content: string): DataPattern | null {
  // Strategy 1: Try comparison extraction from formatted lines (highest specificity)
  const comparisonData = extractComparisonFromLines(content);
  if (comparisonData) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DataExtractor] Extracted comparison data from lines');
    }
    return comparisonData;
  }

  // Strategy 2: Try key-value extraction (often reveals comparison data)
  const kvData = extractKeyValueData(content);
  if (kvData) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DataExtractor] Extracted key-value data:', kvData.type);
    }
    return kvData;
  }

  // Strategy 3: Try time-series extraction
  const timeSeriesData = extractTimeSeriesFromText(content);
  if (timeSeriesData) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DataExtractor] Extracted time-series from text');
    }
    return timeSeriesData;
  }

  // Strategy 4: Try plain text table (and convert to chart if possible)
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
