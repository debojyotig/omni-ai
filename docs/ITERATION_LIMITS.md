# Iteration Limits & Graceful Results Handling

## Overview

omni-ai investigations have a built-in iteration limit (~10 turns) to prevent excessive API calls and token usage. When agents approach this limit, they intelligently **deliver what they have found so far** with **specific next-step suggestions** rather than failing silently.

## What Are Iterations?

An **iteration** is roughly one turn in the conversation where:
- Agent analyzes the user query
- Agent calls API tools to gather data
- Agent processes results and responds

**Default limit**: ~10 iterations per investigation

## How Agents Handle Iteration Limits

### Timeline: Turns 1-10

| Turns | Agent Behavior |
|-------|---|
| **1-5** | Focus on investigation. Gather data efficiently. Execute queries. |
| **6-7** | Start thinking about summary. Mindful of remaining iterations. Complete critical investigations. |
| **8+** | **STOP new investigations. Deliver findings with next steps.** |

### What Happens at Turn 8+

When an agent detects it's at iteration 8 or later, it immediately:

**1. Stops new investigations**
- No more API calls beyond current batch
- Wraps up current analysis

**2. Provides Clear Summary**
```
✅ Completed:
- [Finding 1] - [confidence level]
- [Finding 2] - [confidence level]

⏳ Incomplete:
- [What couldn't be investigated]

🔍 Uncertainties:
- [Data gaps or questions]
```

**3. Prioritizes by Impact**
- Most critical findings first
- Most important insights highlighted
- Actionable results presented clearly

**4. Suggests 3-5 Specific Next Steps**
```
You can now ask me to:

1. "Investigate [X] by correlating with [Y]"
2. "Validate this finding by checking [Z]"
3. "Compare error rates across [services]"
4. "Check deployment history for [service]"
5. "Analyze performance metrics for [timeframe]"
```

**5. Makes Handoff Crystal Clear**
```
"You can now ask me to [specific investigation]"
"Next, I recommend asking me to [action]"
"I'm ready to [follow-up when you ask]"
```

## User Experience Flow

### Normal Investigation
```
User: "Why are we seeing 500 errors?"
Agent: [Turns 1-7] Investigates...
Agent: [Turn 8+] "Here's what I found: [summary with next steps]"
User: "Can you investigate [next step]?"
Agent: [New 10-turn investigation] Continues...
```

### What User Sees

1. **During investigation** (Turns 1-7):
   - Activity Panel shows investigation phases (TodoWrite)
   - Chat shows only final response text (planning filtered)
   - Progress indicator shows work happening

2. **At iteration limit** (Turn 8+):
   - Agent provides comprehensive summary
   - Clear list of "what's next" options
   - User decides what to investigate further

3. **If stream ends**:
   - If max iterations hit: Warning notification
   - If normal completion: Clean completion message
   - Either way: User always has actionable results

## Key Features

✅ **No Silent Failures**
- User always knows why agent stopped
- Clear explanation: "reached iteration limit"

✅ **Always Actionable**
- Agent provides partial results, not nothing
- User gets "here's what I found" + "here's what to ask next"

✅ **User Directed**
- User decides what to investigate next
- Can ask agent to continue with specific focus
- No forced continuation

✅ **Transparent Progress**
- Activity Panel shows investigation phases
- Planning text filtered from chat (kept in Activity Panel)
- User sees both the "what" and the "why"

## Configuration

### Adjusting Iteration Limits

**Default**: 10 turns

To increase:
1. Open chat interface
2. Settings → Model Config
3. Adjust "Max Iterations" slider
4. Start new conversation with new limit

### Per-Conversation Limits

```typescript
// When sending message:
{
  message: "Find 500 errors",
  modelConfig: {
    maxIterations: 15  // Custom limit for this conversation
  }
}
```

## Examples

### Example 1: DataDog Investigation

**User**: "Why is the payment-service getting 500 errors?"

**Agent Turn 5**:
- Queries error logs
- Finds spike at 2:45 PM
- Identifies 1,247 errors

