# omni-ai: Intelligent Investigation Agent Platform

> **Project Type**: AI-powered investigation platform using Mastra.ai framework
> **Architecture**: Next.js 15 web app + Mastra agents + omni-api-mcp integration
> **Purpose**: Multi-step investigations across 30+ enterprise APIs

## What This Project Is

**omni-ai** performs intelligent, multi-step investigations automatically:

**Example**:
```
User: "Why are we seeing 500 errors in payment-service?"

omni-ai: [Executes 8-step investigation automatically]
  ✅ Discovers DataDog capabilities
  ✅ Queries error logs (found 1,247 errors)
  ✅ Analyzes error rate trend (+850% spike at 2:45 PM)
  ✅ Fetches related traces
  ✅ Checks recent deployments (v2.3 deployed at 2:40 PM)
  ✅ Correlates timeline
  ✅ Root Cause: "New payment validation timing out after v2.3 deployment"

Time: 45 minutes → 2 minutes
```

**Three Intelligent Agents**:
1. **DataDog Champion**: Root cause analysis (errors, latency, availability)
2. **API Correlator**: Cross-service data correlation and consistency checks
3. **Smart Agent**: Auto-detects intent, routes to appropriate workflow

**Key Innovation**: Uses **Mastra.ai** framework (example: fromolive.com) for agent orchestration + **omni-api-mcp** for API integrations.

---

## System Architecture

```
┌──────────────────────────────────────────────────┐
│ Next.js Web App (Browser)                       │
│ ┌──────────────────────────────────────────────┐ │
│ │ Activity Bar + Main Content (No Sidebars)    │ │
│ │ - Chat view (agent selector, model selector) │ │
│ │ - Settings view (provider/model config)      │ │
│ │ - Command palette (Cmd+K)                    │ │
│ │ - Progressive transparency hints             │ │
│ └────────────────┬─────────────────────────────┘ │
└──────────────────┼──────────────────────────────┘
                   │ HTTP/SSE
┌──────────────────▼──────────────────────────────┐
│ Next.js API Routes (Server)                     │
│ ┌──────────────────────────────────────────────┐ │
│ │ Mastra Orchestration (ALL Features)          │ │
│ │ - Agent class (3 agents)                     │ │
│ │ - createWorkflow() (2 workflows)             │ │
│ │ - Tools system (MCP integration)             │ │
│ │ - Memory & context management                │ │
│ │ - Providers (Mastra + custom OAuth2)         │ │
│ │ - RuntimeContext (switch provider/model)     │ │
│ └────────────────┬─────────────────────────────┘ │
│                  │                                │
│ ┌────────────────▼─────────────────────────────┐ │
│ │ MCPClient (@mastra/mcp)                      │ │
│ └────────────────┬─────────────────────────────┘ │
└──────────────────┼──────────────────────────────┘
                   │ MCP Protocol (stdio)
┌──────────────────▼──────────────────────────────┐
│ omni-api-mcp (External MCP Server)              │
│ - discover_datasets (service catalog)           │
│ - build_query (60+ templates, 98% accurate)     │
│ - call_rest_api / call_graphql                  │
│ - summarize_multi_api_results (correlation)     │
│ - 30+ API integrations                          │
└──────────────────────────────────────────────────┘
```

---

## Project Structure

