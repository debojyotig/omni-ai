# Current Checkpoint: omni-ai WS7 Complete ✅ → Research Phase

**Last Updated**: 2025-10-31
**Current Phase**: Research & Planning (Claude Agent SDK Migration)
**Active Workstream**: Research (Comprehensive Analysis for WS8-WS13)

---

## ⚠️ CRITICAL: Validation Standards for All Workstreams

**READ THIS BEFORE MARKING ANY WORKSTREAM COMPLETE**

### ❌ NOT Sufficient for Completion

- ✗ Initialization logs showing services loaded
- ✗ No console errors during startup
- ✗ Tools/functions appearing in lists
- ✗ Code compiles without errors

### ✅ Required for Completion

**ONE of the following MUST be true:**

1. **Actual end-to-end validation with temp test script**
   - Create temp validation script (e.g., `temp-test-wsX.js`)
   - Make actual API calls or function calls
   - Verify full flow works (not just initialization)
   - **Clean up temp script after validation** (do not commit)
   - Document validation results in checkpoint

2. **User validates in terminal**
   - Ask user to run app (`npm run dev`)
   - User makes real query/operation
   - User reports success/failure
   - Update workstream based on user feedback

### Claude Code Limitations

**What you CANNOT do:**
- Test authenticated APIs without valid API keys
- Verify runtime behavior in user's terminal environment
- See actual user-specific configuration

**What you MUST do:**
- Create temp test scripts for automated validation
- Test with public APIs when possible
- **Ask user to validate** when your tests are insufficient
- Document validation evidence in checkpoint
- Clean up temp files after validation

### Validation Process Template

```bash
# 1. Create temp test script
# temp-test-wsX.js - Direct function/tool calls

# 2. Run validation
node temp-test-wsX.js

# 3. Verify results
# - Check actual API calls succeed
# - Verify end-to-end flow works
# - Document evidence

# 4. Clean up
rm temp-test-wsX.js
```

### Lesson from WS6

**Initial mistake**: Marked WS6 complete based only on initialization logs showing "11 enabled datasets". This was **false positive** - logs only proved subprocess started, not that env vars were actually used.

**Proper validation**: Created temp test script that made actual CoinGecko API call and verified DataDog showed "available" status. This proved env vars were passed correctly.

**Key takeaway**: Initialization logs ≠ Working feature. Always validate end-to-end.

---

## Current Status

**Project**: omni-ai (Intelligent Investigation Agent Platform)
**Framework**: Mastra.ai + Next.js 16
**Architecture**: Next.js web app + Mastra agents (integrated) + omni-api-mcp (MCP protocol)
**Status**: All 5 workstreams complete, full-featured chat interface with command palette, progress tracking, and transparency hints

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

### Completed (WS2: OAuth2 Hybrid Providers) ✅

- [x] Client-safe provider configuration system
- [x] Provider store with runtime switching
- [x] OAuth2Gateway implementation (for future server-side use)
- [x] Settings panel with provider/model selectors
- [x] Chat header with model selector
- [x] shadcn/ui components installed
- [x] Tailwind CSS v4 theme configuration
- [x] Runtime model switching without restart
- [x] localStorage persistence for selections

**Architecture Note**: Provider metadata lives client-side (lib/config/provider-config.ts), actual provider instantiation happens server-side in API routes (WS4).

### Completed (WS3: MCP Integration) ✅

- [x] @mastra/mcp package installed (v0.23.3)
- [x] MCP client manager created (lib/mcp/mcp-client.ts)
- [x] 5 MCP tools wrapped for Mastra (discover_datasets, build_query, call_rest_api, call_graphql, summarize_multi_api_results)
- [x] Test agent created (lib/mastra/test-agent.ts)
- [x] Test API route created (app/api/test-mcp/route.ts)
- [x] ToolCallCard component created (components/tool-call-card.tsx)
- [x] Tool call store created (lib/stores/tool-call-store.ts)
- [x] Badge and Card shadcn components installed
- [x] .env.local configured with OMNI_API_MCP_PATH
- [x] MCP integration verified and ready for agents

**Architecture Note**: MCP client connects to omni-api-mcp subprocess via stdio. All 5 core tools wrapped and ready for agent use.

### Completed (WS4: Agents + Workflows) ✅

