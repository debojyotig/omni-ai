# omni-ai Development Progress

**Project**: omni-ai (Intelligent Investigation Agent Platform)
**Started**: 2025-10-30
**Target**: 6 weeks to MVP

---

## Progress Overview

| Phase | Status | Progress | Timeline | Checkpoint |
|-------|--------|----------|----------|------------|
| **Phase 0: Bootstrap** | ✅ Complete | 100% | Week 0 | Bootstrap |
| **Phase 1: Foundation** | ⏳ Pending | 0% | Week 1-2 | WS1-WS2 |
| **Phase 2: Integration** | ⏳ Pending | 0% | Week 3 | WS3 |
| **Phase 3: Core Features** | ⏳ Pending | 0% | Week 4-5 | WS4 |
| **Phase 4: Polish** | ⏳ Pending | 0% | Week 6 | WS5 |

**Overall Progress**: 20% (Bootstrap Complete)

---

## Phase 0: Bootstrap & Documentation ✅ 100%

**Timeline**: Week 0 (2025-10-30)
**Status**: ✅ Complete

### Completed Tasks

- [x] Architecture design (Activity Bar + Main Content, no sidebars)
- [x] Mastra feasibility research (✅ MCP integration verified, ✅ OAuth2 feasible)
- [x] Complete implementation plan (5 workstream checkpoints)
- [x] Project structure created (`~/code/omni-ai`)
- [x] **APP_VISION.md** - Simple app idea and AI capabilities (16KB)
- [x] **CLAUDE.md** - Complete project context (master document)
- [x] **README.md** - Quick start guide
- [x] Environment setup (.env.example, .gitignore)
- [x] Tracking system (.claude-code/ structure)
- [x] **5 Workstream Checkpoints** (WS1-WS5)
- [x] **omni-agent Reference Guide** (what to copy, what to skip)

### Key Decisions Made

1. **Framework**: Mastra.ai for agent orchestration (proven, Y Combinator backed)
2. **Platform**: Next.js 15 web app (Electron fallback if memory issues)
3. **Layout**: Activity Bar (72px) + Main Content only (no sidebars)
4. **Agents**: 3 agents (DataDog Champion, API Correlator, Smart Agent)
5. **Workflows**: 2 workflows (DataDog Investigation, Multi-API Correlation)
6. **Memory**: Mastra Memory with LibSQL storage (replaces custom Zustand chat-store)
7. **MCP Integration**: @mastra/mcp package connects to omni-api-mcp
8. **Providers**: Hybrid system (Mastra standard + custom OAuth2)

---

## Phase 1: Foundation (Week 1-2) ⏳ 0%

**Timeline**: Week 1-2
**Status**: ⏳ Ready to Start

### Workstream WS1: Mastra + Next.js Setup ⏳ 0%

**Checkpoint**: `.claude-code/checkpoints/checkpoint-ws1-mastra-nextjs-setup.md`
**Duration**: 2-3 days
**Dependencies**: None

**Objective**: Bootstrap omni-ai with Next.js 15, Mastra framework, and establish development environment

**Key Tasks**:
- [ ] Initialize Next.js project with Mastra (`npm create mastra@latest .`)
- [ ] Copy Tailwind config from omni-agent (HSL colors, Inter font)
- [ ] Copy global styles from omni-agent
- [ ] Install shadcn/ui components
- [ ] Create Activity Bar component (72px width)
- [ ] Set up basic layout (Activity Bar + Main Content)
- [ ] Configure Zustand stores with localStorage persistence
- [ ] Create placeholder views (Chat, Settings)
- [ ] Verify basic functionality

**Success Criteria**:
- [ ] Next.js + Mastra running without errors
- [ ] Activity Bar appears and view switching works
- [ ] Dark mode active with HSL colors from omni-agent
- [ ] View selection persists across refreshes

### Workstream WS2: OAuth2 Hybrid Providers ⏳ 0%

**Checkpoint**: `.claude-code/checkpoints/checkpoint-ws2-oauth2-providers.md`
**Duration**: 3-4 days
**Dependencies**: WS1

**Objective**: Implement hybrid provider system (Mastra standard + custom OAuth2) with runtime switching

**Key Tasks**:
- [ ] Configure Mastra built-in providers (OpenAI, Anthropic)
- [ ] Implement OAuth2Gateway for enterprise providers (Azure, AWS, GCP)
- [ ] Create custom provider wrappers (AzureOpenAIProvider)
- [ ] Build HybridProviderManager to unify both systems
- [ ] Create provider store (Zustand) with persistence
- [ ] Build Settings panel with provider selector
- [ ] Build Chat header with model selector
- [ ] Test runtime provider/model switching