```
~/code/omni-ai/
├── .claude-code/
│   ├── checkpoints/
│   │   ├── checkpoint-ws1-mastra-nextjs-setup.md
│   │   ├── checkpoint-ws2-oauth2-providers.md
│   │   ├── checkpoint-ws3-mcp-integration.md
│   │   ├── checkpoint-ws4-agents-workflows.md
│   │   └── checkpoint-ws5-ui-polish.md
│   ├── references/
│   │   ├── omni-agent-codebase.md          # Reference to omni-agent UI/patterns
│   │   └── mastra-mcp-best-practices.md    # MCP integration patterns
│   ├── CHECKPOINT.md
│   └── PROGRESS.md
├── docs/
│   ├── APP_VISION.md                        # ✅ Simple app idea explanation
│   └── [7 more technical docs - create as needed]
├── src/
│   └── mastra/                              # ✅ OFFICIAL MASTRA STRUCTURE
│       ├── agents/
│       │   ├── datadog-champion.ts          # Root cause analysis agent
│       │   ├── api-correlator.ts            # Cross-service correlation agent
│       │   └── smart-agent.ts               # Auto-routing smart agent
│       ├── tools/
│       │   └── [MCP tools auto-loaded from omni-api-mcp via index.ts]
│       ├── workflows/
│       │   ├── datadog-investigation.ts     # DataDog investigation workflow
│       │   └── multi-api-correlation.ts     # Multi-API correlation workflow
│       ├── mcp/
│       │   └── omni-api-client.ts           # MCPClient for omni-api-mcp
│       └── index.ts                         # ✅ Main Mastra entry point (config + export)
├── app/                                     # Next.js 15 App Router
│   ├── api/
│   │   └── chat/route.ts                    # Streaming chat endpoint
│   ├── page.tsx                             # Main chat interface
│   └── layout.tsx                           # Activity Bar + Main Content layout
├── components/
│   ├── ui/                                  # shadcn components (from omni-agent)
│   ├── activity-bar.tsx                     # 72px left bar (Chat, Settings)
│   ├── chat-interface.tsx                   # Main chat UI
│   ├── chat-header.tsx                      # Agent + model selectors
│   ├── settings-panel.tsx                   # Provider configuration
│   ├── tool-call-card.tsx                   # MCP tool visualization
│   ├── iteration-progress.tsx               # Progress bar during investigation
│   ├── transparency-hint.tsx                # One-liner fade hints
│   └── command-palette.tsx                  # Cmd+K
├── lib/                                     # Non-Mastra utilities
│   ├── auth/
│   │   └── oauth2-gateway.ts                # OAuth2 token management
│   ├── providers/
│   │   ├── standard-providers.ts            # Mastra providers (OpenAI, Anthropic)
│   │   ├── custom-providers.ts              # OAuth2 providers (Azure, AWS, GCP)
│   │   └── hybrid-manager.ts                # Unified provider manager
│   └── stores/
│       ├── view-store.ts                    # Zustand - Active view (chat/settings)
│       ├── agent-store.ts                   # Zustand - Selected agent
│       ├── provider-store.ts                # Zustand - Selected provider/model
│       ├── progress-store.ts                # Zustand - Iteration progress
│       └── tool-call-store.ts               # Zustand - Tool call history
├── .env.example
├── .gitignore
├── .mcp.json                                # MCP servers (Mastra docs + shadcn)
├── CLAUDE.md                                # This file
├── README.md
├── package.json
└── tsconfig.json
```

---

## Current Status

**Phase**: Bootstrap & Documentation ✅ Complete

### Completed
- [x] Architecture design (Activity Bar + Main Content, no sidebars)
- [x] Mastra feasibility research (MCP integration verified)
- [x] OAuth2 hybrid design (Mastra + custom providers)
- [x] APP_VISION.md (simple app idea explanation)
- [x] Complete implementation plan (5 workstream checkpoints)

### Next Steps (Implementation Phase)
1. **WS1**: Mastra + Next.js Setup (2-3 days)
2. **WS2**: OAuth2 Hybrid Providers (3-4 days)
3. **WS3**: MCP Integration (2-3 days)
4. **WS4**: 3 Agents + 2 Workflows (1-2 weeks)
5. **WS5**: UI Polish (Command palette, progress bar, transparency) (1 week)

**Total Timeline**: 6 weeks to production MVP

---

## Technology Stack

**Framework & Runtime:**
- Next.js 15 (App Router, not Pages Router)
- Node.js 18+, TypeScript 5

**Agent Orchestration** (ALL Mastra features):
- @mastra/core - Agent, Workflow, Tools, Memory, Providers
- @mastra/mcp - MCP protocol integration
- RuntimeContext - Switch provider/model at runtime (no restart)

**UI/UX** (Exact copy from omni-agent):
- shadcn/ui components
- lucide-react icons
- Tailwind CSS + HSL variables (from omni-agent)
- Inter font
- framer-motion (animations)

**State Management:**
- Zustand with localStorage persistence

**Authentication:**
- Custom OAuth2 (Azure, Bedrock, Vertex) + Mastra providers (OpenAI, Anthropic)

