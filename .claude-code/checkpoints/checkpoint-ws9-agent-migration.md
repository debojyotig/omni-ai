# WS9: Agent Migration with Sub-agents

**Status**: Not Started
**Duration**: 1-2 days (SIMPLIFIED - no wrapper needed!)
**Dependencies**: WS8 complete
**Priority**: P0 (CRITICAL)

---

## Objective

Migrate all 3 agents (Smart Agent, DataDog Champion, API Correlator) to Claude Agent SDK using **native sub-agents** for automatic delegation. No custom wrapper classes needed!

**Key Discovery**: Claude SDK's sub-agents replace both Mastra's Agent class AND workflow orchestration with automatic delegation based on descriptions.

---

## Tasks

### Task 1: Configure Sub-agents (4-6 hours)

**Goal**: Define 3 sub-agents with clear descriptions and tool restrictions

```typescript
// lib/agents/subagent-configs.ts
export const subAgentConfigs = {
  'datadog-champion': {
    description: `Expert at DataDog investigations: error analysis, trace correlation, latency debugging, and deployment correlation.

Use when:
- User asks about errors, failures, or exceptions
- Investigating performance issues or latency
- Analyzing service health or availability
- Correlating errors with deployments

Capabilities:
- Queries DataDog error logs
- Analyzes error rate trends
- Fetches related traces
- Correlates timeline with deployments
- Performs 8-step root cause analysis`,

    prompt: DATADOG_CHAMPION_INSTRUCTIONS, // 1,800 tokens from Mastra version

    tools: [
      'mcp__omni-api__discover_datasets',
      'mcp__omni-api__build_query',
      'mcp__omni-api__call_rest_api',
      'mcp__omni-api__summarize_multi_api_results'
    ]
  },

  'api-correlator': {
    description: `Expert at cross-service data correlation and consistency verification across multiple APIs.

Use when:
- User needs data from 2+ different services
- Investigating data inconsistencies
- Merging results from multiple sources
- Validating data consistency

Capabilities:
- Calls multiple APIs in parallel
- Correlates data by common keys
- Detects inconsistencies
- Merges results intelligently`,

    prompt: API_CORRELATOR_INSTRUCTIONS, // 1,800 tokens

    tools: [
      'mcp__omni-api__call_rest_api',
      'mcp__omni-api__call_graphql',
      'mcp__omni-api__summarize_multi_api_results'
    ]
  },

  'general-investigator': {
    description: `General-purpose API investigation agent for queries that don't fit DataDog or correlation patterns.

Use when:
- Exploring available APIs
- General data fetching
- Simple single-API queries
- User asks "what APIs are available?"

Capabilities:
- Service discovery
- API exploration
- Simple queries
- Documentation lookup`,

    prompt: GENERAL_INVESTIGATOR_INSTRUCTIONS, // 1,800 tokens

    tools: [
      'mcp__omni-api__discover_datasets',
      'mcp__omni-api__build_query',
      'mcp__omni-api__call_rest_api',
      'mcp__omni-api__call_graphql'
    ]
  }
};
```

**Key Instructions to Extract** (from existing Mastra agents):
```bash
# Read current agent instructions
cat src/mastra/agents/datadog-champion.ts | grep -A 200 "instructions"
cat src/mastra/agents/api-correlator.ts | grep -A 200 "instructions"
cat src/mastra/agents/smart-agent.ts | grep -A 200 "instructions"
```

**Validation**:
- [ ] All 3 sub-agent configs defined
- [ ] Descriptions clearly specify when to use each
- [ ] Tool restrictions match capabilities
- [ ] Instructions copied from Mastra versions

---

### Task 2: Implement Main Orchestrator (2-3 hours)

**Goal**: Create main query handler that automatically delegates to sub-agents

```typescript
// app/api/chat/route.ts
import { query } from '@anthropic-ai/claude-agent-sdk';
import { omniApiMcpConfig } from '@/lib/mcp/claude-sdk-mcp-config';
import { subAgentConfigs } from '@/lib/agents/subagent-configs';

const MASTER_ORCHESTRATOR_INSTRUCTIONS = `You are the Master Orchestrator for omni-ai, an intelligent investigation platform.

