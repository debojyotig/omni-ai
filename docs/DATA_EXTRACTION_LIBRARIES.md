# Data Extraction Libraries & Best Practices

## Current Implementation

Our system uses **pattern-based extraction** (regex + heuristics) which provides:
- ✅ Fast performance (no LLM calls required)
- ✅ No API overhead
- ✅ Deterministic results
- ✅ Low memory footprint
- ✅ Works offline

**Current extraction pipeline** (`lib/visualization/data-extractor.ts`):

1. **Comparison Lines** - "Movie Name  240.35" format
2. **Key-Value Pairs** - "Error Rate: 5.2%, Success Rate: 94.8%"
3. **Time-Series** - "Jan: 100, Feb: 200, Mar: 150"
4. **Plain Text Tables** - Fixed-width columns with detection
5. **Markdown Tables** - Standard markdown pipe tables

---

## Popular Industry Libraries

### Lightweight/Built-in (No Dependencies)

**`RegExp` (Built-in JavaScript)**
- ✅ What we use for comparison lines
- ✅ Fast, no dependencies
- ❌ Limited to simple patterns
- **Use for:** Simple data formats, quick parsing

---

### CSV/Tabular Data

**`papaparse` (50k+ GitHub stars)**
```bash
npm install papaparse
```

**Pros:**
- Industry standard for CSV parsing
- Handles edge cases (quotes, escaping, line breaks)
- Streaming support
- Works in browser and Node.js

**Cons:**
- Adds 4KB to bundle
- Overkill for simple formats

**When to use:**
- When users provide CSV data
- Complex CSV with special characters
- Large CSV files needing streaming

**Example:**
```typescript
import Papa from 'papaparse';

const csv = `Name,Value\nMovie A,240\nMovie B,195`;
const result = Papa.parse(csv, { header: true });
// { data: [{Name: "Movie A", Value: "240"}, ...] }
```

---

**`csv-parser` (Alternative)**
```bash
npm install csv-parser
```
- Lighter than papaparse
- Stream-focused
- Good for file-based CSV

---

### Markdown Parsing

**`remark` + `remark-gfm` (Already installed)**
- ✅ We already use `remark-gfm` in chat-message.tsx
- ✅ Parses markdown tables natively
- ✅ AST-based (more reliable than regex)

**Benefits over regex:**
- Handles edge cases (escaped pipes, nested content)
- Returns structured AST for reliable parsing
- Plugin ecosystem

**Example:**
```typescript
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm);

const ast = processor.parse(markdownContent);
// Extract tables from AST reliably
```

---

### JSON/Structured Data

**`json5` (Lenient JSON parsing)**
```bash
npm install json5
```

**Pros:**
- Parses JSON-like formats (unquoted keys, trailing commas)
- More forgiving than JSON.parse()
- Useful for user-provided data

**Cons:**
- Security risks if parsing untrusted input
- Slower than native JSON

**When to use:**
- Parsing LLM-generated JSON (sometimes has syntax errors)
- User-pasted JSON with common mistakes

**Example:**
```typescript
import JSON5 from 'json5';

const data = JSON5.parse(`{
  name: 'Movie A',  // unquoted key, no errors!
  value: 240,
}`);
```

---

### HTML/XML

**`cheerio` (jQuery-like for Node.js)**
```bash
npm install cheerio
```

**When to use:**
- Parsing HTML responses from APIs
- Web scraping (with permission)
- Structured data in HTML tables

**Example:**
```typescript
import { load } from 'cheerio';

const $ = load(htmlContent);
const table = $('table').first();
const rows = [];
$('tr', table).each((_, row) => {
  const cells = [];
  $('td', row).each((_, cell) => {
    cells.push($(cell).text());
  });
  rows.push(cells);
});
```

---

## LLM-Based Extraction (Advanced)

### When Pattern-Based Isn't Enough

Sometimes data formats are too irregular for regex. In these cases, use LLM-based extraction:

**Option 1: Use Anthropic's JSON Mode** (Recommended for our stack)
```typescript
const message = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: `Extract structured data from this text and return as JSON:

${userText}

Return ONLY valid JSON with keys: labels (array), values (array).`
  }]
});

const json = JSON.parse(message.content[0].text);
```

**Pros:**
- Handles any format intelligently
- Extracts semantic meaning
- Robust to variation

**Cons:**
- API calls (cost, latency)
- Requires LLM model access
- Overkill for most cases

---

**Option 2: Use `Instructor` (Python, TypeScript in progress)**
```typescript
// Future when TypeScript version matures
import Instructor from '@anthropic-ai/instructor';

const client = new Instructor({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const extracted = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{ role: 'user', content: userText }],
  response_model: { type: 'ComparisonData', schema: {...} }
});
// Returns strongly-typed response
```

---

**Option 3: Use Zod for Schema Validation** (Already installed)
```typescript
import { z } from 'zod';

const ComparisonDataSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
});

// After LLM extraction:
const parsed = JSON.parse(llmOutput);
const validated = ComparisonDataSchema.parse(parsed);
```