**Development Tools** (MCP servers in `.mcp.json`):
- **@mastra/mcp-docs-server** - Mastra documentation and examples during implementation
- **shadcn MCP** - Install and search shadcn/ui components on-the-fly

---

## Layout: Activity Bar + Main Content (No Sidebars)

```
┌────┬──────────────────────────────────────┐
│ A  │  Main Content                       │
│ c  │  ┌────────────────────────────────┐ │
│ t  │  │ Chat Interface                 │ │
│ i  │  │ - Agent selector (3 agents)    │ │
│ v  │  │ - Model selector (header)      │ │
│ i  │  │ - Message list (virtual scroll)│ │
│ t  │  │ - Tool call cards              │ │
│ y  │  │ - Progressive hints (fade)     │ │
│    │  │ - Progress bar                 │ │
│ B  │  │ - Message input                │ │
│ a  │  └────────────────────────────────┘ │
│ r  │  OR                                  │
│    │  ┌────────────────────────────────┐ │
│ 7  │  │ Settings Panel                 │ │
│ 2  │  │ - Provider selector            │ │
│ p  │  │ - Model configuration          │ │
│ x  │  │ - OAuth2 fields                │ │
│    │  └────────────────────────────────┘ │
└────┴──────────────────────────────────────┘
```

**Views**:
- Chat (MessageSquare icon)
- Settings (Settings icon)

**No sidebars** - Simplified from omni-agent's 3-column layout

---

## Key Design Decisions

1. **Complete rewrite** - Abandon omni-agent Electron, use Mastra + Next.js
2. **Next.js first** - Web app (simpler than Electron), fallback to Electron if memory issues
3. **ALL Mastra features** - Agent, Workflow, Tools, Memory, Providers, RuntimeContext
4. **Hybrid providers** - Mastra (standard) + custom OAuth2 (enterprise)
5. **Runtime switching** - Provider in Settings, Model in chat header (no restart)
6. **Exact omni-agent styling** - Copy HSL colors, Tailwind config, shadcn components
7. **3 agents** - DataDog Champion, API Correlator, Smart Agent (auto-router)
8. **Progressive transparency** - One-liner hints before tool calls (fades away)
9. **Command palette** - Cmd+K for quick actions
10. **MCP integration** - Consume omni-api-mcp tools via @mastra/mcp

---

## Features

### Chat Interface
- ✅ Agent selector dropdown (3 agents)
- ✅ Model selector dropdown (runtime switching, chat header)
- ✅ Message list (virtual scroll, simplified from omni-agent)
- ✅ Tool call cards (reused from omni-agent design)
- ✅ Progressive transparency hints (NEW: one-liner above input, fades)
- ✅ Iteration progress bar with stop button (NEW)
- ✅ Message input

### Settings Panel
- ✅ Provider selector (Azure, OpenAI, Anthropic, Custom)
- ✅ Model configuration (checkboxes for available models)
- ✅ OAuth2 configuration (for custom providers)
- ✅ Save to localStorage

### Command Palette (Cmd+K)
- ✅ Switch agents
- ✅ Change provider/model
- ✅ Open settings

---

## Related Projects

### omni-api-mcp (../omni-api-mcp)
**Status**: Production-ready MCP server
**Purpose**: Provides primitive MCP tools consumed by omni-ai

**Tools provided**:
- `discover_datasets` - Service catalog (95% complete)
- `build_query` - Natural language → API query (98% complete, 60+ templates)
- `call_rest_api`, `call_graphql` - Execute API calls
- `summarize_multi_api_results` - Cross-API correlation

**Integration**: omni-ai consumes these tools via @mastra/mcp package

### omni-agent (/Users/debojyoti.ghosh/code/omni-agent)
**Status**: DEPRECATED (used as reference only)
**Purpose**: Reference for UI/UX patterns, styling, components

**What to copy from omni-agent:**
- Styling (Tailwind config, HSL colors, CSS variables)
- shadcn/ui components (ALL components in components/ui/)
- Activity Bar design (gradient backgrounds, hover effects)
- Tool call card component
- Message components
- Zustand store patterns
- OAuth2 token management logic (oauth2-manager.ts)

