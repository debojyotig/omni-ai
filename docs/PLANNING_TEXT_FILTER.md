# Planning Text Filter

## Overview

The Planning Text Filter automatically removes intermediate agent reasoning and planning text from chat display, keeping conversations clean while preserving investigation progress visibility in the Activity Panel.

## Problem Solved

When agents work on investigations, they often emit intermediate planning text like:
- "I'll check the SpaceX GraphQL schema first..."
- "Let me try a more focused approach..."
- "Now let me query for detailed information..."

This text clutters the chat and makes the final response harder to read. The Planning Text Filter removes this intermediate reasoning from chat display while keeping it available in the Activity Panel via TodoWrite.

## How It Works

### 1. Detection

The parser uses regex patterns to detect planning text at the start of chunks:

```typescript
private isPlanningText(text: string): boolean {
  const planningPatterns = [
    /^I'll\s+(check|get|try|look|fetch|query|retrieve|search|explore)/i,
    /^Let me\s+(check|try|look|get|fetch|query|search)/i,
    /^Now\s+(let me|I'll)/i,
    /^First,\s+(let me|I'll|I need)/i,
    /^To\s+(answer|help|investigate|find)/i,
    /^Let me\s+also\s+(check|look|fetch)/i,
    /^\s*Now that I\s+(understand|have)/i,
  ];

  return planningPatterns.some(pattern => pattern.test(text.trim()));
}
```

### 2. Filtering

When planning text is detected, it's:
- Removed from `displayedText` (what shows in chat)
- Kept in `accumulatedText` (internal reference)
- Logged for debugging

```
[PARSER] Filtering planning text: "I'll check the SpaceX GraphQL schema..."
```

### 3. Display

Only clean, final response text appears in the chat:
- Chat shows: `displayedText` (planning filtered)
- Activity Panel shows: TodoWrite phases (reasoning context)
- Streamed content updates: `displayedText` only

## Architecture

### StreamParser State

```typescript
export class StreamParser {
  private accumulatedText = '';     // Full text (including planning)
  private displayedText = '';       // Clean text (planning removed)
  private activeToolCalls = ...;
}
```

### ParsedTextChunk Interface

```typescript
export interface ParsedTextChunk {
  type: 'text';
  content: string;                  // Filtered content for this chunk
  accumulatedText: string;          // Full text (for reference)
  displayedText: string;            // Clean accumulated text (for display)
}
```

### Text Flow

```
Agent emits text chunk
  ↓
isPlanningText() check
  ↓
  ├─ Planning → displayText = '' (hidden)
  └─ Final response → displayText += content (shown)
  ↓
displayedText accumulated
  ↓
Chat displays displayedText
  ↓
Final message saved with clean text
```

## Detected Planning Patterns

The filter detects these patterns:

| Pattern | Examples |
|---------|----------|
| `I'll [action]` | "I'll check...", "I'll try...", "I'll query..." |
| `Let me [action]` | "Let me check...", "Let me fetch...", "Let me try..." |
| `Now [action]` | "Now let me...", "Now I'll..." |
| `First, [action]` | "First, let me...", "First, I'll..." |
| `To [action]` | "To answer...", "To investigate..." |
| `Let me also [action]` | "Let me also check..." |
| `Now that I [state]` | "Now that I understand...", "Now that I have..." |

## Example: Before vs After

### Before (with planning text)

```
Assistant: I'll get you more detailed information about the COTS 2 mission.
I'll check the SpaceX GraphQL schema first to find the correct way to query for
a specific launch. Let me try a more focused approach by looking specifically at
the launch query. Now let me check the structure of the Launch type to know which
fields are available. Let me also check the structure of the LaunchLinks and
LaunchRocket types to ensure I have the complete picture. Now that I understand
the GraphQL schema, let me query for detailed information about the COTS 2 mission.

**SpaceX COTS 2 Mission Details**

Basic Information
- Mission Name: COTS 2 (Commercial Orbital Transportation Services Demo 2)
- Launch Date: May 22, 2012 at 07:44 UTC
- Rocket: Falcon 9
- Mission Outcome: Successful
```

### After (planning text filtered)

```
Assistant: **SpaceX COTS 2 Mission Details**

Basic Information
- Mission Name: COTS 2 (Commercial Orbital Transportation Services Demo 2)
- Launch Date: May 22, 2012 at 07:44 UTC
- Rocket: Falcon 9
- Mission Outcome: Successful
```

The intermediate reasoning is now visible only in the Activity Panel via TodoWrite phases.

## Customization

### Adding New Planning Patterns

Edit `isPlanningText()` in `lib/claude-sdk/stream-parser.ts`:

```typescript
private isPlanningText(text: string): boolean {
  const planningPatterns = [
    // ... existing patterns ...
    /^Custom pattern here/i,  // Add new pattern
  ];
  return planningPatterns.some(pattern => pattern.test(text.trim()));
}
```

### Disabling the Filter

To show all text (including planning):
1. Change `setStreamingContent(parsedChunk.displayedText)` → `setStreamingContent(parsedChunk.accumulatedText)`
2. Change `parser.getDisplayedText()` → `parser.getAccumulatedText()`

### Making Filter More Aggressive

Add more patterns to catch additional planning text (e.g., specific domain language from your agents).

## Interaction with Other Features

### TodoWrite Integration

- Planning text is filtered from chat
- Investigation phases shown via TodoWrite in Activity Panel
- No conflict: different information flows to different places
- Combined: users see progress in Activity Panel + clean response in chat

### Manual Step Tracking