- [x] Mastra instance configured with file-based LibSQL storage (.mastra/data.db)
- [x] DataDog Champion agent implemented (root cause analysis)
- [x] API Correlator agent implemented (cross-service correlation)
- [x] Smart Agent implemented (auto-router with intent detection)
- [x] DataDog Investigation workflow implemented (4-step orchestration)
- [x] Multi-API Correlation workflow implemented (5-step orchestration)
- [x] Workflows registered in Mastra instance
- [x] Agent store created with localStorage persistence
- [x] Chat interface built with message history
- [x] Chat API route created using Mastra memory
- [x] Agent selector added to chat header
- [x] Model selector integrated in chat header
- [x] Page updated to use ChatInterface
- [x] shadcn components installed (scroll-area, textarea)
- [x] End-to-end chat functionality tested

**Architecture Note**: Agents created dynamically at runtime to support provider/model switching. All agents follow 3-layer intelligence approach (templates → query builder → exploration fallback). Workflows use Mastra's createWorkflow() and createStep() pattern with proper input/output schemas.

### Completed (WS5: UI Polish) ✅

- [x] Command palette installed (shadcn command + dialog)
- [x] CommandPalette component implemented with Cmd+K shortcut
- [x] CommandPalette added to app layout (globally available)
- [x] Progress store created (lib/stores/progress-store.ts)
- [x] framer-motion and shadcn progress component installed
- [x] IterationProgress component built with animated progress bar
- [x] TransparencyHint component built with fade animations
- [x] ChatInterface updated with stop button and abort controller
- [x] Progressive transparency hints integrated (shows agent thinking)
- [x] IterationProgress added to page layout
- [x] Responsive design utilities added to globals.css
- [x] Accessibility improvements (ARIA labels on all interactive elements)
- [x] Dev server tested - all features working

**Architecture Note**: Command palette provides quick navigation to views, agents, and models. Progress tracking uses Zustand store for real-time UI updates. Transparency hints currently simulated (future enhancement: connect to Mastra streaming events). Stop button uses AbortController for graceful cancellation.

**Git Commits**:
- `78368b8` - feat(WS7): implement token optimization and agent configuration
- `bacb293` - feat(WS6): fix omni-api-mcp environment variable passing
- `8ff93c2` - security: remove .env.local from git tracking
- `126434c` - refactor: update providers to AI SDK v5 and improve chat API
- `364a77d` - feat(WS5): implement command palette, progress tracking, and transparency hints
- `4dc54d8` - chore: close WS5 and create WS6-WS8 workstreams (Mastra-first approach)
- `ccdbc8b` - feat(WS4): implement Mastra workflows for DataDog investigation and multi-API correlation
- `7745633` - chore: update checkpoint to mark WS4 complete and prepare for WS5
- `e45a048` - feat(WS4): implement 3 agents, chat interface, and Mastra memory integration
- `98dc937` - feat(WS3): complete MCP integration with tool wrappers and UI components

---

## Gap Analysis & New Workstreams

**Status**: WS1-WS5 complete, but production gaps identified (see `.claude-code/GAP_ANALYSIS.md`)

### Critical Issues Found

1. **Environment Variables**: omni-api-mcp subprocess can't access .env → auth failures
2. **Token Optimization**: Rate limit errors after 2-3 iterations (40K tokens/min)
3. **Streaming UI**: TransparencyHint/IterationProgress are simulated, not real

### Solution: WS6-WS8 (Mastra-First Approach)

All new workstreams focus on **using Mastra's built-in capabilities** instead of custom code.

---

## What's Next

### WS6: Environment Variable & MCP Configuration (P0 - CRITICAL)

**Status**: Not Started
**Duration**: 1-2 days
**Objective**: Fix omni-api-mcp env loading using Mastra's MCP patterns

**Approach**:
1. Query Mastra docs MCP server for environment handling
2. Implement Mastra's recommended pattern (env in server config)
3. Test with authenticated API calls

**Checkpoint**: `.claude-code/checkpoints/checkpoint-ws6-env-mcp-config.md`

---

### WS7: Token Optimization (P0 - CRITICAL)

**Status**: Not Started (blocked by WS6)
**Duration**: 2-3 days
**Objective**: Prevent rate limits using Mastra's Memory retention policies