**What NOT to copy:**
- Agent orchestrator (we use Mastra)
- MCP client (we use @mastra/mcp)
- Electron code
- Investigation panel (we have simplified chat)
- Sidebar layout (we have no sidebars)

**Key Reference File**: `.claude-code/references/omni-agent-codebase.md` (see this for detailed guidance)

---

## For Claude Code: Implementation Guidelines

### When Starting Work

1. **Read current checkpoint**: `.claude-code/CHECKPOINT.md`
2. **Read active workstream**: `.claude-code/checkpoints/checkpoint-wsX-*.md`
3. **Reference omni-agent**: See `.claude-code/references/omni-agent-codebase.md`
4. **Use Mastra docs**: WebFetch https://mastra.ai/en/docs/ as needed
5. **Use shadcn MCP**: If available, use shadcn MCP server for UI components

### Mastra Documentation (WebFetch During Implementation)

**Core Concepts**:
- https://mastra.ai/en/docs/agents/overview - Agent class
- https://mastra.ai/en/docs/workflows/overview - createWorkflow()
- https://mastra.ai/en/docs/tools/overview - Tool system
- https://mastra.ai/en/docs/server-db/runtime-context - RuntimeContext

**MCP Integration**:
- https://mastra.ai/en/docs/integrations/overview
- Check GitHub: https://github.com/mastra-ai/mastra (examples/)

**Example App**: https://fromolive.com (built with Mastra)

### What to Copy from omni-agent

**Files to reference directly**:
```
Styling:
- /Users/debojyoti.ghosh/code/omni-agent/tailwind.config.js
- /Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/styles/globals.css

Components:
- /Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/components/activity-bar.tsx
- /Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/components/tool-call-card.tsx
- /Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/components/ui/* (ALL shadcn components)

Stores:
- /Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/store/chat-store.ts
- /Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/store/settings-store.ts

OAuth2 Logic:
- /Users/debojyoti.ghosh/code/omni-agent/src/lib/auth/oauth2-manager.ts
- /Users/debojyoti.ghosh/code/omni-agent/src/lib/llm/universal-client.ts (pattern only)
```

**How to use shadcn MCP server** (if available):
```bash
# During implementation, Claude Code should use shadcn MCP for components
# This provides access to latest shadcn blocks, charts, themes
```

### Development Workflow

**Follow checkpoints sequentially**:
1. WS1: Mastra + Next.js setup → Activity Bar, basic layout, Mastra init
2. WS2: OAuth2 providers → HybridProviderManager, runtime switching
3. WS3: MCP integration → MCPClient, tool discovery, test with omni-api-mcp
4. WS4: Agents + workflows → 3 agents, 2 workflows, agent selector UI
5. WS5: UI polish → Command palette, progress bar, progressive transparency

**After each task**:
- ✅ Test feature works
- ✅ Verify styling matches omni-agent aesthetic
- ✅ Update checkpoint (mark task complete)
- ✅ Commit with descriptive message

---

## Testing Strategy

**After each workstream**:
```bash
npm run dev                    # Dev server at localhost:3000
# Test new features
# Verify styling in dark mode
# Check console for errors
```

**Integration testing**:
```bash
# Terminal 1: Build omni-api-mcp
cd ~/code/omni-api-mcp && npm run build

# Terminal 2: Run omni-ai
cd ~/code/omni-ai && npm run dev
```

**Before final delivery**:
- Test all 3 agents with real queries
- Test both workflows end-to-end
- Test provider/model switching (Settings + chat header)
- Test keyboard shortcuts (Cmd+K, etc.)
- Monitor browser memory usage (target: <500MB)

---

## Environment Variables

**`.env.local`** (create from .env.example):
```env
# MCP Server Path
OMNI_API_MCP_PATH=../omni-api-mcp/dist/index.js

# Standard Providers (via Mastra)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Custom OAuth2 Providers
AZURE_OPENAI_ENDPOINT=https://your-gateway.com
AZURE_TOKEN_ENDPOINT=https://login.microsoftonline.com/.../oauth2/v2.0/token
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...

AWS_BEDROCK_ENDPOINT=...
AWS_TOKEN_ENDPOINT=...

GCP_VERTEX_ENDPOINT=...
GCP_TOKEN_ENDPOINT=...
```