- Still works alongside planning filter
- Tool calls show in Activity Panel
- Planning text removed from chat
- No interference

### Extended Thinking

- Planning text from reasoning is filtered similarly
- Maintains clean chat display
- Reasoning context available in Activity Panel

## Performance

The planning text filter adds minimal overhead:
- Regex patterns are simple and cached
- Only checks first few sentences of each chunk
- No additional parsing or processing
- Single pass through text

## Debugging

### View Filtered Content

Check browser console for:
```
[PARSER] Filtering planning text: "I'll check..."
```

### Compare Versions

In browser DevTools console:
```javascript
// See what was filtered vs shown
// (Available if you log parser state)
```

### Disable Filter Temporarily

For testing, comment out the `isPlanningText()` check:
```typescript
// if (this.isPlanningText(newText)) {
//   displayText = '';
// }
```

## Limitations

The filter:
- ✅ Catches most common planning patterns
- ✅ Works for English language prompts
- ❌ May miss some planning text (customize patterns to improve)
- ❌ May theoretically filter legitimate response text (unlikely, configure patterns carefully)

## Future Enhancements

Possible improvements:
- [ ] ML-based planning text detection
- [ ] Per-agent custom patterns
- [ ] Toggle filter on/off per message
- [ ] Show filtered text in collapsible section
- [ ] Multi-language support

## Testing

### Manual Testing

1. Start: `npm run dev`
2. Send query with any agent
3. Watch browser console for `[PARSER] Filtering planning text` logs
4. Verify chat shows only clean response (no "I'll check...", "Let me try..." etc.)
5. Verify Activity Panel shows investigation phases via TodoWrite

### Expected Behavior

```
Chat shows:
✅ Only final formatted response
❌ No "I'll check..." or "Let me try..." text

Activity Panel shows:
✅ Investigation phases (from TodoWrite)
❌ Individual tool calls still visible (different feature)

Logs show:
✅ [PARSER] Filtering planning text: "I'll..."
```

## Files Modified

1. **lib/claude-sdk/stream-parser.ts**
   - Added `displayedText` property
   - Added `isPlanningText()` method
   - Updated text parsing to filter planning
   - Added `getDisplayedText()` method
   - Updated `reset()` to clear displayedText

2. **components/chat-interface.tsx**
   - Updated text chunk handler to use `displayedText`
   - Updated final message to use `getDisplayedText()`

## Stateful Filtering (Handles Phrases Spanning Chunks)

The filter now uses **stateful tracking** to handle planning phrases that span multiple SSE chunks:

### How It Works

```typescript
// State variables in StreamParser
private inPlanningPhrase = false;      // Track if mid-phrase
private planningBuffer = '';            // Buffer accumulated text

// When planning phrase detected:
1. Check if it ends in this chunk
   - If yes: skip it, process remaining text
   - If no: set inPlanningPhrase=true, buffer it, return empty
2. When in planning phrase:
   - Accumulate text until sentence boundary (. ! ?)
   - Skip entire accumulated planning phrase
   - Reset state and process remaining text
```

### Example: Text Spanning Chunks

**Chunk 1**: "Let me try using the omni-api"
- Starts with planning pattern "Let me try"
- No sentence boundary in chunk
- Buffer: "Let me try using the omni-api"
- inPlanningPhrase = true
- Return: ""

**Chunk 2**: " tool to get the exchange rate. The response:"
- Already in planning phrase
- Accumulate: "Let me try using the omni-api tool to get the exchange rate."
- Hit sentence boundary (period)
- inPlanningPhrase = false
- Skip planning phrase, recursively process: "The response:"
- Return: "The response:"

Result: Planning text completely removed, "The response:" added to display ✅

## Iteration Limit Handling

When agents approach the maximum iteration limit (~10 turns), they:

### Agent Behavior (Turns 1-10)
1. **Turns 1-5**: Focus on investigation, gathering data
2. **Turns 6-7**: Start preparing summary, mindful of remaining turns
3. **Turn 8+**: STOP new investigations, provide results with next steps

### What Agent Provides (Turn 8+)
- **Summary of findings**: What was discovered and validated
- **Completion status**: What's done vs incomplete
- **Confidence levels**: For each finding
- **Specific next steps** (3-5 options):
  - "To investigate X further, ask me to..."
  - "To correlate with Y, ask me to..."
  - "To validate this finding, ask me to..."
- **Clear handoff**: "You can now ask me to [specific investigation]"

### User Notification
When stream ends, user receives:
- **If max iterations**: Clear warning notification: "Investigation reached the maximum iteration limit (10 iterations). The agent exhausted its allocated turns."
- **If normal completion**: Clean completion message
- Displayed as a **hint/warning** so user sees the status

### Implementation

1. **lib/agents/subagent-configs.ts**: Agent instructions guide behavior
   - After 6 turns: prepare summary
   - At turn 8+: stop and deliver results + next steps
2. **app/api/chat/route.ts**:
   - Counts iterations
   - Detects when max reached
   - Sends notification to user
3. **components/chat-interface.tsx**:
   - Displays max iterations warning as visible hint
   - User immediately knows what happened
4. **stream-parser.ts**:
   - Parses completion chunks with status messages

## Status

✅ Stateful planning text filter implemented (handles phrases spanning chunks)
✅ Max iterations notification implemented
✅ TypeScript compilation passes
✅ Dev server running - ready for testing

---

**Benefits**:
- Clean chat experience (planning text removed)
- Agent reasoning visible in Activity Panel (TodoWrite phases)
- User notified when max iterations reached (no silent failures)
- Best of both worlds! 🚀