**Success Criteria**:
- [ ] Standard providers work (OpenAI, Anthropic)
- [ ] OAuth2 token fetch and refresh working (5min buffer)
- [ ] Provider selector updates model list dynamically
- [ ] Selections persist across page refreshes
- [ ] No restart required for provider/model changes

---

## Phase 2: MCP Integration (Week 3) ⏳ 0%

**Timeline**: Week 3
**Status**: ⏳ Not Started

### Workstream WS3: MCP Integration ⏳ 0%

**Checkpoint**: `.claude-code/checkpoints/checkpoint-ws3-mcp-integration.md`
**Duration**: 2-3 days
**Dependencies**: WS1, WS2

**Objective**: Connect to omni-api-mcp via @mastra/mcp and expose tools to Mastra agents

**Key Tasks**:
- [ ] Install @mastra/mcp package
- [ ] Create MCP client connecting to omni-api-mcp subprocess
- [ ] Wrap 4 core MCP tools for Mastra (discover_datasets, build_query, call_rest_api, summarize_multi_api_results)
- [ ] Create test agent to verify MCP integration
- [ ] Build API route to test MCP integration (`/api/test-mcp`)
- [ ] Create tool call visualization component (ToolCallCard)
- [ ] Create tool call store for UI updates
- [ ] Manual testing (all 3 test scenarios pass)

**Success Criteria**:
- [ ] MCP client connects to omni-api-mcp without errors
- [ ] Test endpoint passes all 3 tests (connection, direct call, agent call)
- [ ] Tool call visualization component renders correctly
- [ ] No console errors during tool calls

---

## Phase 3: Core Features (Week 4-5) ⏳ 0%

**Timeline**: Week 4-5
**Status**: ⏳ Not Started

### Workstream WS4: Agents + Workflows ⏳ 0%

**Checkpoint**: `.claude-code/checkpoints/checkpoint-ws4-agents-workflows.md`
**Duration**: 1-2 weeks
**Dependencies**: WS1, WS2, WS3

**Objective**: Implement 3 agents, build chat interface with Mastra Memory

**Key Tasks**:
- [ ] Configure Mastra instance with LibSQL storage
- [ ] Implement DataDog Champion agent (root cause analysis)
- [ ] Implement API Correlator agent (cross-service correlation)
- [ ] Implement Smart Agent (auto-router with intent detection)
- [ ] Create agent store (Zustand) for selection persistence
- [ ] Build chat interface with message history
- [ ] Create Chat API route using Mastra memory
- [ ] Add agent selector to chat header
- [ ] Test conversation persistence (Mastra Memory)
- [ ] End-to-end investigation test (≤3 iterations)

**Success Criteria**:
- [ ] All 3 agents working (DataDog, Correlator, Smart)
- [ ] Chat interface functional end-to-end
- [ ] Conversation history persists across refreshes (via Mastra Memory)
- [ ] Agent selector works and persists selection
- [ ] Investigation completes in ≤3 iterations (95% success target)

---

## Phase 4: UI Polish (Week 6) ⏳ 0%

**Timeline**: Week 6
**Status**: ⏳ Not Started

### Workstream WS5: UI Polish ⏳ 0%

**Checkpoint**: `.claude-code/checkpoints/checkpoint-ws5-ui-polish.md`
**Duration**: 1 week
**Dependencies**: WS4

**Objective**: Polish UX with command palette, iteration progress, progressive transparency

**Key Tasks**:
- [ ] Install command palette components (shadcn command + dialog)
- [ ] Implement command palette (Cmd+K)
- [ ] Create iteration progress store
- [ ] Build iteration progress bar component (shows current step)
- [ ] Create progressive transparency hint component (one-liner above input)
- [ ] Update chat interface with progress components
- [ ] Add stop button to cancel long-running requests
- [ ] Improve responsive design (mobile/tablet/desktop)
- [ ] Add accessibility improvements (ARIA labels, keyboard nav)
- [ ] Performance optimizations (animations, throttling)

**Success Criteria**:
- [ ] Command palette opens with Cmd+K and works correctly
- [ ] Iteration progress bar shows during agent execution
- [ ] Progressive transparency hints appear and auto-fade
- [ ] Stop button cancels ongoing requests
- [ ] Responsive design works on all screen sizes
- [ ] Accessibility compliance (WCAG 2.1 AA target)

---

## Success Metrics

### Performance Targets

| Metric | Goal | Status |
|--------|------|--------|
| Investigation time | 45 min → 2 min (95% reduction) | ⏳ Pending |
| Query success rate | 95% in ≤3 iterations | ⏳ Pending |
| Template coverage | 60% of queries use templates | ⏳ Pending (omni-api-mcp has 60+ templates) |
| Memory usage | <500MB for normal use | ⏳ Pending |

