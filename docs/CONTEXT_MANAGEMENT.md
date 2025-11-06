# Context Management for Long-Running Conversations

## Problem

As conversations grow longer, the accumulated message history consumes more tokens. Eventually, the conversation exceeds the model's context window, resulting in errors:

```
❌ Input is too long for requested model
❌ Maximum context length exceeded
```

When this happens, the conversation breaks and no results are returned.

## Solution: Context Management

omni-ai now has built-in context management to handle this gracefully:

### 1. **Automatic Error Detection**

The system detects context exhaustion errors and responds with helpful guidance instead of failing silently.

**What the user sees:**
```
❌ Conversation context too long for claude-3-5-sonnet-20241022. To continue, you can:
1. Start a new conversation, or
2. Use `/compact` to summarize older messages
```

### 2. **Using `/compact` to Summarize Conversations**

The Claude Agent SDK provides a built-in `/compact` command that summarizes older messages:

**How to use:**
```
/compact
```

The system will:
- Summarize older messages into a concise summary
- Preserve the most important context
- Free up space for new messages
- Keep continuity intact

**Result:**
```
✅ Conversation history compacted. Older messages have been summarized.
```

### 3. **Starting Fresh Conversations**

When a conversation is too long to salvage, start a new one:
- Click **"New Chat"** in the sidebar
- Previous conversation is preserved in the sidebar
- You can always reference it later

## Token Limits by Model

| Model | Context Window | Max Input |
|-------|---|---|
| Claude 3.5 Sonnet | 200K | 200K |
| Claude 3.5 Haiku | 200K | 200K |
| Claude 3 Opus | 200K | 200K |
| GPT-4 Turbo | 128K | 128K |

## How It Works (Technical Details)

### Context Analysis

The system estimates token usage using:
- ~1.3 tokens per word (average for English)
- Message count and conversation size
- Model-specific context window limits

### Token Usage Thresholds

| Usage | Action |
|-------|--------|
| < 75% | ✅ Continue normally |
| 75-85% | ⚠️ Warning: context approaching limit |
| 85-90% | 🔄 Suggest: `/compact` to summarize |
| > 90% | ❌ Error: Start new conversation or compact |

### Error Handling Flow

```
User sends message
    ↓
System attempts query
    ↓
[Error: Input too long detected]
    ↓
Send helpful guidance to user:
- Explain what happened
- Suggest `/compact` or new conversation
    ↓
Conversation state preserved
- User can start fresh or compact
- No data loss
```

## Best Practices

### 1. **Monitor Conversation Length**
- Be aware of how long conversations are
- Consider starting fresh when reaching 75-80% of context

### 2. **Use `/compact` Proactively**
- Don't wait until it fails
- Compact when context reaches 85%+
- Preserves conversation continuity

### 3. **Organize Multi-Step Tasks**
- Long investigations → multiple conversations
- Each conversation focused on one aspect
- Reference earlier conversations as needed

### 4. **Save Important Results**
- Copy final results/conclusions
- Create new conversation for follow-up questions
- Reference by copying key parts

## Example: Long Investigation Pattern

**Conversation 1: Initial Analysis**
```
User: "Analyze recent error spikes in production"
Agent: [Performs investigation, uses 60% of context]
Result: Root cause identified
```

**When approaching 85% context:**
```
User: /compact
System: [Summarizes findings]
User: "What's the best remediation?"
Agent: [Continues investigation with fresh context]
```

**If needed, Conversation 2:**
```
User: "Based on previous investigation, implement monitoring"
[References findings from Conversation 1]
```

## Future Enhancements

Planned improvements to context management:

- [ ] Automatic context monitoring in sidebar
- [ ] Proactive `/compact` suggestions
- [ ] Cross-conversation references and linking
- [ ] Automatic conversation splitting for long tasks
- [ ] Smart summary preservation

## Troubleshooting

### "Input is too long" error appears

**Do this:**
1. Try `/compact` to summarize old messages
2. If compact fails, start a new conversation
3. Previous conversation saved in sidebar

### Context seems to grow too quickly

**Check:**
- Are you pasting very long documents?
- Is the agent doing very deep investigations?
- Consider breaking into multiple conversations

### Lost important context after compacting

**Remember:**
- Summaries are designed to keep key info
- You can always review previous conversation in sidebar
- Copy important details to reference later

---

**Note:** Context management is automatic—the system detects limits and helps gracefully. No configuration needed!
