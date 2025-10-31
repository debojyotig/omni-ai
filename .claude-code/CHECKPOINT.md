# Current Checkpoint: omni-ai WS1 Complete

**Last Updated**: 2025-10-31
**Current Phase**: Phase 1 - Foundation ✅ WS1 Complete
**Active Workstream**: Ready for WS2 (OAuth2 Hybrid Providers)

---

## Current Status

**Project**: omni-ai (Intelligent Investigation Agent Platform)
**Framework**: Mastra.ai + Next.js 16
**Architecture**: Next.js web app + Mastra agents (integrated) + omni-api-mcp (MCP protocol)
**Status**: WS1 complete, foundation ready for WS2

### Completed (WS1: Mastra + Next.js Setup) ✅

- [x] Next.js 16.0.1 installed with Turbopack
- [x] React 19.2.0 configured
- [x] Tailwind CSS v4 with @tailwindcss/postcss
- [x] Activity Bar component (72px width)
- [x] Zustand view store with localStorage persistence
- [x] App structure (layout + page)
- [x] TypeScript configured with path aliases (@/*)
- [x] Dark mode enabled by default
- [x] View switching working (Chat ⇄ Settings)
- [x] Dev server running successfully

**Git Commits**:
- `95c61d2` - docs: update Next.js 14 to Next.js 15 across all documentation
- `71b5060` - feat: complete WS1 - Next.js 16 + Mastra + Tailwind v4 setup

---

## What's Next

### Next Workstream: WS2 - OAuth2 Hybrid Providers

**Duration**: 3-4 days
**Checkpoint**: `.claude-code/checkpoints/checkpoint-ws2-oauth2-providers.md`
**Priority**: High (enables runtime model switching)
**Dependencies**: WS1 ✅

**Objective**: Implement hybrid provider system (Mastra standard + custom OAuth2) with runtime switching

**Key Tasks**:
1. Configure Mastra built-in providers (OpenAI, Anthropic)
2. Implement OAuth2Gateway for enterprise providers (Azure, AWS, GCP)
3. Create custom provider wrappers (AzureOpenAIProvider, etc.)
4. Build HybridProviderManager to unify both systems
5. Create provider store (Zustand) with persistence
6. Build Settings panel with provider selector
7. Build Chat header with model selector
8. Test runtime provider/model switching

**Getting Started**:
```bash
cd ~/code/omni-ai
# Read WS2 checkpoint
cat .claude-code/checkpoints/checkpoint-ws2-oauth2-providers.md
# Start implementation
npm run dev
```

---

## Workstream Overview

### ✅ WS1: Mastra + Next.js Setup (COMPLETE)
- Bootstrap project with Next.js 16
- Activity Bar + basic layout
- Styling from omni-agent
- **Status**: ✅ Complete (2025-10-31)

### 🔄 WS2: OAuth2 Hybrid Providers (ACTIVE)
- HybridProviderManager (Mastra + custom OAuth2)
- Runtime switching (provider in Settings, model in chat header)
- **Status**: ⏳ Ready to start
- **Dependencies**: WS1 ✅

### ⏳ WS3: MCP Integration
- @mastra/mcp setup
- Connect to omni-api-mcp
- Test tool calling
- **Status**: ⏳ Pending
- **Dependencies**: WS1 ✅

### ⏳ WS4: Agents + Workflows
- 3 agents (DataDog Champion, API Correlator, Smart Agent)
- 2 workflows (DataDog Investigation, Multi-API Correlation)
- Agent selector UI
- **Status**: ⏳ Pending
- **Dependencies**: WS1 ✅, WS2 ✅, WS3 ✅

### ⏳ WS5: UI Polish
- Command palette (Cmd+K)
- Iteration progress bar
- Progressive transparency hints
- **Status**: ⏳ Pending
- **Dependencies**: WS4 ✅

---

## Related Projects

### omni-api-mcp (../omni-api-mcp)
**Status**: Production-ready MCP server
**Provides**:
- discover_datasets (95% complete)
- build_query (98% complete, 60+ templates)
- call_rest_api, call_graphql
- summarize_multi_api_results

**Integration**: omni-ai consumes these tools via @mastra/mcp (WS3)

### omni-agent (/Users/debojyoti.ghosh/code/omni-agent)
**Status**: DEPRECATED (used as reference only)
**Purpose**: Reference for UI/UX patterns, styling, components

**See**: `.claude-code/references/omni-agent-codebase.md` for detailed guide

---

## Tech Stack (Current)

**Framework & Runtime:**
- Next.js 16.0.1 with Turbopack
- React 19.2.0
- Node.js 20+, TypeScript 5.9.3

**Styling:**
- Tailwind CSS 4.1.16 (@tailwindcss/postcss)
- HSL color system (dark mode)
- Inter font (next/font/google)

**State Management:**
- Zustand 5.0.8 with localStorage persistence

**Mastra (Integrated):**
- @mastra/core 0.23.3
- @mastra/memory 0.15.10
- @mastra/libsql 0.16.1

**Icons & UI:**
- lucide-react 0.548.0
- shadcn/ui (to be added in WS2)

---

## Verification Commands

**Check WS1 completion:**
```bash
npm run dev
# ✓ Server starts at http://localhost:3000
# ✓ Activity Bar appears
# ✓ Chat/Settings view switching works
# ✓ Dark mode active
# ✓ No console errors
```

**Verify git history:**
```bash
git log --oneline
# 71b5060 feat: complete WS1 - Next.js 16 + Mastra + Tailwind v4 setup
# 95c61d2 docs: update Next.js 14 to Next.js 15 across all documentation
```

---

## Context for Next Session

**You are ready for WS2!**

1. **First action**: Read `.claude-code/checkpoints/checkpoint-ws2-oauth2-providers.md`
2. **Focus**: Implement OAuth2 hybrid provider system
3. **Reference**: omni-agent OAuth2 logic (`.claude-code/references/omni-agent-codebase.md`)
4. **Goal**: Runtime model switching without restart

**Timeline**: 6 weeks to production MVP (Week 2 starting)

**Success Criteria**: See `.claude-code/PROGRESS.md`

---

**Last Updated**: 2025-10-31
**Current Checkpoint**: WS1 complete ✅
**Next Checkpoint**: WS2 (OAuth2 Hybrid Providers) 🚀