**Approach**:
1. Query Mastra docs for Memory retention configuration
2. Use Mastra's retention policies (maxMessages, maxAge)
3. Configure agent token limits if Mastra supports

**Checkpoint**: `.claude-code/checkpoints/checkpoint-ws7-token-optimization.md`

---

### WS8: Real Streaming & Investigation UI (P1 - HIGH)

**Status**: Not Started (blocked by WS6+WS7)
**Duration**: 3-4 days
**Objective**: Connect UI to Mastra's agent streaming events

**Approach**:
1. Query Mastra docs for agent streaming API
2. Switch from `agent.generate()` to `agent.stream()`
3. Return Server-Sent Events (SSE) to client
4. Connect TransparencyHint/IterationProgress to real events

**Checkpoint**: `.claude-code/checkpoints/checkpoint-ws8-streaming-ui.md`

---

## Workstream Overview

### ✅ WS1: Mastra + Next.js Setup (COMPLETE)
- Bootstrap project with Next.js 16
- Activity Bar + basic layout
- Styling from omni-agent
- **Status**: ✅ Complete (2025-10-31)

### ✅ WS2: OAuth2 Hybrid Providers (COMPLETE)
- HybridProviderManager (Mastra + custom OAuth2)
- Runtime switching (provider in Settings, model in chat header)
- **Status**: ✅ Complete (2025-10-31)

### ✅ WS3: MCP Integration (COMPLETE)
- @mastra/mcp setup
- Connect to omni-api-mcp
- Test tool calling
- **Status**: ✅ Complete (2025-10-31)
- **Dependencies**: WS1 ✅, WS2 ✅

### ✅ WS4: Agents + Workflows (COMPLETE)
- 3 agents (DataDog Champion, API Correlator, Smart Agent)
- Chat interface with Mastra Memory
- Agent selector UI
- **Status**: ✅ Complete (2025-10-31)
- **Dependencies**: WS1 ✅, WS2 ✅, WS3 ✅

### ✅ WS5: UI Polish (COMPLETE)
- Command palette (Cmd+K)
- Iteration progress bar
- Progressive transparency hints
- Stop button with AbortController
- Accessibility improvements
- **Status**: ✅ Complete (2025-10-31)
- **Dependencies**: WS1 ✅, WS2 ✅, WS3 ✅, WS4 ✅

### ✅ WS6: Environment & MCP Config (COMPLETE)
- Fix omni-api-mcp env variable loading
- Use Mastra's MCP configuration patterns
- Test authenticated API calls
- **Status**: ✅ Complete (2025-10-31)
- **Dependencies**: WS3 ✅
- **Priority**: P0 (CRITICAL - Blocker)
- **Solution**: Added `env: process.env` to MCPClient server config
- **Verification**: omni-api-mcp subprocess starts successfully with 16 services loaded

### ✅ WS7: Token Optimization & Agent Configuration (COMPLETE)
- Expand system instructions to 1,800+ tokens for prompt caching
- Add agent configuration UI with per-provider/model settings
- Implement workaround for Mastra prompt caching bug
- Configure MCP tool cacheControl
- **Status**: ✅ Complete (2025-10-31)
- **Dependencies**: WS4 ✅, WS6 ✅
- **Priority**: P0 (CRITICAL - Blocker)
- **Solution**:
  - Expanded all agent instructions to ~1,800 tokens (above 1,024 caching threshold)
  - Added agent config store for runtime customization
  - Implemented cacheControl workaround in chat API route
  - Added MCP tool cacheControl configuration
- **Known Issues**:
  - Mastra bug: providerOptions not passed to AI SDK
  - Workaround in place until upstream fix
- **Git Commit**: `78368b8` - feat(WS7): implement token optimization and agent configuration

### ⏳ WS8: Real Streaming & Investigation UI (PENDING)
- Use Mastra agent streaming API
- Server-Sent Events (SSE) to client
- Connect UI to real events
- **Status**: ⏳ Pending (blocked by WS6+WS7)
- **Dependencies**: WS4 ✅, WS5 ✅
- **Priority**: P1 (HIGH)

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

**UI Components:**
- shadcn/ui (select, dropdown-menu, button, label)
- @radix-ui/react-icons
- lucide-react 0.548.0

**Mastra (Integrated):**
- @mastra/core 0.23.3
- @mastra/memory 0.15.10
- @mastra/libsql 0.16.1
- @mastra/mcp (to be added in WS3)

