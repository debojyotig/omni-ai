# Current Checkpoint: omni-ai Bootstrap Phase

**Last Updated**: 2025-10-30
**Current Phase**: Bootstrap & Documentation ✅ Complete
**Active Workstream**: Ready for WS1 (Mastra + Next.js Setup)

---

## Current Status

**Project**: omni-ai (Intelligent Investigation Agent Platform)
**Framework**: Mastra.ai + Next.js 15
**Architecture**: Next.js web app + Mastra agents + omni-api-mcp (MCP protocol)
**Status**: Documentation complete, ready for implementation

### Completed (Bootstrap Phase)
- [x] Architecture design (Activity Bar + Main Content, no sidebars)
- [x] Mastra feasibility research (✅ MCP integration verified, ✅ OAuth2 feasible)
- [x] Complete implementation plan (5 workstream checkpoints)
- [x] Project structure created
- [x] **APP_VISION.md** - Simple app idea and AI capabilities
- [x] **CLAUDE.md** - Complete project context
- [x] **README.md** - Quick start guide
- [x] Environment setup (.env.example, .gitignore)
- [x] Tracking system (.claude-code/ structure)

---

## What's Next

### Next Workstream: WS1 - Mastra + Next.js Setup

**Duration**: 2-3 days
**Checkpoint**: `.claude-code/checkpoints/checkpoint-ws1-mastra-nextjs-setup.md`
**Priority**: Critical (foundation for entire project)

**Objective**: Bootstrap omni-ai with Next.js 15, Mastra framework, and establish development environment

**Key Tasks**:
1. Initialize Next.js project with Mastra
2. Copy styling from omni-agent (Tailwind, HSL colors, Inter font)
3. Install shadcn components
4. Create Activity Bar component
5. Set up Zustand stores
6. Verify basic functionality

**Getting Started**:
```bash
cd ~/code/omni-ai
npm create mastra@latest .
# Follow WS1 checkpoint tasks
```

---

## Workstream Overview

### WS1: Mastra + Next.js Setup (2-3 days)
- Bootstrap project with Mastra
- Activity Bar + basic layout
- Styling from omni-agent
- **Status**: Ready to start

### WS2: OAuth2 Hybrid Providers (3-4 days)
- HybridProviderManager (Mastra + custom OAuth2)
- Runtime switching (provider in Settings, model in chat header)
- **Dependencies**: WS1

### WS3: MCP Integration (2-3 days)
- @mastra/mcp setup
- Connect to omni-api-mcp
- Test tool calling
- **Dependencies**: WS1

### WS4: Agents + Workflows (1-2 weeks)
- 3 agents (DataDog Champion, API Correlator, Smart Agent)
- 2 workflows (DataDog Investigation, Multi-API Correlation)
- Agent selector UI
- **Dependencies**: WS1, WS2, WS3

### WS5: UI Polish (1 week)
- Command palette (Cmd+K)
- Iteration progress bar
- Progressive transparency hints
- **Dependencies**: WS4

---

## Related Projects

### omni-api-mcp (../omni-api-mcp)
**Status**: Production-ready MCP server
**Provides**:
- discover_datasets (95% complete)
- build_query (98% complete, 60+ templates)
- call_rest_api, call_graphql
- summarize_multi_api_results

**Integration**: omni-ai consumes these tools via @mastra/mcp

### omni-agent (/Users/debojyoti.ghosh/code/omni-agent)
**Status**: DEPRECATED (used as reference only)
**Purpose**: Reference for UI/UX patterns, styling, components

**See**: `.claude-code/references/omni-agent-codebase.md` for detailed guide

---

## Prerequisites Checklist

Before starting WS1:
- [x] Project structure created
- [x] Documentation complete
- [x] Architecture designed
- [x] Mastra feasibility verified
- [x] omni-api-mcp ready (provides MCP tools)
- [x] omni-agent available (for UI reference)

---

## Verification Commands

After WS1 complete:
```bash
# Run dev server
npm run dev

# Visit http://localhost:3000
# Verify Activity Bar appears
# Verify view switching works (Chat, Settings)
# Verify styling matches omni-agent
# Verify dark mode works
```

---

## Context for Next Session

**You are ready to implement!**

1. **First action**: Run `npm create mastra@latest .` in ~/code/omni-ai
2. **Read**: `.claude-code/checkpoints/checkpoint-ws1-mastra-nextjs-setup.md`
3. **Reference**: omni-agent for styling (`.claude-code/references/omni-agent-codebase.md`)
4. **WebFetch**: Mastra docs as needed (https://mastra.ai/en/docs/)
5. **Use**: shadcn MCP server if available

**Timeline**: 6 weeks to production MVP

**Success Criteria**: See `.claude-code/PROGRESS.md`

---

**Last Updated**: 2025-10-30
**Current Checkpoint**: Bootstrap complete ✅
**Next Checkpoint**: WS1 (Mastra + Next.js Setup) 🚀