---

## Recommendation for omni-ai

### Current Approach (Optimal)
**Keep the pattern-based extraction we built** because:

1. **Performance**: No API calls required
2. **Cost**: Zero extraction overhead
3. **Reliability**: Deterministic results
4. **Works everywhere**: Browser + server

### When to Enhance

Add LLM-based fallback **only when**:
- Pattern detection confidence < 0.5
- User has complex, irregular data format
- User explicitly asks for help parsing

### Proposed Hybrid Approach

```typescript
export function extractStructuredData(content: string): DataPattern | null {
  // Strategy 1: Try all pattern-based extraction (fast path)
  let pattern = extractComparisonFromLines(content);
  if (pattern && pattern.confidence >= 0.75) {
    return pattern; // Fast path - no LLM call
  }

  pattern = extractKeyValueData(content);
  if (pattern && pattern.confidence >= 0.75) {
    return pattern;
  }

  // Strategy 2: If confidence is low, consider LLM fallback
  if (pattern && pattern.confidence >= 0.5 && pattern.confidence < 0.75) {
    console.log('Medium confidence pattern, could enhance with LLM');
    // Optional: Call LLM for higher confidence
    // const llmPattern = await enhanceWithLLM(content, pattern);
    return pattern; // Return pattern for now
  }

  // Strategy 3: No patterns found, return null
  return null;
}
```

---

## Recommended Library Additions

For future enhancement, install these for specific use cases:

```bash
# CSV support (if users provide CSV files)
npm install papaparse

# JSON5 for lenient parsing (LLM-generated JSON)
npm install json5

# HTML/Web scraping (optional, requires careful permission handling)
npm install cheerio
```

---

## Implementation Examples

### Example 1: Adding CSV Support

```typescript
import Papa from 'papaparse';

function extractCSVTable(content: string): DataPattern | null {
  try {
    const result = Papa.parse(content, {
      header: true,
      skipEmptyLines: true
    });

    if (result.data.length < 2) return null;

    // Convert to standard table format
    const headers = Object.keys(result.data[0]);
    const rows = result.data.map(row =>
      headers.map(h => String(row[h] || ''))
    );

    return {
      type: 'table',
      confidence: 0.9,
      data: { headers, rows },
      metadata: { title: 'CSV Table' }
    };
  } catch (error) {
    return null;
  }
}
```

### Example 2: Adding JSON5 Support

```typescript
import JSON5 from 'json5';

function extractJSON5Data(content: string): DataPattern | null {
  // Find JSON5-like blocks
  const jsonMatch = content.match(/[\{\[][\s\S]*[\}\]]/);
  if (!jsonMatch) return null;

  try {
    const data = JSON5.parse(jsonMatch[0]);

    // Detect type and create pattern
    if (Array.isArray(data)) {
      return detectArrayPattern(data);
    } else if (typeof data === 'object') {
      return detectObjectPattern(data);
    }
  } catch (error) {
    return null;
  }

  return null;
}
```

### Example 3: Using Remark for Markdown Tables

```typescript
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

function extractMarkdownTablesWithRemark(content: string): DataPattern[] {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm);

  const ast = processor.parse(content);
  const patterns: DataPattern[] = [];

  // Walk AST to find tables
  function walk(node: any) {
    if (node.type === 'table') {
      const headers = node.children[0].children.map((cell: any) =>
        cell.children[0].value
      );

      const rows = node.children.slice(1).map((row: any) =>
        row.children.map((cell: any) => cell.children[0].value)
      );

      patterns.push({
        type: 'table',
        confidence: 0.95,
        data: { headers, rows },
        metadata: { title: 'Markdown Table' }
      });
    }

    if (node.children) {
      node.children.forEach(walk);
    }
  }

  walk(ast);
  return patterns;
}
```

---

## Summary

| Approach | Performance | Cost | Reliability | Use Case |
|----------|-------------|------|------------|----------|
| **Pattern-based (Current)** | ⚡⚡⚡ | $0 | 90% | Most data formats |
| **CSV Library** | ⚡⚡ | $0 | 99% | CSV files |
| **Markdown AST** | ⚡⚡ | $0 | 95% | Markdown tables |
| **LLM-based** | ⚡ | $$ | 98% | Complex/irregular |
| **Hybrid** | ⚡⚡ | $0-$ | 95%+ | Recommended |

---

## References

- [papaparse GitHub](https://github.com/mholt/papaparse) - CSV parser
- [csv-parser npm](https://www.npmjs.com/package/csv-parser) - Streaming CSV
- [json5 GitHub](https://github.com/json5/json5) - Lenient JSON
- [cheerio GitHub](https://github.com/cheeriojs/cheerio) - jQuery for Node
- [unified/remark GitHub](https://github.com/unifiedjs/unified) - Markdown AST
- [Anthropic Messages API](https://docs.anthropic.com/claude/reference/getting-started-with-the-api) - JSON mode extraction
