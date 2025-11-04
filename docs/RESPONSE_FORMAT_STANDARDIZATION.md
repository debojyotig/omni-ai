# Response Format Standardization

## Overview

Standardized response format specification ensures consistent response structure across all LLM providers (OpenAI, Anthropic, custom APIs) and agents (DataDog Champion, API Correlator, General Investigator, Smart Agent).

**Benefits:**
- ✅ No variation in response structure between conversations
- ✅ Improved UI predictability for visualization
- ✅ Reliable parsing for automated analysis
- ✅ Works with any LLM provider via system prompt injection
- ✅ Professional, consistent user experience

---

## 5 Standard Response Types

### Type A: Investigation/Analysis Response
**Use for:** Error analysis, performance investigation, root cause analysis, data queries with findings

```markdown
## [Investigation Title]

### Summary
[1-3 sentence executive summary]

### Findings
- **Finding 1**: [Specific finding with metrics]
- **Finding 2**: [Specific finding with metrics]

### Data/Evidence
[Structured data as tables or JSON]

### Root Cause
[Root cause explanation if applicable]

### Recommendations
1. [Immediate action]
2. [Secondary action]
3. [Long-term improvement]

### Next Steps
- [ ] Action 1
- [ ] Action 2
```

**Used by:** DataDog Champion Agent

---

### Type B: Data Query Response
**Use for:** API queries, service discovery, catalog browsing, list results

```markdown
## Query Results: [Resource Type]

### Overview
[What was queried and result count]

### Results
[Table or JSON block - show top 10 if >10 items]

### Metadata
- **Total Items**: [count]
- **Query Time**: [time range]
- **Filters Applied**: [list]
- **Data Status**: [complete/partial/etc]

### Interpretation
[What the data means and patterns]

### Additional Resources
- [Related queries or links]
```

**Used by:** General Investigator Agent

---

### Type C: Correlation/Comparison Response
**Use for:** Cross-service data correlation, consistency checks, multi-source analysis

```markdown
## Cross-Service Correlation: [Service A] ↔ [Service B]

### Correlation Summary
- **Services Analyzed**: [List]
- **Correlation Key**: [field used to match records]
- **Match Rate**: [X% of records matched]

### Matching Records
[Table showing matched data from both services]

### Inconsistencies Found
| Record ID | Service A | Service B | Discrepancy |
|-----------|-----------|-----------|------------|
| [ID]      | [Value]   | [Value]   | [Type]     |

### Analysis
[Explain patterns and likely causes]

### Impact
- **Severity**: [Critical/High/Medium/Low]
- **Affected Records**: [count]
- **Affected Systems**: [list]

### Remediation
1. [Specific fix]
2. [Validation step]
3. [Monitoring improvement]
```

**Used by:** API Correlator Agent

---

### Type D: Error/Troubleshooting Response
**Use for:** API errors, failed queries, troubleshooting

```markdown
## Error Encountered: [Error Type]

### Error Details
- **Error Code**: [e.g., 429, SQLITE_CONSTRAINT]
- **Error Message**: [actual error text]
- **Severity**: [Critical/High/Medium/Low]
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
```

**Used by:** All agents (error fallback)

---

### Type E: Multi-Step Investigation Progress
**Use for:** Long-running investigations with multiple phases

```markdown
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
```

**Used by:** DataDog Champion (8-step investigations)

---

## Consistent Data Presentation

### Tables
Always use markdown tables for structured data:

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| value 1  | value 2  | value 3  |
```

### JSON Data
Use code blocks with syntax highlighting:

```json
{
  "key": "value",
  "nested": {
    "field": "data"
  }
}
```

### Numeric Data
**Always include:**
- Units (ms, %, count, bytes, etc.)
- Comparison context (vs baseline, SLA, etc.)
- Trend direction if applicable (↑ up, ↓ down, → stable)

**Good examples:**
- ✅ "Error rate: 5.2% (↓ down 3% from yesterday)"
- ✅ "p99 latency: 245ms (above SLA of 200ms)"
- ✅ "Memory usage: 1.2GB (↑ up 15% from start)"

**Bad examples:**
- ❌ "Error rate: 5.2%"
- ❌ "Latency is high"
- ❌ "1,234 requests processed"

### Timeline/Temporal Data
```markdown
Timeline:
- 14:30 UTC - Initial spike detected
- 14:32 UTC - Error rate +850%
- 14:40 UTC - v2.3 deployment detected
- 15:00 UTC - Incident resolution begins
```

---

## Consistent Markers and Formatting

### Status Indicators
Use these consistently in all responses:

```
✅ Completed / Success / Positive
❌ Failed / Error / Critical issue
⏳ In progress / Pending
⚠️ Warning / Attention needed
ℹ️ Information / Note
```

### Text Emphasis
```
**Bold**: For section headers and key terms
*Italic*: For emphasis on important concepts
`code`: For API names, field names, technical terms
> Blockquotes: For important warnings or caveats
```

---

## Response Length Guidelines

| Type | Length | Use Case |
|------|--------|----------|
| Quick Answer | 2-4 sentences | Status checks, simple queries |
| Standard Response | 1-2 screen heights | Most investigations |
| Complex Investigation | 3-4 screen heights maximum | 8-step root cause analysis |
| Longer responses | Split into 3 sections | 1) Summary, 2) Details, 3) Data |

---

## Mandatory Consistency Checklist

**Before finalizing ANY response, verify:**

- [ ] Response uses one of the 5 types (A-E)
- [ ] All numeric data includes units and context
- [ ] All tables are properly formatted markdown
- [ ] All JSON blocks have proper syntax highlighting
- [ ] All section headers are bolded (##/###)
- [ ] Status indicators (✅/❌/⏳) are used consistently
- [ ] Key metrics are highlighted
- [ ] Response length is appropriate for complexity
- [ ] Context line is included at end

---

## Always Include at End of Response

```markdown
---
**Session Context**: [Brief reference to what was analyzed]
**Confidence Level**: [High / Medium / Low - if applicable]
**Data Freshness**: [Real-time / Last 5 minutes / Last 1 hour / etc.]
```

---

## Implementation

### Files

- **Core Specification**: `lib/agents/standardized-response-format.ts`
  - 5 response types with templates
  - Data presentation guidelines
  - Consistent markers and formatting
  - Response length guidelines
  - Consistency checklist

- **Integration Points**:
  - `lib/agents/subagent-configs.ts` - All 3 sub-agents use standardization
  - `app/api/chat/route.ts` - Master Orchestrator uses standardization

### How It Works

1. **System Prompt Injection**: `getSystemPromptWithStandardization()` function adds format specification to each agent's prompt
2. **Agent-Specific Guidelines**: Each agent (DataDog, Correlator, General) gets additional formatting hints
3. **LLM-Agnostic**: Works with any LLM provider (OpenAI, Anthropic, custom APIs)
4. **Transparent**: User sees consistent structure regardless of provider or agent

### Example Usage in Code

```typescript
// In subagent-configs.ts
prompt: getSystemPromptWithStandardization(
  withHallucinationReduction(DATADOG_CHAMPION_INSTRUCTIONS),
  'datadog-champion'
),

