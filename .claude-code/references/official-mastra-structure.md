# Official Mastra Project Structure

**Source**: https://mastra.ai/en/docs/getting-started/project-structure
**Last Updated**: 2025-10-30

---

## ✅ OFFICIAL STRUCTURE (Adopted for omni-ai)

```
src/
└── mastra/
    ├── agents/           # Define and configure agents
    ├── tools/            # Create reusable tools
    ├── workflows/        # Multi-step workflows
    ├── scorers/          # (Optional) Performance evaluation
    ├── mcp/              # MCP integration
    ├── public/           # Static assets (copied to .build/output)
    └── index.ts          # Central entry point (Mastra config)
```

---

## Key Locations in omni-ai

### 1. Main Mastra Entry Point ✅
**File**: `src/mastra/index.ts`

**Purpose**: Central configuration and initialization

**Example**:
```typescript
import { Mastra } from '@mastra/core/mastra'
import { LibSQLStore } from '@mastra/libsql'
import { omniApiMcpClient } from './mcp/omni-api-client'

// Main Mastra instance
export const mastra = new Mastra({
  storage: new LibSQLStore({
    url: `file:${process.cwd()}/.mastra/data.db`
  }),
  mcpServers: [omniApiMcpClient]
})

// Export agents
export * from './agents/datadog-champion'
export * from './agents/api-correlator'
export * from './agents/smart-agent'
```

**What Goes Here**:
- Mastra instance creation
- Storage configuration (LibSQL)
- MCP server registration
- Global exports (agents, workflows, tools)

---

### 2. Agents ✅
**Folder**: `src/mastra/agents/`

**Files**:
- `datadog-champion.ts` - Root cause analysis agent
- `api-correlator.ts` - Cross-service correlation agent
- `smart-agent.ts` - Auto-routing smart agent

**Purpose**: Define agent behavior, goals, and tools

**Example**:
```typescript
// src/mastra/agents/datadog-champion.ts
import { Agent } from '@mastra/core'
import { Memory } from '@mastra/memory'
import { getOmniApiTools } from '../mcp/omni-api-client'

export async function createDataDogChampion(provider: any, model: string) {
  const tools = await getOmniApiTools()

  return new Agent({
    name: 'DataDog Champion',
    instructions: '...',
    model: { provider, name: model },
    tools,
    memory: new Memory()
  })
}
```

---

### 3. MCP Integration ✅
**Folder**: `src/mastra/mcp/`

**File**: `omni-api-client.ts`

**Purpose**: Configure MCPClient for omni-api-mcp

**Example**:
```typescript
import { MCPClient } from '@mastra/mcp'

export const omniApiMcpClient = new MCPClient({
  name: 'omni-api',
  command: 'node',
  args: [process.env.OMNI_API_MCP_PATH || '../omni-api-mcp/dist/index.js']
})

export async function getOmniApiTools() {
  return await omniApiMcpClient.getTools()
}
```

**What Goes Here**:
- MCPClient configuration
- Tool fetching helpers
- Toolset management (for multi-tenant)

---

### 4. Workflows ✅
**Folder**: `src/mastra/workflows/`

**Files**:
- `datadog-investigation.ts` - DataDog investigation workflow
- `multi-api-correlation.ts` - Multi-API correlation workflow

**Purpose**: Multi-step workflows orchestrating agents and tools

**Example**:
```typescript
// src/mastra/workflows/datadog-investigation.ts
import { createWorkflow } from '@mastra/core'

export const datadogInvestigation = createWorkflow({
  name: 'datadog-investigation',
  triggerSchema: z.object({
    service: z.string(),
    errorType: z.string(),
    timeRange: z.string()
  })
})
  .step(discoverServices)
  .step(queryErrors)
  .step(analyzePatterns)
  .step(checkDeployments)
  .step(synthesizeRootCause)
  .commit()
```

**What Goes Here**:
- Workflow definitions using `createWorkflow()`
- Step definitions
- Conditional and parallel execution logic

---

### 5. Tools ✅
**Folder**: `src/mastra/tools/`

**Purpose**: Reusable tools that agents can call

**For omni-ai**: Tools are **auto-loaded from omni-api-mcp** via MCP, so this folder may be empty or contain custom tools only.

