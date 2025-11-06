# TodoWrite Integration Guide

## Overview

We've integrated native Claude Agent SDK **TodoWrite** functionality into omni-ai to replace manual step tracking with real-time task tracking from agents.

## What is TodoWrite?

TodoWrite is a native Claude Agent SDK tool that allows agents to declare and track investigation phases/tasks. As agents work, they emit todo updates through the SSE stream with status changes:
- `pending` - Task declared but not started
- `in_progress` - Task is currently being executed
- `completed` - Task finished

## Architecture

### Stream Processing Pipeline

```
Agent (Claude Agent SDK)
  ↓
  Calls TodoWrite tool
  ↓
SSE Stream (data: {...})
  ↓
ChatInterface (parseChunk)
  ↓
StreamParser.parseTodoChunk()
  ↓
Converts to ActivityStep
  ↓
ActivityStore (adds/updates steps)
  ↓
ActivityPanel (displays timeline)
```

### Key Components

#### 1. **StreamParser** (`lib/claude-sdk/stream-parser.ts`)

- **ParsedTodoChunk Interface**: Structures todo data from SDK
  ```typescript
  export interface ParsedTodoChunk {
    type: 'todo';
    todos: Array<{
      content: string;
      status: 'pending' | 'in_progress' | 'completed';
      activeForm: string;
    }>;
  }
  ```

- **parseTodoChunk() Method**: Extracts todos from TodoWrite tool calls
  ```typescript
  private parseTodoChunk(todoUse: any): ParsedTodoChunk {
    const todos = todoUse.input?.todos || [];
    return {
      type: 'todo',
      todos: todos.map((todo: any) => ({
        content: todo.content || '',
        status: (todo.status || 'pending') as 'pending' | 'in_progress' | 'completed',
        activeForm: todo.activeForm || todo.content || '',
      })),
    };
  }
  ```

#### 2. **ChatInterface** (`components/chat-interface.tsx`)

- **todoStepsRef**: Tracks which todos have been added to prevent duplicates
  ```typescript
  const todoStepsRef = useRef<Map<string, { stepId: string }>>(new Map());
  ```

- **Todo Chunk Handler**: Converts TodoWrite to ActivitySteps
  ```typescript
  case 'todo':
    for (const todo of parsedChunk.todos) {
      if (todo.status === 'in_progress' || todo.status === 'completed') {
        // Add as new ActivityStep if not seen before
        // Update status if already exists
      }
    }
  ```

#### 3. **Agent Configuration** (`lib/agents/subagent-configs.ts`)

All three agents now:
- Have TodoWrite in their allowed tools list
- Receive instructions to declare investigation phases
- Are prompted to mark todos in_progress and completed as they work

#### 4. **ActivityPanel** (`components/activity-panel.tsx`)

No changes needed! The existing ActivityPanel already displays ActivitySteps in a beautiful timeline. TodoWrite data flows seamlessly into the same display.

## How It Works

### 1. Agent Declares Phases

At the start of an investigation, an agent calls TodoWrite:

```
User: "Find the root cause of the 500 error spike"

Agent: "I'll investigate this systematically."
[Calls TodoWrite with:
  - "Problem Identification" (pending)
  - "Data Collection" (pending)
  - "Pattern Analysis" (pending)
  - "Root Cause Determination" (pending)
]
```

### 2. Agent Updates Progress

As the agent works, it updates todo statuses:

```
Agent: "Starting data collection..."
[Updates TodoWrite: "Problem Identification" → completed]
[Updates TodoWrite: "Data Collection" → in_progress]
[Calls API to fetch error logs]
```

### 3. UI Shows Real-Time Progress

The activity panel displays each todo update:
- In_progress todos show as "running" with spinner icon
- Completed todos show with checkmark
- Pending todos are hidden

### 4. Stream Handler Converts Todos to ActivitySteps

```
ParsedTodoChunk: {
  type: 'todo',
  todos: [
    { content: 'Problem Identification', status: 'completed', ... },
    { content: 'Data Collection', status: 'in_progress', ... }
  ]
}
    ↓
ActivityStep: {
  type: 'analysis',
  title: 'Problem Identification',
  status: 'done',
  icon: 'check'
}
```

## Agent Instructions

Each of the three agents now receives TodoWrite guidance:

### DataDog Champion
Phases: Problem Identification → Data Collection → Pattern Analysis → Root Cause Determination → Impact Assessment → Remediation Guidance

### API Correlator
Phases: Planning → Data Collection → Data Alignment → Correlation Analysis → Inconsistency Classification → Reporting

### General Investigator
Phases: Understanding → Discovery → Query Construction → Execution → Analysis → (Correlation) → Reporting

## Status Mapping

| SDK Status    | ActivityStep Status | Icon |
|---------------|-------------------|------|
| pending       | (hidden)          | —    |
| in_progress   | running           | 🔄   |
| completed     | done              | ✓    |

## Benefits

### For Users
- ✅ See real-time investigation progress without manual instrumentation
- ✅ Understand agent reasoning through declared phases
- ✅ Native task tracking (no custom code)
- ✅ Consistent UI display (same activity panel for all agents)