Your role:
1. Analyze user queries to understand intent
2. Automatically delegate to appropriate sub-agents:
   - datadog-champion: For error analysis, performance issues, service health
   - api-correlator: For multi-API data correlation
   - general-investigator: For API exploration and simple queries
3. Coordinate responses from multiple sub-agents if needed
4. Present unified results to the user

Always explain which sub-agent you're delegating to and why.`;

export async function POST(req: Request) {
  const { message, sessionId } = await req.json();

  const result = query({
    prompt: message,
    options: {
      resume: sessionId, // Resume existing conversation or undefined for new
      systemPrompt: MASTER_ORCHESTRATOR_INSTRUCTIONS,
      agents: subAgentConfigs,
      mcpServers: {
        'omni-api': omniApiMcpConfig
      },
      maxTurns: 10
    }
  });

  // Stream to client
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const msg of result) {
          // Send each chunk as SSE
          const data = `data: ${JSON.stringify(msg)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

**Why This Works**:
- Claude SDK automatically delegates based on sub-agent descriptions
- No manual routing logic needed
- Sub-agents can work in parallel
- Maintains session context via `resume`

**Validation**:
- [ ] API route compiles
- [ ] Streaming works
- [ ] Sub-agent delegation automatic
- [ ] Session resumption works

---

### Task 3: Test Sub-agent Delegation (2-3 hours)

**Test Cases**:

```typescript
// temp-test-ws9-subagents.ts
async function testSubAgentDelegation() {
  // Test 1: DataDog Champion delegation
  const test1 = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: 'Why are we seeing 500 errors in payment-service?'
    })
  });
  // Expected: Delegates to datadog-champion
  // Should perform 8-step investigation

  // Test 2: API Correlator delegation
  const test2 = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: 'Compare user data from GitHub and DataDog'
    })
  });
  // Expected: Delegates to api-correlator
  // Should call both APIs and correlate

  // Test 3: General investigation
  const test3 = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: 'What APIs are available?'
    })
  });
  // Expected: Delegates to general-investigator
  // Should use discover_datasets

  // Test 4: Multi-sub-agent coordination
  const test4 = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: 'Find all errors across services and correlate with GitHub deployments'
    })
  });
  // Expected: Uses both datadog-champion AND api-correlator
  // Should coordinate responses
}

testSubAgentDelegation().catch(console.error);
```

**Validation Checklist**:
- [ ] DataDog queries → datadog-champion
- [ ] Multi-API queries → api-correlator
- [ ] General queries → general-investigator
- [ ] Multi-step investigations complete
- [ ] No rate limit errors (caching works)
- [ ] Tool calls execute correctly

---

### Task 4: Update UI Agent Selector (1-2 hours)

**Keep existing UI, map to sub-agents**:

```typescript
// lib/stores/agent-store.ts
export type AgentId = 'datadog-champion' | 'api-correlator' | 'smart-agent';

export interface AgentInfo {
  id: AgentId;
  name: string;
  description: string;
  icon: string;
}

export const agents: Record<AgentId, AgentInfo> = {
  'datadog-champion': {
    id: 'datadog-champion',
    name: 'DataDog Champion',
    description: 'Root cause analysis for errors, latency, and availability',
    icon: 'activity'
  },
  'api-correlator': {
    id: 'api-correlator',
    name: 'API Correlator',
    description: 'Cross-service data correlation and consistency checks',
    icon: 'network'
  },
  'smart-agent': {
    id: 'smart-agent',
    name: 'Smart Agent',
    description: 'Auto-routing intelligent agent (uses all sub-agents)',
    icon: 'brain'
  }
};

