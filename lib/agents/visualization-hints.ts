/**
 * Visualization Hints for Agent Responses
 *
 * Instructions for agents to include visualization metadata when returning data-rich responses.
 * This allows the frontend to intelligently render appropriate charts without pattern detection.
 */

/**
 * Visualization hint instruction to append to agent prompts
 */
export const VISUALIZATION_HINT_INSTRUCTIONS = `
## Visualization Hints

When your response contains structured data that would benefit from visualization (e.g., lists of metrics, comparisons, trends, rankings), include visualization metadata in a special XML block at the end of your response.

### Format
Include this block ONLY if the data is visualization-worthy:
\`\`\`xml
<visualization>
{
  "dataType": "comparison" | "timeseries" | "distribution" | "ranking" | "table",
  "visualizationType": "bar" | "area" | "pie" | "table" | "auto",
  "title": "Descriptive title for the chart",
  "description": "Brief explanation of what the visualization shows",
  "dataMapping": {
    "xAxis": "fieldName or 'index' for numeric index",
    "yAxis": ["fieldName1", "fieldName2"],
    "category": "fieldName for grouping (optional)",
    "value": "fieldName for pie/distribution (optional)"
  },
  "structuredData": [
    { "key1": "value1", "key2": "value2", ... },
    { "key1": "value1", "key2": "value2", ... }
  ]
}
</visualization>
\`\`\`

### When to Include Visualization Hints

**Always include when you return:**
- Lists of ranked items (top 5 errors, slowest endpoints, etc.)
- Comparative metrics across services/regions/timeframes
- Time series data (trends, changes over time)
- Distribution data (percentages, breakdowns)
- Tabular data with >3 rows

**Never include for:**
- Narrative responses without structured data
- Single data points or summaries
- Technical explanations or troubleshooting steps
- Free-form text responses

### Data Type Guidelines

- **comparison**: Multiple items with metrics to compare (e.g., error rates by service, popularity scores by movie)
- **timeseries**: Data changing over time (e.g., error rate trends, latency over 24 hours)
- **distribution**: Parts of a whole (e.g., error breakdown by type, percentage by region)
- **ranking**: Ordered list with scores (e.g., slowest endpoints, top results)
- **table**: Complex multi-column data that doesn't fit other types

### Visualization Type Guidelines

- **bar**: For comparing values across categories (comparison data)
- **area**: For showing trends and changes over time (timeseries data)
- **pie**: For showing parts of a whole (distribution data, <5 items)
- **table**: For complex data or when visual representation isn't appropriate
- **auto**: Let the frontend decide based on data characteristics

### Examples

**Example 1: Error Comparison**
\`\`\`json
{
  "dataType": "comparison",
  "visualizationType": "bar",
  "title": "Error Rate by Service",
  "dataMapping": {
    "xAxis": "service",
    "yAxis": ["errorCount", "errorRate"]
  },
  "structuredData": [
    { "service": "auth-service", "errorCount": 245, "errorRate": 2.3 },
    { "service": "payment-service", "errorCount": 89, "errorRate": 0.8 },
    { "service": "notification-service", "errorCount": 156, "errorRate": 1.5 }
  ]
}
\`\`\`

**Example 2: Time Series Data**
\`\`\`json
{
  "dataType": "timeseries",
  "visualizationType": "area",
  "title": "Request Latency Trend",
  "dataMapping": {
    "xAxis": "timestamp",
    "yAxis": ["p50", "p95", "p99"]
  },
  "structuredData": [
    { "timestamp": "2025-01-01T00:00Z", "p50": 45, "p95": 120, "p99": 250 },
    { "timestamp": "2025-01-01T01:00Z", "p50": 48, "p95": 125, "p99": 280 }
  ]
}
\`\`\`

**Example 3: Ranking/Top Results**
\`\`\`json
{
  "dataType": "ranking",
  "visualizationType": "bar",
  "title": "Top 5 Popular Movies",
  "dataMapping": {
    "xAxis": "title",
    "yAxis": ["popularityScore"]
  },
  "structuredData": [
    { "title": "Movie A", "popularityScore": 345, "rating": 8.2 },
    { "title": "Movie B", "popularityScore": 298, "rating": 7.5 },
    { "title": "Movie C", "popularityScore": 276, "rating": 6.9 }
  ]
}
\`\`\`
`;

/**
 * Extracts visualization metadata from a response string
 * Looks for <visualization>JSON</visualization> blocks and returns parsed data
 */
export function extractVisualizationHint(
  response: string
): {
  dataType?: string;
  visualizationType?: string;
  title?: string;
  description?: string;
  dataMapping?: Record<string, any>;
  structuredData?: any[];
} | null {
  try {
    // Match <visualization>...{json}...</visualization> blocks
    const match = response.match(/<visualization>\s*(\{[\s\S]*?\})\s*<\/visualization>/);
    if (!match) {
      return null;
    }

    const jsonString = match[1];
    const parsed = JSON.parse(jsonString);

    // Validate required fields
    if (!parsed.dataType || !parsed.visualizationType || !parsed.structuredData) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('[VisualizationHints] Failed to extract visualization metadata:', error);
    return null;
  }
}

/**
 * Removes visualization hint blocks from response text
 * Returns the cleaned response without the <visualization> block
 */
export function removeVisualizationHint(response: string): string {
  return response.replace(/<visualization>\s*\{[\s\S]*?\}\s*<\/visualization>/g, '').trim();
}

/**
 * Check if a response contains visualization metadata
 */
export function hasVisualizationHint(response: string): boolean {
  return /<visualization>[\s\S]*?<\/visualization>/.test(response);
}
