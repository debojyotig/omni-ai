# Streaming Input Mode Implementation

## Overview

Streaming Input Mode is now implemented with a **feature flag** that allows you to toggle between:

1. **Streaming Input Mode** (✅ **DEFAULT - RECOMMENDED**)
   - Uses `AsyncGenerator` for prompt
   - Long-lived, stateful processing
   - Better for interactive chat applications
   - Supports interruptions, permission requests, dynamic message queuing

2. **Single Message Mode** (Fallback option)
   - Uses string for prompt
   - Stateless, single-message processing
   - Better for lambda/serverless functions
   - One-shot responses

Reference: https://docs.claude.com/en/api/agent-sdk/streaming-vs-single-mode.md

---

## Feature Flag

**Environment Variable**: `USE_STREAMING_INPUT_MODE`

**Default**: `true` (Streaming Input Mode - recommended)

### Enable Streaming Input Mode (Default)
```bash
USE_STREAMING_INPUT_MODE=true
```

### Use Single Message Mode (Fallback)
```bash
USE_STREAMING_INPUT_MODE=false
```

---

## Files Changed

### New Files
- **`lib/agents/streaming-input-mode.ts`**
  - `isStreamingInputModeEnabled()` - Check feature flag status
  - `createStreamingPromptGenerator()` - Create AsyncGenerator for prompts
  - `getPromptInput()` - Get prompt in correct format based on flag
  - `logInputMode()` - Log current mode for debugging

### Updated Files
- **`app/api/chat/route.ts`**
  - Added import of streaming mode utilities (line 17)
  - Call `logInputMode()` on each request (line 200)
  - Use `getPromptInput()` to get appropriate prompt format (line 205)
  - Pass `promptInput` to `query()` function instead of raw message (line 209)

- **`.env.example`**
  - Added `USE_STREAMING_INPUT_MODE` configuration with documentation

---

## Implementation Details

### Streaming Input Mode Flow

```
User Message
    ↓
getPromptInput(message, sessionId)
    ↓
IS FLAG ENABLED?
    ├─ YES → createStreamingPromptGenerator()
    │        Returns AsyncGenerator<any>
    │        Yields SDKUserMessage structure
    │
    └─ NO → return message as string
           Single message mode
    ↓
query({ prompt: promptInput, options: {...} })
    ↓
Claude Agent SDK
    ├─ Streaming Mode: Processes async generator (long-lived)
    └─ Single Mode: Processes string (one-shot)
```

### What the Generator Yields

When Streaming Input Mode is enabled, the AsyncGenerator yields:

```typescript
{
  type: 'user',
  session_id?: string,      // Optional, only if available
  message: {
    role: 'user',
    content: string
  },
  parent_tool_use_id: null
}
```

---

## Logging

When you make a chat request, you'll see one of:

**Streaming Input Mode Enabled:**
```
[STREAMING] Streaming Input Mode: ENABLED (long-lived, stateful)
```

**Single Message Mode:**
```
[STREAMING] Streaming Input Mode: DISABLED (single message mode)
```

---

## When to Use Each Mode

### ✅ Use Streaming Input Mode (Default)
- Interactive chat applications
- Multi-turn conversations
- Need session persistence
- Support for user interruptions
- Real-time permission requests
- omni-ai chat interface

### Use Single Message Mode
- Lambda/serverless (stateless functions)
- One-shot API endpoints
- Batch processing
- No session state needed

---

## Testing

### Test Streaming Input Mode (Enabled)

1. Ensure `.env.local` has (or omit, since it's default):
   ```env
   USE_STREAMING_INPUT_MODE=true
   ```

2. Run dev server:
   ```bash
   npm run dev
   ```

3. Check logs for:
   ```
   [STREAMING] Streaming Input Mode: ENABLED (long-lived, stateful)
   ```

4. Send a chat message - should work normally

### Test Single Message Mode (Disabled)

1. Set in `.env.local`:
   ```env
   USE_STREAMING_INPUT_MODE=false
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

3. Check logs for:
   ```
   [STREAMING] Streaming Input Mode: DISABLED (single message mode)
   ```

4. Send a chat message - should work with single message processing

---

## Architecture

The implementation follows a clean separation of concerns:

```
streaming-input-mode.ts (lib/agents/)
├── isStreamingInputModeEnabled()      ← Read feature flag
├── createStreamingPromptGenerator()   ← Create AsyncGenerator
├── getPromptInput()                   ← Smart prompt selector
└── logInputMode()                     ← Debug logging

chat/route.ts (app/api/)
├── Call logInputMode()                ← Log mode on each request
├── promptInput = getPromptInput(...)  ← Get correct format
└── query({ prompt: promptInput, ... }) ← Pass to SDK
```

---

## Benefits

✅ **Flexibility**: Toggle between modes without recompiling
✅ **Default Recommended**: Streaming mode is default (best for omni-ai)
✅ **Easy to Debug**: Clear logging of which mode is active
✅ **No Breaking Changes**: Existing code works with new system
✅ **Future Ready**: Can add more input modes later if needed

---

## Reference

- **Claude Agent SDK Docs**: https://docs.claude.com/en/api/agent-sdk/streaming-vs-single-mode.md
- **Query Function Docs**: https://docs.claude.com/en/api/agent-sdk/typescript.md
- **Implementation File**: [lib/agents/streaming-input-mode.ts](../../lib/agents/streaming-input-mode.ts)