**Agent Turn 8+** (approaching limit):
```
📊 INVESTIGATION SUMMARY

✅ Completed:
- Error spike identified: 2:45 PM - 3:00 PM
- Affected service: payment-service
- Error count: 1,247 errors in 15 minutes
- Root pattern: Payment validation timeout
- Likely cause: New v2.3 deployment at 2:40 PM

⏳ Not Completed:
- Customer impact analysis
- Detailed stack traces
- Dependency chain analysis

🎯 Next Steps You Can Ask:

1. "How many customers were affected and what was the business impact?"
2. "Analyze the stack traces for the timeout errors"
3. "Check if other services had related issues during this window"
4. "Compare v2.3 deployment changes with error patterns"
5. "Review previous incidents involving payment validation"
```

### Example 2: Cross-Service Correlation

**User**: "Are the order service and inventory service in sync?"

**Agent Turn 8+**:
```
📊 CORRELATION SUMMARY

✅ Completed:
- Compared 500 recent orders with inventory
- Match rate: 98.2% (491 of 500 match)
- Found 9 discrepancies

⏳ Not Completed:
- Historical validation (older than 7 days)
- Root cause analysis for 9 mismatches
- Replication lag timing

Critical Issues Found:
- 5 orders missing from inventory (status: 'pending')
- 4 inventory items without corresponding orders

🎯 Next Steps:

1. "Investigate the 5 missing orders in more detail"
2. "Check replication lag between systems"
3. "Find root cause for the 4 orphaned inventory items"
4. "Validate order history for correlation patterns"
5. "Check if sync process is working correctly"
```

## Implementation Details

### Agent Instructions
- DataDog Champion: Explicit instructions about iteration limits
- API Correlator: Specific guidance for correlation summaries
- General Investigator: Guidance for flexible investigations
- Master Orchestrator: Awareness of iteration constraints

### Server-Side
- `app/api/chat/route.ts`: Counts iterations, detects max
- Sends clear notification when limit reached

### Client-Side
- `components/chat-interface.tsx`: Displays max iterations warning
- Warning shown as persistent hint so user sees it
- `lib/claude-sdk/stream-parser.ts`: Parses completion messages

## Testing Iteration Limits

### Test Case 1: Normal Completion
1. Ask simple query: "What APIs are available?"
2. Agent completes in ~2 turns
3. See clean completion message

### Test Case 2: Approaching Limit
1. Ask complex query requiring 8+ API calls
2. Watch agent work through iterations
3. See agent provide summary + next steps at turn 8+

### Test Case 3: Max Iterations Reached
1. Set `maxIterations: 5` in model config
2. Ask investigation requiring 8+ calls
3. See warning: "reached maximum iteration limit"

## Limitations & Future Improvements

### Current Limitations
- Iteration limit applies per conversation (not cumulative)
- Agent must remember to wrap up by turn 8 (self-managed)
- No automatic early stopping (agent-driven)

### Future Improvements
- [ ] Server-side hard stop at iteration 10
- [ ] Automatic summary generation if agent runs out
- [ ] Per-investigation iteration budgets
- [ ] Nested investigations with separate budgets
- [ ] User-friendly "increase limit" button

## FAQ

**Q: Why do agents have iteration limits?**
A: To prevent excessive API calls, token usage, and cost. Most investigations can be solved in 5-7 turns efficiently.

**Q: What if I need more than 10 turns?**
A: Start a new conversation and ask follow-up questions. Agent will provide specific next steps to continue efficiently.

**Q: Can I increase the limit?**
A: Yes! In Settings → Model Config, adjust "Max Iterations" before starting a new conversation.

**Q: What if the agent stops mid-investigation?**
A: Agent will provide a summary of findings + specific next steps. No data is lost - you can continue the investigation.

**Q: Does increasing iterations improve quality?**
A: Not always. Most investigations complete in 5-7 efficient turns. Extra iterations help with complex correlations only.

**Q: Can multiple agents share the iteration limit?**
A: Yes. Each conversation has one 10-turn budget. If you delegate to a sub-agent, the budget is shared.

---

**Status**: ✅ Fully implemented and tested

**Benefits**:
- No more silent failures at iteration limits
- Always get partial results + actionable next steps
- Users understand what happened and what to do next
- Efficient use of tokens and API calls