---

## Verification Commands

**Check WS2 completion:**
```bash
npm run dev
# ✓ Server starts at http://localhost:3000
# ✓ Activity Bar appears
# ✓ Chat/Settings view switching works
# ✓ Settings panel shows provider/model selectors
# ✓ Chat header shows model selector
# ✓ Dark mode active
# ✓ No console errors
```

**Verify git history:**
```bash
git log --oneline
# 1b41900 feat(WS2): complete provider infrastructure and UI components
# b18875a feat(WS2): implement provider infrastructure - standard providers and OAuth2 gateway
# 4919aad chore: update checkpoint to mark WS1 complete and prepare for WS2
# 71b5060 feat: complete WS1 - Next.js 16 + Mastra + Tailwind v4 setup
# 95c61d2 docs: update Next.js 14 to Next.js 15 across all documentation
```

---

## 🔬 Research Phase: Claude Agent SDK Migration

**Status**: Planning comprehensive migration from Mastra to Claude Agent SDK
**Duration**: Research (2-3 days) → Implementation (3-4 weeks)

### Rationale for Migration

Based on comprehensive research and user clarification:

1. **✅ Runtime provider switching not required** - omni-ai will be a bundled local application where users set provider once and restart to change (standard desktop app UX)

2. **✅ Prompt caching works natively** - No workarounds needed like current Mastra bug

3. **✅ Production-ready stability** - Built by Anthropic vs community project

4. **✅ Rich built-in tools** - Read, Write, Bash, WebSearch, Grep, etc.

5. **✅ stdio MCP support** - Works with omni-api-mcp as-is

6. **✅ Custom gateway support** - `ANTHROPIC_BASE_URL` environment variable for enterprise OAuth2 gateways

### Scope of Research

**Required Documentation** (to be created):

1. **Mastra Parity Analysis**
   - Agent system (3 agents: DataDog Champion, API Correlator, Smart Agent)
   - Workflow orchestration (multi-step investigations)
   - Session management & persistence
   - Token optimization & memory management

2. **Custom Provider Integration**
   - Enterprise OAuth2 gateway setup
   - Multi-LLM support (Azure, AWS, GCP)
   - baseURL configuration patterns

3. **MCP Integration Strategy**
   - stdio transport with omni-api-mcp
   - Tool definition & execution
   - Error handling & retries

4. **UI Enhancements**
   - Smart message formatting
   - Code block rendering
   - Tool call visualization
   - Streaming progress indicators

5. **Distribution Strategy**
   - Bundling omni-ai + omni-api-mcp
   - MCP registry integration
   - User installation guide

### Workstreams to Create

- WS8: Claude Agent SDK Foundation & MCP Integration
- WS9: Agent Migration (3 agents)
- WS10: Custom Provider & Enterprise Gateway
- WS11: Session Management & Persistence Layer
- WS12: UI Polish & Smart Message Display
- WS13: Distribution & Bundling

---

## Context for Next Session

**You are in Research Phase!**

1. **First action**: Comprehensive research of Claude Agent SDK capabilities
2. **Use MCP servers**: Query Mastra docs MCP and shadcn MCP for information
3. **Create documentation**: Detailed workstream checkpoints for WS8-WS13
4. **Include links**: All supporting research documents and external references

**Research Areas**:
- Claude Agent SDK TypeScript API (full reference)
- Session management & persistence patterns
- MCP stdio integration examples
- Enterprise gateway configuration
- shadcn UI components for chat interfaces
- Distribution/bundling strategies for Electron/Tauri

**Deliverables**:
- 6 workstream checkpoint files (WS8-WS13)
- Supporting research documents
- Migration guide from Mastra to Claude Agent SDK
- Timeline and effort estimates

**Timeline**:
- WS1-WS7: ✅ Complete (Mastra-based foundation)
- Research Phase: 2-3 days
- WS8-WS13: 3-4 weeks (Claude Agent SDK migration)
- **Total**: 4-5 weeks to production

---

**Last Updated**: 2025-10-31
**Current Checkpoint**: WS7 complete ✅ → Research Phase
**Next Phase**: Comprehensive Claude Agent SDK migration planning
**Git Commit**: `78368b8` - feat(WS7): implement token optimization and agent configuration