**Example** (if adding custom tools):
```typescript
// src/mastra/tools/custom-parser.ts
import { createTool } from '@mastra/core'

export const customParserTool = createTool({
  id: 'custom_parser',
  description: 'Custom data parser',
  inputSchema: z.object({
    data: z.string()
  }),
  execute: async ({ context }) => {
    // Custom logic
    return { parsed: context.data }
  }
})
```

---

## Hybrid Structure for Next.js + Mastra

Since omni-ai is a Next.js app, we combine Mastra's structure with Next.js conventions:

```
src/
└── mastra/              # ✅ Official Mastra structure
    ├── agents/
    ├── tools/
    ├── workflows/
    ├── mcp/
    └── index.ts

app/                     # Next.js App Router
├── api/
├── page.tsx
└── layout.tsx

components/              # React components
├── ui/
├── activity-bar.tsx
└── ...

lib/                     # Non-Mastra utilities
├── auth/
├── providers/
└── stores/
```

**Why This Works**:
- `src/mastra/` follows official Mastra conventions
- `app/` follows Next.js App Router conventions
- `components/` follows React conventions
- `lib/` for non-Mastra code (auth, providers, stores)

---

## Import Patterns

### From Next.js components/pages:
```typescript
// app/api/chat/route.ts
import { mastra } from '@/src/mastra'
import { createSmartAgent } from '@/src/mastra/agents/smart-agent'

export async function POST(req: NextRequest) {
  const agent = await createSmartAgent('anthropic', 'claude-3-5-sonnet')
  // ...
}
```

### From Mastra agents:
```typescript
// src/mastra/agents/smart-agent.ts
import { getOmniApiTools } from '../mcp/omni-api-client'
import { mastra } from '../index'
```

### From lib utilities:
```typescript
// lib/providers/hybrid-manager.ts
import { mastra } from '@/src/mastra'
```

---

## Key Differences from Initial Structure

| Aspect | Initial (Wrong) | Official (Correct) |
|--------|----------------|-------------------|
| **Main folder** | `lib/mastra/` ❌ | `src/mastra/` ✅ |
| **Entry point** | `instance.ts` ❌ | `index.ts` ✅ |
| **Workflows** | Not separate ❌ | `workflows/` folder ✅ |
| **Tools** | Mixed with MCP ❌ | `tools/` folder ✅ |
| **Providers** | Inside mastra/ ❌ | `lib/providers/` (outside mastra) ✅ |

---

## Mastra's Philosophy

From the documentation:

> "Mastra is unopinionated about how you organize or colocate your files. The CLI provides sensible defaults, but you're free to adapt the structure to fit your workflow."

**For omni-ai**: We follow the official structure because:
1. ✅ Easier for future maintainers familiar with Mastra
2. ✅ Compatible with Mastra CLI tools
3. ✅ Clear separation: `src/mastra/` for agent logic, `lib/` for utilities
4. ✅ Works well with Next.js conventions

---

## Checklist for Implementation

### WS1 (Mastra + Next.js Setup):
- [ ] Create `src/mastra/` folder
- [ ] Create `src/mastra/index.ts` (not `instance.ts`)
- [ ] Create placeholder `agents/`, `tools/`, `workflows/`, `mcp/` folders

### WS2 (OAuth2 Providers):
- [ ] Create `lib/providers/` (outside `src/mastra/`)
- [ ] Create `lib/auth/oauth2-gateway.ts`

### WS3 (MCP Integration):
- [ ] Create `src/mastra/mcp/omni-api-client.ts`
- [ ] Register `omniApiMcpClient` in `src/mastra/index.ts`

### WS4 (Agents + Workflows):
- [ ] Create 3 agent files in `src/mastra/agents/`
- [ ] Create 2 workflow files in `src/mastra/workflows/`
- [ ] Export all from `src/mastra/index.ts`

---

## Reference Commands

### Create structure:
```bash
mkdir -p src/mastra/{agents,tools,workflows,mcp,public}
touch src/mastra/index.ts
```

### Build Mastra:
```bash
npx mastra build
# Output: .build/ folder
```

### Development:
```bash
npm run dev
# Next.js + Mastra running
```

---

**Last Updated**: 2025-10-30
**Status**: ADOPTED - All checkpoints updated to reflect official structure
**Source**: https://mastra.ai/en/docs/getting-started/project-structure
