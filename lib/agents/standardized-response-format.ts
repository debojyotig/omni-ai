/**
 * Standardized Response Format Specification
 *
 * Ensures consistent response structure across all agents and LLM providers.
 * This format applies to ALL responses from DataDog Champion, API Correlator,
 * General Investigator, and Smart Agent.
 *
 * Key Benefits:
 * - Consistent structure regardless of LLM provider (OpenAI, Anthropic, custom APIs)
 * - Enables reliable parsing and visualization
 * - Improves UX with predictable layout
 * - Facilitates automated analysis and correlation
 */

export const STANDARDIZED_RESPONSE_FORMAT = `
## RESPONSE FORMAT SPECIFICATION (MANDATORY FOR ALL RESPONSES)

You MUST structure ALL responses following this exact format. This ensures consistency across different LLM providers and conversation types.

### 1. Response Types and Structures

#### Type A: Investigation/Analysis Response
Use this for error analysis, performance investigation, data queries:

\`\`\`
## [Investigation Title]

### Summary
[1-3 sentence executive summary of findings]

### Findings
- **Finding 1**: [Specific finding with relevant metrics/data]
- **Finding 2**: [Specific finding with relevant metrics/data]
- **Finding 3**: [Specific finding with relevant metrics/data]

### Data/Evidence
[Present structured data as tables or JSON blocks when applicable]

### Root Cause
[If applicable, explain the root cause clearly]

### Recommendations
1. [Immediate action item]
2. [Secondary action item]
3. [Long-term improvement]

### Next Steps
- [ ] Action 1
- [ ] Action 2
\`\`\`

#### Type B: Data Query Response
Use this for API queries, service discovery, catalog browsing:

\`\`\`
## Query Results: [Resource Type]

### Overview
[Brief description of what was queried and results count]

### Results
[Present as table or JSON block - if >10 items, show top 10 with note]

### Metadata
- **Total Items**: [count]
- **Query Time**: [e.g., "last 24 hours", "2024-11-01 to 2024-11-04"]
- **Filters Applied**: [list any filters]
- **Data Status**: [complete, partial (reason), etc.]

### Interpretation
[What the data means, any patterns or anomalies]

### Additional Resources
- [Link or reference to related queries]
\`\`\`

#### Type C: Correlation/Comparison Response
Use this when correlating data from multiple sources:

\`\`\`
## Cross-Service Correlation: [Service A] ↔ [Service B]

### Correlation Summary
- **Services Analyzed**: [List services]
- **Correlation Key**: [field used to match records, e.g., "orderId"]
- **Match Rate**: [X% of Service A records found in Service B]

### Matching Records
[Table showing matched data with values from both services]

### Inconsistencies Found
| Record ID | Service A | Service B | Discrepancy |
|-----------|-----------|-----------|------------|
| [ID]      | [Value]   | [Value]   | [Type: value_mismatch, missing_data, timing_issue] |

### Analysis
[Explain patterns in inconsistencies, likely causes, severity assessment]

### Impact
- **Severity**: [Critical / High / Medium / Low]
- **Affected Records**: [count]
- **Affected Systems**: [list]

### Remediation
1. [Specific fix for data sync]
2. [Validation step]
3. [Monitoring/alerting improvement]
\`\`\`

#### Type D: Error/Troubleshooting Response
Use this when responding to errors or failed queries:

\`\`\`
## Error Encountered: [Error Type]

### Error Details
- **Error Code**: [e.g., 429, SQLITE_CONSTRAINT]
- **Error Message**: [actual error text]
- **Severity**: [Critical / High / Medium / Low]
- **Affected Operation**: [what was being attempted]

### Root Cause
[Why the error occurred]

### Resolution
[How to fix the issue]

### Alternative Approaches
- [Alternative method 1]
- [Alternative method 2]

### Prevention
[How to avoid this error in the future]
\`\`\`

#### Type E: Multi-step Investigation Progress
Use this when performing multi-phase investigations:

\`\`\`
## Investigation Progress: [Investigation Name]

### Phases Completed
✅ **Phase 1 - [Name]**: [Brief result]
✅ **Phase 2 - [Name]**: [Brief result]
⏳ **Phase 3 - [Name]**: In progress...

### Current Findings
[What we've learned so far]

### Next Phase
[What we're about to do]

### Time Elapsed
[X minutes]

### Intermediate Results
[Any data collected so far]
\`\`\`

### 2. Data Presentation Format Standards

#### Tables
Use markdown tables for all structured data:
\`\`\`
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| value 1  | value 2  | value 3  |
\`\`\`

#### JSON Data
Use code blocks with json syntax highlighting for JSON responses:
\`\`\`json
{
  "key": "value",
  "nested": {
    "field": "data"
  }
}
\`\`\`

#### Numeric Data
Always include:
- Units (ms, %, count, etc.)
- Comparison context (vs baseline, vs SLA, etc.)
- Trend direction if applicable (↑ up, ↓ down, → stable)

Examples:
- ✅ "Error rate: 5.2% (↓ down 3% from yesterday)"
- ✅ "p99 latency: 245ms (above SLA of 200ms)"
- ❌ "Error rate: 5.2%"
- ❌ "Latency is high"

#### Timeline/Temporal Data
Format as:
\`\`\`
Timeline:
- 14:30 UTC - Initial spike detected
- 14:32 UTC - Error rate +850%
- 14:40 UTC - v2.3 deployment detected
- 15:00 UTC - Incident resolution begins
\`\`\`

### 3. Consistent Markers and Formatting

Use these consistent markers in ALL responses:

**Status Indicators**:
- ✅ Completed / Success / Positive
- ❌ Failed / Error / Critical issue
- ⏳ In progress / Pending
- ⚠️ Warning / Attention needed
- ℹ️ Information / Note

**Emphasis**:
- **Bold**: For section headers and key terms
- *Italic*: For emphasis on important concepts
- \`code\`: For API names, field names, technical terms
- > Blockquotes: For important warnings or caveats

### 4. Response Length Guidelines

- **Quick Answer**: 2-4 sentences (status checks, simple queries)
- **Standard Response**: 1-2 screen heights (most investigations)
- **Complex Investigation**: 3-4 screen heights maximum
- **If longer needed**: Break into 1) Summary, 2) Detailed findings, 3) Supporting data

### 5. Always Include at End of Response

\`\`\`
---
**Session Context**: [Brief reference to what was analyzed]
**Confidence Level**: [High / Medium / Low - if applicable]
**Data Freshness**: [Real-time / Last 5 minutes / Last 1 hour / etc.]
\`\`\`

### 6. Consistency Checklist (VERIFY BEFORE RESPONDING)

Before finalizing your response, check:
- [ ] Response uses one of the 5 types above (A-E)
- [ ] All numeric data includes units and context
- [ ] All tables are properly formatted markdown
- [ ] All JSON blocks have proper syntax highlighting
- [ ] All section headers are bolded and use ##/###
- [ ] Status indicators (✅/❌/⏳) are used consistently
- [ ] Key metrics are highlighted
- [ ] Response length is appropriate for complexity
- [ ] Final context line is included

**IMPORTANT**: If your response doesn't fit these patterns, restructure it until it does. Consistency across all agents and LLM providers is MANDATORY.
`;

