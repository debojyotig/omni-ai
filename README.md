# omni-ai

**Intelligent Investigation Agent Platform** - AI-powered multi-step investigations using Mastra.ai

## What is omni-ai?

omni-ai performs intelligent, automatic investigations across 30+ enterprise APIs:

```
You: "Why are we seeing 500 errors in payment-service?"

omni-ai: [8-step investigation executes automatically]
  ✅ Discovers DataDog capabilities
  ✅ Queries errors (1,247 found)
  ✅ Analyzes trends (+850% spike at 2:45 PM)
  ✅ Fetches traces
  ✅ Checks deployments (v2.3 at 2:40 PM)
  ✅ Correlates timeline
  ✅ Root Cause: "New validation timing out"

Result: 45 minutes → 2 minutes ⚡
```

## Three Intelligent Agents

1. **DataDog Champion** 🔍 - Root cause analysis (errors, latency, availability)
2. **API Correlator** 🔗 - Cross-service data correlation
3. **Smart Agent** 🤖 - Auto-detects intent, routes to correct workflow

## Key Features

- ✅ **Multi-step reasoning** - Not just Q&A, full investigations
- ✅ **60+ query templates** - 98% accuracy, instant results
- ✅ **Cross-API correlation** - Find data inconsistencies automatically
- ✅ **Runtime model switching** - Change LLM provider/model without restart
- ✅ **Progressive transparency** - See agent's thought process in real-time
- ✅ **Command palette** - Cmd+K for quick actions

## Tech Stack

- **Framework**: Next.js 15 + [Mastra.ai](https://mastra.ai) (official structure)
- **AI**: GPT-4, Claude, Azure OpenAI (runtime switchable)
- **UI**: shadcn/ui + Tailwind CSS (from omni-agent)
- **Integration**: 30+ APIs via omni-api-mcp (MCP protocol)
- **Storage**: Mastra Memory with LibSQL (conversation persistence)

## Quick Start

```bash
# Initialize Mastra project
npm create mastra@latest .

# Install dependencies
npm install @mastra/mcp zustand

# Set up shadcn/ui
npx shadcn@latest init

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Visit http://localhost:3000

**MCP Servers Configured** (`.mcp.json`):
- ✅ **Mastra Docs Server** - Get Mastra docs during implementation
- ✅ **shadcn MCP** - Install shadcn components on-the-fly

## Project Structure

```
omni-ai/
├── src/
│   └── mastra/           # Official Mastra structure
│       ├── agents/       # 3 intelligent agents
│       ├── tools/        # Custom tools (MCP tools auto-loaded)
│       ├── workflows/    # Investigation workflows
│       ├── mcp/          # MCP integration
│       └── index.ts      # Main Mastra entry point
├── app/                  # Next.js 15 App Router
│   ├── api/chat/         # Chat API endpoint
│   ├── page.tsx          # Main chat interface
│   └── layout.tsx        # Activity Bar + Main Content
├── components/           # React components (shadcn/ui)
│   ├── ui/               # shadcn components
│   ├── chat-interface.tsx
│   ├── activity-bar.tsx
│   └── ...
├── lib/                  # Non-Mastra utilities
│   ├── auth/             # OAuth2 gateway
│   ├── providers/        # Hybrid provider manager
│   └── stores/           # Zustand stores
├── docs/                 # Documentation
│   └── APP_VISION.md
└── .claude-code/         # Implementation checkpoints
    ├── checkpoints/      # WS1-WS5 implementation guides
    └── references/       # omni-agent reference, Mastra best practices
```

## Documentation

### Main Docs
- **App Vision**: `docs/APP_VISION.md` - Simple explanation of what we're building
- **Project Context**: `CLAUDE.md` - Complete technical context for Claude Code
- **Progress**: `.claude-code/PROGRESS.md` - Development timeline and status
- **Current Checkpoint**: `.claude-code/CHECKPOINT.md` - Where we are now

### Implementation Checkpoints
- **WS1**: `.claude-code/checkpoints/checkpoint-ws1-mastra-nextjs-setup.md`
- **WS2**: `.claude-code/checkpoints/checkpoint-ws2-oauth2-providers.md`
- **WS3**: `.claude-code/checkpoints/checkpoint-ws3-mcp-integration.md`
- **WS4**: `.claude-code/checkpoints/checkpoint-ws4-agents-workflows.md`
- **WS5**: `.claude-code/checkpoints/checkpoint-ws5-ui-polish.md`

### Reference Guides
- **omni-agent Reference**: `.claude-code/references/omni-agent-codebase.md` - What to copy from omni-agent
- **Mastra MCP Best Practices**: `.claude-code/references/mastra-mcp-best-practices.md` - MCP integration patterns
- **Official Mastra Structure**: `.claude-code/references/official-mastra-structure.md` - Project structure guide

## Development

### Starting a New Session

**Use this prompt at the start of every Claude Code session**:

Copy from `.claude-code/PROMPT.txt` or use:

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
4. Use MCP servers configured in .mcp.json (Mastra docs + shadcn)
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

**Why this works**: Claude Code loads all context, follows checkpoints, maintains quality standards, and preserves state across sessions.

See `.claude-code/SESSION_START_PROMPT.md` for detailed explanation.

### For Claude Code (Additional Notes)
1. Read `CLAUDE.md` for full project context
2. Check `.claude-code/CHECKPOINT.md` for current status
3. Follow workstream checkpoints in order (WS1 → WS2 → WS3 → WS4 → WS5)
4. Reference guides:
   - `omni-agent-codebase.md` - What to copy from omni-agent
   - `official-mastra-structure.md` - Official Mastra project structure
   - `mastra-mcp-best-practices.md` - MCP integration patterns
5. Use MCP servers in .mcp.json for Mastra docs and shadcn components

### Project Structure Notes
- **All Mastra code**: `src/mastra/` (official Mastra structure)
- **Entry point**: `src/mastra/index.ts` (not `instance.ts`)
- **Agents**: `src/mastra/agents/` (3 agents)
- **MCP integration**: `src/mastra/mcp/omni-api-client.ts`
- **Non-Mastra code**: `lib/`, `components/`, `app/`

### Timeline
**6 weeks to MVP**:
- **Week 1**: WS1 (Mastra + Next.js setup)
- **Week 2**: WS2 (OAuth2 hybrid providers)
- **Week 3**: WS3 (MCP integration)
- **Week 4-5**: WS4 (3 agents + 2 workflows)
- **Week 6**: WS5 (UI polish)

## Related Projects

- **omni-api-mcp** (../omni-api-mcp) - MCP server with 30+ API integrations
- **omni-agent** (/Users/debojyoti.ghosh/code/omni-agent) - Reference for UI/UX patterns (deprecated)

## Status

**Phase**: Bootstrap & Documentation ✅ Complete
**Next**: Implementation (WS1: Mastra + Next.js Setup)

See `.claude-code/CHECKPOINT.md` for current status.

## References

- **Mastra Framework**: https://mastra.ai
- **Example App**: https://fromolive.com (built with Mastra)
- **MCP Protocol**: Model Context Protocol by Anthropic

---

**Built with Mastra.ai. Powered by LLMs. 10x faster investigations.**