// In chat/route.ts
const MASTER_ORCHESTRATOR_INSTRUCTIONS = getSystemPromptWithStandardization(
  withHallucinationReduction(baseInstructions),
  'smart-agent'
);
```

---

## Example Responses

### Example 1: Investigation Response (Type A)

```markdown
## DataDog Error Analysis: payment-service

### Summary
Identified 850% spike in error rate starting at 14:40 UTC, correlating with v2.3 deployment. Root cause: payment validation timeout after config change.

### Findings
- **Error Rate**: 5.2% (↑ spike from 0.6% baseline)
- **Error Type**: TimeoutError in payment_validator.ts:245
- **Affected Requests**: 1,247 errors in 20 minutes
- **Correlation**: 100% match with deployment timestamp

### Root Cause
Configuration change in v2.3 increased validation timeout from 100ms to 500ms, causing cascading timeouts on payment validation service which expects <100ms response.

### Recommendations
1. **Immediate**: Rollback v2.3 to v2.2 (5 minutes)
2. **Short-term**: Revert timeout config change, test in staging
3. **Long-term**: Add timeout SLA validation to deployment pipeline

### Next Steps
- [x] Root cause identified
- [ ] Rollback deployment
- [ ] Validate baseline restored
```

---

### Example 2: Data Query Response (Type B)

```markdown
## Query Results: TMDB Popular Movies

### Overview
Retrieved 20 most popular movies on TMDB for November 2024.

### Results
| Rank | Movie Title | Popularity | Release Date |
|------|-------------|-----------|--------------|
| 1    | Wicked | 1,240.35 | 2024-11-22 |
| 2    | Moana 2 | 895.20 | 2024-11-27 |
| 3    | Gladiator II | 745.80 | 2024-11-15 |
| 4    | Alien: Romulus | 695.40 | 2024-08-16 |
| 5    | Inside Out 2 | 645.10 | 2024-06-14 |

### Metadata
- **Total Items**: 20 retrieved
- **Query Time**: Last 7 days
- **Data Status**: Complete
- **Last Updated**: 2024-11-04 UTC

### Interpretation
Wicked leads by 38% over second place. Recent theatrical releases (Wicked, Moana 2, Gladiator II) dominate top 3, with popularity declining for older releases.

---
**Session Context**: TMDB movie popularity query
**Confidence Level**: High
**Data Freshness**: Real-time
```

---

## Testing the Format

To verify standardized responses:

1. ✅ All agent responses follow one of 5 types
2. ✅ No variation between different LLM providers
3. ✅ Consistent structure across conversation history
4. ✅ Proper markdown formatting renders correctly
5. ✅ Metrics include units and context
6. ✅ Status indicators used consistently

---

## Migration Guide

If adding new agents or prompts:

1. Import `getSystemPromptWithStandardization`:
```typescript
import { getSystemPromptWithStandardization } from '@/lib/agents/standardized-response-format';
```

2. Wrap your prompt:
```typescript
prompt: getSystemPromptWithStandardization(
  yourBasePrompt,
  'agent-type-name'  // 'datadog-champion', 'api-correlator', 'general-investigator', 'smart-agent'
)
```

3. Test responses to verify standardization is applied

---

## Related Documentation

- [Hallucination Reduction](./HALLUCINATION_REDUCTION.md) - Prevents LLM hallucinations
- [Sub-Agent Configuration](../lib/agents/subagent-configs.ts) - Agent specialization
- [Data Extraction & Visualization](./VISUALIZATION.md) - Charts and tables from responses
