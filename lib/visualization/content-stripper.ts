/**
 * Content Stripper
 *
 * Removes already-visualized content (tables, charts) from response text
 * to prevent duplicate rendering in both visualization and markdown
 */

/**
 * Remove markdown tables from content
 * Removes lines that look like markdown tables (pipes, dashes, colons)
 */
export function removeMarkdownTables(content: string): string {
  // Regex to match markdown tables:
  // - Table header row: | content | content |
  // - Separator row: | --- | --- |
  // - Data rows: | content | content |

  const lines = content.split('\n');
  const result: string[] = [];
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if this is a table separator line (contains pipes and dashes)
    if (trimmed.match(/^\|[\s\-\|:]+\|$/)) {
      inTable = true;
      continue; // Skip separator lines
    }

    // Check if this is a table header or data row (starts and ends with pipes)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      continue; // Skip table rows
    }

    // If we were in a table and this line doesn't look like a table row, end table mode
    if (inTable && !trimmed.startsWith('|')) {
      inTable = false;
    }

    // Add non-table lines
    if (!inTable || !trimmed.startsWith('|')) {
      result.push(line);
    }
  }

  // Remove excessive blank lines (more than 2 consecutive)
  const cleaned = result.join('\n').replace(/\n\n\n+/g, '\n\n');

  return cleaned.trim();
}

/**
 * Remove HTML tables from content
 */
export function removeHtmlTables(content: string): string {
  // Remove <table>...</table> blocks
  return content.replace(/<table[\s\S]*?<\/table>/gi, '');
}

/**
 * Remove markdown headers that appear to be data-related
 * (e.g., "Physical Characteristics Comparison" that precedes a plain-text table)
 */
export function removeDataHeaders(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

    // Skip headers that are followed by what looks like table-style data
    // (text columns separated by spaces, aligned format)
    if (
      /^[A-Z][\w\s]+$/.test(line) && // Header-like line
      nextLine.match(/^[A-Z][\w\s]*\s{2,}[A-Z]/) // Followed by space-separated aligned data
    ) {
      // Skip this header and following aligned-text block
      let j = i + 1;
      while (j < lines.length) {
        const dataLine = lines[j].trim();
        // Stop when we hit an empty line or markdown
        if (!dataLine || dataLine.startsWith('#') || dataLine.startsWith('-')) {
          break;
        }
        j++;
      }
      i = j - 1;
      continue;
    }

    result.push(line);
  }

  return result.join('\n').trim();
}

/**
 * Strip all visualized content from response text
 * Removes tables, data-presentation headers, and other formatted data
 */
export function stripVisualizedContent(content: string): string {
  let cleaned = content;

  // Remove markdown tables
  cleaned = removeMarkdownTables(cleaned);

  // Remove HTML tables
  cleaned = removeHtmlTables(cleaned);

  // Remove data-related headers followed by aligned text
  cleaned = removeDataHeaders(cleaned);

  // Clean up excess whitespace but preserve paragraph breaks
  cleaned = cleaned.replace(/\n\n\n+/g, '\n\n');

  return cleaned.trim();
}