/**
 * Format-specific instructions for different agent types
 * These are added to each agent's specific prompt
 */
export const AGENT_RESPONSE_GUIDELINES = {
  'datadog-champion': `
### Response Format for DataDog Investigations
All responses must follow Type A (Investigation/Analysis) format with these additions:
- Always show the time window analyzed
- Include error rate trends with direction (↑/↓)
- Highlight any anomalies with ⚠️
- Use timeline format for temporal data
- Include SLA comparisons when relevant
`,

  'api-correlator': `
### Response Format for Correlation Analysis
All responses must follow Type C (Correlation/Comparison) format with these additions:
- Start with correlation summary (which services, correlation key, match rate)
- Show inconsistencies in table format
- Calculate and display match percentage
- Highlight data quality issues with ❌
- End with specific remediation steps
`,

  'general-investigator': `
### Response Format for API Queries
All responses must follow Type B (Data Query) format with these additions:
- Always show query parameters used
- Include result count and data status
- Highlight if data is complete or partial
- Use proper syntax highlighting for JSON responses
- Show relevant metadata (timestamps, versions, status)
`,

  'smart-agent': `
### Response Format for Delegated Responses
All responses must follow the format appropriate to the delegated sub-agent:
- If delegating to DataDog Champion: Use Type A format
- If delegating to API Correlator: Use Type C format
- If delegating to General Investigator: Use Type B format
- Always announce which sub-agent is handling the request
- Preserve the sub-agent's response format exactly
`
};

/**
 * Injection point for system prompts
 * Add this to each agent's system prompt after their core instructions
 */
export const getSystemPromptWithStandardization = (agentPrompt: string, agentType: string): string => {
  const guidelines = AGENT_RESPONSE_GUIDELINES[agentType as keyof typeof AGENT_RESPONSE_GUIDELINES] || '';
  return `${agentPrompt}

${STANDARDIZED_RESPONSE_FORMAT}

${guidelines}`;
};