---

## Common Tasks

### Initialize Mastra Project (WS1 - First Step)
```bash
cd ~/code/omni-ai
npm create mastra@latest .
# Choose Next.js template
npm install @mastra/mcp zustand
npx shadcn@latest init
```

### Add shadcn Component
```bash
npx shadcn@latest add button card dialog dropdown-menu command
# Copy exact styling from omni-agent
```

### Reference omni-agent File
```bash
# Read a file for pattern/styling reference
cat /Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/components/activity-bar.tsx
```

### Test with omni-api-mcp
```bash
# Ensure omni-api-mcp is built
cd ~/code/omni-api-mcp && npm run build

# Run omni-ai
cd ~/code/omni-ai && npm run dev
```

---

## Success Criteria

### Phase 1: Foundation (WS1-WS3)
- [x] Next.js app runs with Mastra
- [x] Activity Bar with Chat/Settings views
- [x] OAuth2 providers (Mastra + custom)
- [x] MCP integration working (can call omni-api-mcp tools)
- [x] Styling matches omni-agent

### Phase 2: Intelligence (WS4)
- [x] DataDog Champion agent performs 8-step investigations
- [x] API Correlator agent correlates 2+ data sources
- [x] Smart Agent auto-routes to correct workflow
- [x] Query success rate ≥95% in ≤3 iterations

### Phase 3: Polish (WS5)
- [x] Command palette (Cmd+K) works
- [x] Progress bar shows real-time iteration status
- [x] Progressive hints fade smoothly
- [x] Memory usage <500MB for normal use

---

## Documentation

### Created (Bootstrap Phase)
- ✅ **APP_VISION.md** - Simple app idea and AI capabilities
- ✅ **CLAUDE.md** - This file (master context document)

### To Create (As Needed During Implementation)
- 📝 **ARCHITECTURE.md** - Detailed technical architecture
- 📝 **MASTRA_INTEGRATION.md** - How we use all Mastra features
- 📝 **OAUTH2_HYBRID_DESIGN.md** - Mastra + custom OAuth2 pattern
- 📝 **MCP_INTEGRATION_GUIDE.md** - @mastra/mcp usage
- 📝 **AGENTS_WORKFLOWS.md** - 3 agents + 2 workflows specifications
- 📝 **UI_UX_GUIDE.md** - Components, styling, progressive transparency
- 📝 **RUNTIME_SWITCHING.md** - Provider/model switching implementation

**Note**: Create these docs as needed during implementation. CLAUDE.md + APP_VISION.md provide sufficient context to start.

---

## Questions or Issues?

- **Architecture questions**: See `docs/APP_VISION.md` for high-level overview
- **Implementation blockers**: Check `.claude-code/CHECKPOINT.md` for current status
- **Progress tracking**: See `.claude-code/PROGRESS.md`
- **UI/UX patterns**: Reference omni-agent codebase (`.claude-code/references/omni-agent-codebase.md`)
- **Mastra questions**: WebFetch https://mastra.ai/en/docs/

---

## For Claude Code: Current Work Context

**Current Checkpoint**: See `.claude-code/CHECKPOINT.md`
**Active Workstream**: WS1 (Mastra + Next.js Setup)
**Next Action**: Run `npm create mastra@latest .` and follow WS1 checkpoint tasks

**References**:
- **App idea**: `docs/APP_VISION.md`
- **omni-agent patterns**: `.claude-code/references/omni-agent-codebase.md`
- **Mastra docs**: https://mastra.ai/en/docs/
- **Example app**: https://fromolive.com

**When starting implementation**:
1. Read `.claude-code/checkpoints/checkpoint-ws1-mastra-nextjs-setup.md`
2. Reference omni-agent for styling (`.claude-code/references/omni-agent-codebase.md`)
3. **Use MCP servers** (configured in `.mcp.json`):
   - **Mastra Docs Server** - Get Mastra documentation and examples
   - **shadcn MCP** - Install and search shadcn/ui components
4. WebFetch Mastra docs as needed (https://mastra.ai/en/docs/)
5. Test frequently (after each workstream task)
6. Update checkpoint when tasks complete

**Timeline**: 6 weeks to production MVP

**Status**: Ready to build! 🚀
