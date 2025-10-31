# Session Start Prompt for omni-ai

**Purpose**: Use this prompt at the start of every Claude Code session when working on omni-ai

---

## ✨ Prompt Template (Copy & Paste)

```
I'm building omni-ai, an intelligent investigation agent platform using Mastra.ai.

Context:
- Read CLAUDE.md for complete project overview
- Check .claude-code/CHECKPOINT.md for current workstream status
- Follow the active workstream checkpoint in .claude-code/checkpoints/

Implementation Guidelines:
1. Follow the current workstream checkpoint tasks in order
2. Use official Mastra structure (src/mastra/ for all Mastra code)
3. Reference omni-agent for UI/styling (.claude-code/references/omni-agent-codebase.md)
4. Use MCP servers configured in .mcp.json:
   - Mastra Docs Server for Mastra documentation
   - shadcn MCP for installing components
5. Test after each task completion
6. Update checkpoint progress as you work

Quality Standards:
- Follow official Mastra project structure (src/mastra/)
- Copy styling exactly from omni-agent (Tailwind HSL colors, Inter font)
- Use Mastra Memory (not custom Zustand chat-store)
- All agents in src/mastra/agents/
- MCP integration in src/mastra/mcp/
- Main entry point: src/mastra/index.ts (not instance.ts)

Current Goal: Complete the active workstream checkpoint with high quality implementation.

Let's start! What's the current checkpoint status?
```

---

## 📋 Why This Prompt Works

### 1. **Context Loading**
- Directs Claude to read CLAUDE.md (master context document)
- Points to .claude-code/CHECKPOINT.md for current status
- References the active workstream checkpoint

### 2. **Implementation Guidelines**
- Clear step-by-step approach
- Official Mastra structure emphasized
- Reference guides mentioned
- MCP servers usage encouraged

### 3. **Quality Standards**
- Specific structural requirements
- Styling consistency (omni-agent)
- Key architectural decisions (Mastra Memory, folder structure)
- Entry point naming convention

### 4. **Action-Oriented**
- Ends with a question to engage Claude
- Prompts immediate status check
- Sets expectation for checkpoint completion

---

## 🎯 Usage Examples

### Starting WS1 (Fresh)
```
I'm building omni-ai, an intelligent investigation agent platform using Mastra.ai.

[... full prompt ...]

Let's start! What's the current checkpoint status?
```

**Expected Response**: Claude checks CHECKPOINT.md, sees WS1 is active, reads checkpoint-ws1-mastra-nextjs-setup.md, and begins implementation.

---

### Resuming WS3 (Mid-Checkpoint)
```
I'm building omni-ai, an intelligent investigation agent platform using Mastra.ai.

[... full prompt ...]

Let's start! What's the current checkpoint status?
```

**Expected Response**: Claude checks CHECKPOINT.md, sees WS3 is in progress (e.g., Task 5 complete, Task 6 next), and continues from where it left off.

---

### After Checkpoint Update
```
I'm building omni-ai, an intelligent investigation agent platform using Mastra.ai.

[... full prompt ...]

Let's start! What's the current checkpoint status?
```

**Expected Response**: Claude sees new status, adapts to current task, references updated notes in checkpoint file.

---

## 🔄 Prompt Evolution

**This prompt is designed to be stable across all workstreams** because it:
- Doesn't hardcode specific workstream numbers
- References dynamic checkpoint files
- Uses general implementation principles
- Points to master context (CLAUDE.md)

**If you need to update the prompt**, edit this file and use the updated version in future sessions.

---

## 📚 What Claude Code Will Do

When you use this prompt, Claude Code will:

1. ✅ Read CLAUDE.md for full project context
2. ✅ Check .claude-code/CHECKPOINT.md to see current workstream
3. ✅ Read the active checkpoint file (e.g., checkpoint-ws1-mastra-nextjs-setup.md)
4. ✅ Review reference guides:
   - omni-agent-codebase.md (UI patterns)
   - official-mastra-structure.md (folder structure)
   - mastra-mcp-best-practices.md (MCP integration)
5. ✅ Start executing checkpoint tasks in order
6. ✅ Use MCP servers for Mastra docs and shadcn components
7. ✅ Update checkpoint as tasks complete

---

## 💡 Tips for Best Results

### Do:
- ✅ Copy the prompt exactly as written
- ✅ Use at the start of every session
- ✅ Let Claude read all context files first
- ✅ Trust the checkpoint system

### Don't:
- ❌ Skip reading CLAUDE.md
- ❌ Modify checkpoint files mid-session (unless updating progress)
- ❌ Override Mastra structure conventions
- ❌ Ask Claude to "start fresh" (checkpoints preserve state)

---

## 🚨 Troubleshooting

### If Claude seems lost:
**Say**: "Check .claude-code/CHECKPOINT.md and tell me the current workstream and task status"

### If Claude uses wrong folder structure:
**Say**: "Use official Mastra structure: src/mastra/ for all Mastra code. Check .claude-code/references/official-mastra-structure.md"

### If Claude forgets omni-agent styling:
**Say**: "Reference .claude-code/references/omni-agent-codebase.md for exact styling patterns"

### If checkpoint seems outdated:
**Say**: "Update .claude-code/CHECKPOINT.md with current progress and continue"

---

## 📊 Session Success Checklist

After each session, verify:
- [ ] Checkpoint file updated with completed tasks
- [ ] Code follows official Mastra structure (src/mastra/)
- [ ] Styling matches omni-agent (if UI work)
- [ ] Tests pass (if applicable)
- [ ] .claude-code/CHECKPOINT.md reflects accurate status

---

**Last Updated**: 2025-10-30
**Status**: Ready for use in all omni-ai sessions
**Workstreams Supported**: WS1, WS2, WS3, WS4, WS5 (all)