### User Experience

| Aspect | Target | Status |
|--------|--------|--------|
| Time to first result | <5 seconds | ⏳ Pending |
| Accuracy | 95% correct root cause | ⏳ Pending |
| Transparency | Show all steps before execution | ⏳ Pending |
| Efficiency | ≤5 API calls per investigation | ⏳ Pending |

---

## Related Projects Status

### omni-api-mcp ✅ Production-Ready

**Location**: `../omni-api-mcp`
**Status**: ✅ 97% Complete (WS1: 95%, WS2: 98%, WS3: Relocated)

**Provides to omni-ai**:
- ✅ discover_datasets - Service catalog (95% complete)
- ✅ build_query - Natural language → API query (98% complete, 60+ templates)
- ✅ call_rest_api - REST API execution
- ✅ call_graphql - GraphQL API execution
- ✅ summarize_multi_api_results - Cross-service correlation
- ✅ 30+ API integrations
- ✅ Response size management
- ✅ Pattern learning system

**Integration**: omni-ai consumes these tools via @mastra/mcp (WS3)

### omni-agent 📚 Reference Only

**Location**: `/Users/debojyoti.ghosh/code/omni-agent`
**Status**: DEPRECATED (used as UI/UX reference only)

**Reference Guide**: `.claude-code/references/omni-agent-codebase.md`

**What to Copy**:
- ✅ Tailwind config (HSL colors, Inter font)
- ✅ Global styles
- ✅ Activity Bar component structure
- ✅ Tool Call Card component
- ✅ shadcn components
- ✅ OAuth2 logic (adapted)

**What NOT to Copy**:
- ❌ Agent orchestration (use Mastra)
- ❌ Chat state management (use Mastra Memory)
- ❌ MCP client (use @mastra/mcp)
- ❌ Primary/Secondary Sidebars (omni-ai has none)

---

## Risk Tracking

### Current Risks

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| Mastra learning curve | Medium | Read docs, check fromolive.com example | ⏳ Monitoring |
| OAuth2 integration complexity | Medium | Follow omni-agent pattern, test incrementally | ⏳ Monitoring |
| Memory usage (Next.js) | High | Monitor, fallback to Electron if needed | ⏳ Monitoring |
| Investigation success rate <95% | High | Use 3-layer intelligence (templates first) | ⏳ Monitoring |

---

## Weekly Milestones

### Week 0 ✅ Complete
- [x] Bootstrap complete
- [x] All documentation created
- [x] Architecture finalized
- [x] Ready for WS1

### Week 1 ⏳ Pending
- [ ] WS1 complete (Mastra + Next.js setup)
- [ ] Basic layout working
- [ ] View switching functional

### Week 2 ⏳ Pending
- [ ] WS2 complete (OAuth2 providers)
- [ ] Provider/model switching working
- [ ] Settings panel functional

### Week 3 ⏳ Pending
- [ ] WS3 complete (MCP integration)
- [ ] Tool calls working end-to-end
- [ ] Tool visualization rendering

### Week 4-5 ⏳ Pending
- [ ] WS4 complete (Agents + workflows)
- [ ] Chat interface functional
- [ ] All 3 agents working
- [ ] Conversation persistence working

### Week 6 ⏳ Pending
- [ ] WS5 complete (UI polish)
- [ ] Command palette working
- [ ] Progressive transparency working
- [ ] Production-ready

---

## Blockers & Dependencies

### Current Blockers
- None (ready to start WS1)

### Dependency Chain
```
WS1 (Mastra setup)
  ↓
WS2 (OAuth2) + WS3 (MCP)  ← Can run in parallel
  ↓
WS4 (Agents + Workflows)
  ↓
WS5 (UI Polish)
```

---

## Session Log

### Session 1: Bootstrap & Planning (2025-10-30)
**Duration**: Full session
**Completed**:
- Architecture design
- Documentation creation (APP_VISION.md, CLAUDE.md, README.md)
- 5 Workstream Checkpoints (WS1-WS5)
- omni-agent Reference Guide
- Environment setup (.env.example, .gitignore)
- CHECKPOINT.md, PROGRESS.md

**Key Decisions**:
- Use Mastra Memory instead of custom Zustand chat-store
- Abort signal support for tool cancellation
- No sidebars (simplified from omni-agent)
- 6-week timeline to MVP

**Next Session**:
- Start WS1: Run `npm create mastra@latest .`
- Copy styling from omni-agent
- Create Activity Bar component

---

**Last Updated**: 2025-10-30
**Next Checkpoint**: WS1 (Mastra + Next.js Setup)
**Current Phase**: Foundation (Week 1-2)