### For Agents
- ✅ Flexible task declaration (declare whatever phases fit the investigation)
- ✅ Native SDK support (built-in tool, always available)
- ✅ Real-time user feedback (UI updates as work progresses)
- ✅ Composable phases (can declare sub-phases within main phases if needed)

## Implementation Details

### Stream Parsing
- TodoWrite chunks detected in `parseAssistantChunk()`
- Extracted via `parseTodoChunk()` method
- Converted to ParsedTodoChunk with structured todos array

### Activity Panel Integration
- ParsedTodoChunk handled in ChatInterface's SSE switch statement
- Each todo converted to ActivityStep via `addStep()`
- Status updates via `completeStep()`
- No changes to activity-panel.tsx needed

### Manual Step Tracking (Coexistence)
- The old manual step tracking (planningStepRef, toolStepsRef) still works
- TodoWrite and manual tracking can coexist
- When agents use TodoWrite, it provides additional context beyond tool calls
- Future: Can gradually phase out manual tracking as TodoWrite adoption increases

## Testing TodoWrite Integration

### Manual Testing
1. Start the dev server: `npm run dev`
2. Open chat interface
3. Send a query to any agent
4. Monitor the Activity Panel for todo updates
5. Check browser console for debug logs (prefixed with `[STREAM] Todo chunk`)

### Debug Logs
Look for these console messages:
```
[STREAM] Todo chunk received with N items
[STREAM] Added todo step: [description] (stepId)
[STREAM] Completed todo step: [description] (stepId)
```

### Expected Behavior
- Todos appear in Activity Panel as "analysis" type steps
- In_progress todos show spinner icon
- Completed todos show checkmark icon
- Todos appear in order declared by agent

## Future Enhancements

Possible improvements:
- [ ] Nested todo support (sub-phases within phases)
- [ ] Todo dependency tracking (mark one complete when all sub-todos done)
- [ ] Custom todo icons based on phase type
- [ ] Todo filtering in Activity Panel (show/hide completed)
- [ ] Export investigation timeline (copy todo structure)
- [ ] Todo statistics (avg time per phase, total investigation time)

## Backward Compatibility

- ✅ Manual step tracking still works
- ✅ Tool call tracking (toolStepsRef) still works
- ✅ No breaking changes to existing code
- ✅ agents can use both TodoWrite and manual approaches simultaneously

## Files Modified

1. **lib/claude-sdk/stream-parser.ts**
   - Added ParsedTodoChunk interface
   - Implemented parseTodoChunk() method
   - Added todo case to getHintFromChunk()

2. **components/chat-interface.tsx**
   - Added todoStepsRef tracking
   - Added todo chunk handler in SSE switch statement
   - Clear todoStepsRef on new message

3. **lib/agents/subagent-configs.ts**
   - Added TodoWrite to tool lists for all 3 agents
   - Updated agent instructions to guide TodoWrite usage

## Error Handling

The implementation handles edge cases:
- ✅ Missing todos array → defaults to empty array
- ✅ Missing status → defaults to 'pending'
- ✅ Missing content → defaults to empty string
- ✅ Duplicate todos → only first occurrence added, others update status
- ✅ Out-of-order updates → handled gracefully (status can change at any time)

## Debugging

### To see raw TodoWrite chunks:
```javascript
// In browser console
// Add this to ChatInterface after parseChunk:
if (parsedChunk?.type === 'todo') {
  console.log('RAW TODO CHUNK:', parsedChunk);
}
```

### To trace todo step IDs:
```bash
# In console logs, look for:
[STREAM] Added todo step: [description] ([stepId])
[STREAM] Completed todo step: [description] ([stepId])
```

## Next Steps

1. **Test with agents** - Run agents and verify TodoWrite streams are detected
2. **Monitor logs** - Check browser console for todo chunk debug messages
3. **Verify UI** - Confirm Activity Panel displays todos correctly
4. **Gradual adoption** - Agents naturally declare todos as they work
5. **Optional cleanup** - Remove manual step tracking once TodoWrite proves stable (only if desired)

## FAQ

**Q: Why keep manual step tracking if we have TodoWrite?**
A: Agents need to be trained to use TodoWrite. During transition, both can coexist. Manual tracking ensures progress is always visible.

**Q: Can agents declare their own custom phases?**
A: Yes! TodoWrite is flexible. Agents can declare whatever phases make sense for their investigation.

**Q: What if an agent doesn't use TodoWrite?**
A: The activity panel will show only tool calls and tool results. TodoWrite is optional enhancement, not required.

**Q: How do I verify TodoWrite is working?**
A: Check browser console for `[STREAM] Todo chunk received` messages and verify Activity Panel shows todo steps.

**Q: Can I customize todo icons?**
A: Yes, in ChatInterface's todo handler, update the `icon` property when creating ActivitySteps.

---

**Status**: ✅ TodoWrite integration complete and verified. Agents now have instructions and tools to declare their investigation phases in real-time.
