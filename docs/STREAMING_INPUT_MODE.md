# Streaming Input Mode Implementation

## Overview

Streaming Input Mode is implemented with a **feature flag** that allows you to toggle between:

1. **Single Message Mode** (✅ **DEFAULT FOR NEXT.JS API ROUTES**)
   - Uses string for prompt
   - Stateless, single-message processing
   - Better for Next.js API routes and serverless functions
   - Simpler, more stable, one-request pattern

2. **Streaming Input Mode** (Advanced - for CLI apps only)
   - Uses `AsyncGenerator` for prompt
   - Long-lived, stateful processing
   - Better for long-lived CLI applications with persistent connections
   - Supports interruptions, permission requests, dynamic message queuing

**Note**: Default is `false` (Single Message Mode) because Next.js API routes are stateless. Streaming Input Mode is designed for long-lived CLI applications, not stateless web APIs.

Reference: https://docs.claude.com/en/api/agent-sdk/streaming-vs-single-mode.md

---

## Feature Flag

**Environment Variable**: `USE_STREAMING_INPUT_MODE`

**Default**: `false` (Single Message Mode - appropriate for stateless API routes)

### Use Single Message Mode (Default - Recommended for Next.js)
```bash
USE_STREAMING_INPUT_MODE=false
```

### Enable Streaming Input Mode (CLI apps only)
```bash
USE_STREAMING_INPUT_MODE=true
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

**Single Message Mode (Default):**
```
[STREAMING] Streaming Input Mode: DISABLED (single message mode)
```

**Streaming Input Mode (CLI mode - set USE_STREAMING_INPUT_MODE=true):**
```
[STREAMING] Streaming Input Mode: ENABLED (long-lived, stateful)
```

---

## When to Use Each Mode

### ✅ Use Single Message Mode (Default for Next.js)
- Next.js API routes (stateless)
- Lambda/serverless functions
- One-request-per-API-call pattern
- No persistent connection needed
- Simpler, more stable for web APIs
- **omni-ai chat interface** (current use case)

### Use Streaming Input Mode (Advanced - CLI apps only)
- Long-lived CLI applications
- Persistent connection scenarios
- Need to handle user interruptions mid-processing
- Complex multi-step interactions
- Applications that maintain a session object

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