export const useAgentStore = create<AgentStore>()(
  persist(
    (set, get) => ({
      selectedAgentId: 'smart-agent',
      setSelectedAgent: (id: AgentId) => set({ selectedAgentId: id }),
      getAgentInfo: (id: AgentId) => agents[id]
    }),
    { name: 'agent-store' }
  )
);
```

**Update API route to handle agent selection**:
```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { message, sessionId, agentId } = await req.json();

  let systemPrompt = MASTER_ORCHESTRATOR_INSTRUCTIONS;
  let agentsConfig = subAgentConfigs;

  // If user selected specific agent, constrain delegation
  if (agentId && agentId !== 'smart-agent') {
    systemPrompt = `You are ${agentId}. ${subAgentConfigs[agentId].prompt}`;
    agentsConfig = undefined; // Don't allow delegation
  }

  const result = query({
    prompt: message,
    options: {
      resume: sessionId,
      systemPrompt,
      agents: agentsConfig,
      mcpServers: { 'omni-api': omniApiMcpConfig },
      maxTurns: 10
    }
  });

  // ... streaming code
}
```

**Validation**:
- [ ] Agent selector UI works
- [ ] Selecting specific agent constrains behavior
- [ ] Smart Agent uses all sub-agents
- [ ] localStorage persistence works

---

### Task 5: Add Hallucination Reduction (1-2 hours)

**Per user request**: Integrate hallucination reduction techniques from Claude docs

**Reference**: https://docs.claude.com/en/docs/test-and-evaluate/strengthen-guardrails/reduce-hallucinations

**Implementation**:
```typescript
// lib/agents/hallucination-reduction.ts
export const HALLUCINATION_REDUCTION_PROMPT = `
IMPORTANT: Follow these rules to ensure accuracy:

1. **Cite Sources**: Always reference which API/tool provided each piece of information
2. **Express Uncertainty**: Use "likely", "appears to be", "based on..." when uncertain
3. **Verify Before Claiming**: Don't make statements about data without checking the tool results
4. **Cross-Reference**: When possible, verify information across multiple sources
5. **Acknowledge Limitations**: If data is incomplete or unavailable, say so explicitly
6. **Separate Facts from Inference**: Clearly distinguish between:
   - Direct observations from API responses
   - Your analysis or interpretation
   - Speculative conclusions

Example:
✅ GOOD: "Based on the DataDog API response, there were 1,247 errors at 2:45 PM. This correlates with the deployment timestamp from GitHub (v2.3 deployed at 2:40 PM), suggesting a possible connection."

❌ BAD: "The deployment caused the errors." (unverified causation)
`;

// Add to all sub-agent prompts
export const enhancedSubAgentConfigs = Object.entries(subAgentConfigs).reduce(
  (acc, [key, config]) => ({
    ...acc,
    [key]: {
      ...config,
      prompt: `${config.prompt}\n\n${HALLUCINATION_REDUCTION_PROMPT}`
    }
  }),
  {}
);
```

**Validation**:
- [ ] Agents cite API sources
- [ ] Uncertainty expressed appropriately
- [ ] Facts separated from inference
- [ ] No unsupported claims

---

## Success Criteria

**Must Have**:
- ✅ All 3 sub-agents configured
- ✅ Automatic delegation works
- ✅ Multi-step investigations complete
- ✅ No rate limit errors (caching works)
- ✅ Tool calling reliable
- ✅ Hallucination reduction integrated

**Nice to Have**:
- ✅ Parallel sub-agent execution
- ✅ Better error messages
- ✅ Streaming UI updates

---

## Why This Is Simpler Than Planned

### Original Plan (5-7 days):
1. Build ClaudeAgent wrapper class
2. Implement generate() and stream() methods
3. Handle session management manually
4. Migrate each agent separately
5. Build custom orchestration logic

### New Plan (1-2 days):
1. Define sub-agent configs with descriptions
2. Use query() directly with agents option
3. Let SDK handle delegation automatically
4. Session management via resume option

**Time Saved**: 3-5 days ✨

**Complexity Reduced**:
- No wrapper class to maintain
- No custom orchestration code
- No manual session handling
- Native SDK features throughout

---

## References

- **Sub-agents Documentation**: https://docs.claude.com/en/api/agent-sdk/subagents
- **Streaming vs Single Mode**: https://docs.claude.com/en/api/agent-sdk/streaming-vs-single-mode
- **Hallucination Reduction**: https://docs.claude.com/en/docs/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
- **Parity Analysis**: [docs/MASTRA_PARITY_ANALYSIS.md](../../docs/MASTRA_PARITY_ANALYSIS.md)
- **WS8 Foundation**: [checkpoint-ws8-claude-sdk-foundation.md](./checkpoint-ws8-claude-sdk-foundation.md)
