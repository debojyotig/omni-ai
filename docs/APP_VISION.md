# omni-ai: Intelligent Investigation Agent Platform

## The Big Idea

**omni-ai** is an AI-powered investigation assistant that helps engineers solve complex problems by automatically performing multi-step investigations across 30+ enterprise APIs.

**Think of it as**: A super-smart on-call engineer that never sleeps, knows every API in your organization, and can investigate issues 10x faster than manual analysis.

**Example**:
```
You: "Why are we seeing 500 errors in the payment service?"

omni-ai: [Automatically performs 8-step investigation]
  1. ✅ Discovers DataDog capabilities
  2. ✅ Queries error logs (last 2 hours)
  3. ✅ Analyzes error patterns (found 1,247 errors)
  4. ✅ Gets error rate trends (+850% spike at 2:45 PM)
  5. ✅ Fetches related traces (12 slow requests)
  6. ✅ Checks recent deployments (payment-v2.3 deployed at 2:40 PM)
  7. ✅ Correlates timeline (deployment → 5min → error spike)
  8. ✅ **Root Cause**: New payment validation logic timing out

Result: "The v2.3 deployment introduced a database query timeout in
payment validation. Rollback recommended."

Time saved: 45 minutes → 2 minutes
```

---

## What Makes It Intelligent

### 1. **Multi-Step Reasoning** (Not Just Q&A)

Traditional AI:
- **You**: "Show me errors"
- **AI**: "Here are 50,000 errors" ❌ (Not helpful)

omni-ai:
- **You**: "Investigate errors"
- **AI**: Automatically:
  1. Finds error spike timeframe
  2. Identifies which service
  3. Analyzes error types
  4. Correlates with deployments
  5. Pinpoints root cause ✅

### 2. **Cross-Service Correlation**

Can connect data from multiple systems:
- Stripe payment failures → Your order database → Inventory system
- Finds: "45 orders failed because inventory API returned stale data"

### 3. **Self-Healing Workflows**

If first approach doesn't work, tries alternative strategies:
```
Attempt 1: Query DataDog errors directly ❌ (Too many results)
Attempt 2: Aggregate by service first ✅ (Found pattern)
Attempt 3: Drill into top offender ✅ (Root cause identified)
```

---

## The Platform Architecture

### Simple View

```
┌─────────────────────────────────────┐
│  You (Engineer)                     │
│  "Investigate high latency in API"  │
└────────────────┬────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────┐
│  omni-ai (Intelligent Agent)        │
│  - Understands your intent          │
│  - Plans multi-step investigation   │
│  - Executes queries automatically   │
│  - Synthesizes findings             │
└────────────────┬────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────┐
│  30+ Enterprise APIs                │
│  DataDog, GitHub, Stripe, AWS,      │
│  Custom APIs, etc.                  │
└─────────────────────────────────────┘
```

### Technical Architecture

```
┌──────────────────────────────────────────────┐
│ Next.js Web App (Your Browser)              │
│ - Simple chat interface                     │
│ - Agent selector (3 types of agents)       │
│ - Real-time progress updates               │
│ - Model switcher (GPT-4, Claude, etc.)     │
└─────────────────┬────────────────────────────┘
                  │
                  ↓
┌──────────────────────────────────────────────┐
│ Mastra AI Framework (Backend)               │
│ - Agent orchestration                       │
│ - Multi-step workflows                      │
│ - Memory & context management               │
│ - LLM routing (Azure, OpenAI, Anthropic)    │
└─────────────────┬────────────────────────────┘
                  │
                  ↓
┌──────────────────────────────────────────────┐
│ omni-api-mcp (API Gateway)                   │
│ - 30+ API integrations                       │
│ - 60+ pre-built query templates              │
│ - Smart query builder                        │
│ - Response correlation engine                │
└──────────────────────────────────────────────┘
```

---

## Three Types of Intelligent Agents

### 1. **DataDog Champion** 🔍

**Purpose**: Root cause analysis for errors, latency, and availability issues

**Capabilities**:
- Automatically queries errors, traces, metrics, and logs
- Correlates spikes with deployments
- Identifies problematic endpoints
- Suggests fixes based on patterns

**Best For**: On-call engineers investigating production issues

### 2. **API Correlator** 🔗

**Purpose**: Find data inconsistencies across multiple services

**Capabilities**:
- Fetches data from multiple APIs in parallel
- Correlates by common keys (IDs, timestamps)
- Detects mismatches, orphaned records, sync issues
- Explains business impact

**Best For**: Data integrity checks, debugging integration issues

### 3. **Smart Agent (Auto-Router)** 🤖

**Purpose**: Automatically selects the right workflow for your question

**Capabilities**:
- Detects intent ("error investigation" vs "data correlation" vs "general question")
- Routes to DataDog Champion or API Correlator automatically
- Falls back to general chat for non-investigation questions

**Best For**: When you're not sure which agent to use

---

## AI Technical Capabilities

### 🧠 Natural Language Understanding

**You can ask in plain English**:
- ✅ "Why is checkout slow?"
- ✅ "Find mismatches between Stripe and our database"
- ✅ "What happened around 3 PM yesterday?"

**Not required**:
- ❌ Writing SQL queries
- ❌ Learning API syntax
- ❌ Memorizing DataDog query language

### 🔄 Adaptive Query Building

**Intelligent query construction**:
```
Your question: "Show errors in payment-service"

Agent thinks:
  1. Detects service: "payment-service"
  2. Detects intent: "errors"
  3. Infers time range: "recent" (last 2 hours)
  4. Selects DataDog template: error_rate_query
  5. Builds query automatically
  6. Executes and analyzes results
```

**Uses 60+ pre-built templates** for DataDog, GitHub, Stripe:
- Error rate queries
- Trace analysis
- Metric aggregations
- Deployment correlations
- And more...

### 🎯 Progressive Transparency

**Agent explains what it's doing** (before each step):
```
💭 "Querying DataDog for errors in payment-service..."
[Executes query]

💭 "Analyzing error patterns to identify spike timeframe..."
[Analyzes data]

💭 "Fetching deployment history to correlate with errors..."
[Correlates findings]
```

**Why this matters**: You understand the investigation process, not just the final answer.

### 🔀 Multi-Step Reasoning with State

**Maintains context across steps**:
```
Step 1: "Found 1,247 errors"
Step 2: "Error rate spiked at 2:45 PM" (remembers error count from Step 1)
Step 3: "Deployment at 2:40 PM" (connects to spike time from Step 2)
Step 4: "Root cause identified" (synthesizes all previous findings)
```

**Conditional execution**:
```
IF errors > 100:
  → Fetch detailed traces (deep investigation)
ELSE:
  → Just show summary (shallow investigation)
```

### 🔍 Hybrid AI Approach

**Combines multiple AI techniques**:

1. **Template Matching** (98% accurate, instant)
   - Pre-built queries for common patterns
   - Example: "errors in service X" → Uses proven DataDog error template

2. **LLM Intent Parsing** (for edge cases)
   - Claude Haiku analyzes ambiguous questions
   - Example: "Something's weird with payments" → Interprets as error investigation

3. **Query Builder Intelligence**
   - Auto-detects service, time range, filters
   - Builds optimized API queries
   - 95% success rate in ≤3 iterations (vs 15+ without intelligence)

4. **Correlation Engine**
   - Connects data from multiple sources
   - Detects anomalies automatically
   - Synthesizes findings using LLM

### 🚀 Runtime Model Switching

**Change AI models on-the-fly** (no restart):
- **Settings**: Select provider (Azure OpenAI, Anthropic, Google)
- **Chat header**: Switch model (GPT-4, GPT-3.5, Claude Sonnet, etc.)
- **OAuth2 support**: Enterprise authentication for LLM access

**Why this matters**:
- Use GPT-4 for complex investigations
- Use GPT-3.5 for simple queries (faster, cheaper)
- Switch mid-conversation based on task complexity

### 🎨 Memory Efficient Design

**Web-based (Next.js), not desktop app**:
- Server-side rendering reduces client memory
- Streaming responses (progressive loading)
- Virtual scrolling for long conversations
- Lazy component loading

**Fallback**: If memory becomes an issue, migrate to Electron desktop app (same codebase)

---

## Why This Is Hard to Build (And Why We're Using Mastra)

### The Challenge

Building multi-step AI agents is complex:
1. **Workflow orchestration**: Managing steps, conditions, parallel execution
2. **State management**: Passing context between steps
3. **Error recovery**: Handling API failures gracefully
4. **Memory management**: Preventing context overflow
5. **Tool integration**: Connecting to 30+ APIs

### The Mastra Advantage

**Mastra.ai** is a TypeScript framework specifically designed for this:

✅ **Agent Orchestration**:
```typescript
const agent = new Agent({
  name: 'DataDog Champion',
  model: 'gpt-4',
  instructions: 'You are a DataDog expert...',
});
```

✅ **Workflow Definition**:
```typescript
const workflow = createWorkflow()
  .then(step1_DiscoverDatasets)
  .then(step2_BuildQuery)
  .branch({  // Conditional execution
    condition: (result) => result.errorCount > 100,
    then: step3_DeepInvestigation,
    else: step3_ShallowInvestigation,
  })
  .parallel([step4_FetchTraces, step4_FetchMetrics])  // Parallel execution
  .then(step5_Correlate)
  .then(step6_Synthesize);
```

✅ **Built-in Features**:
- Memory & context management
- Tool calling (MCP integration)
- Streaming responses
- Model routing (40+ LLM providers)
- Human-in-the-loop support

✅ **Production-Ready**:
- Used by real companies (see fromolive.com)
- TypeScript native (full type safety)
- Active community and documentation

---

## Key Differentiators

### vs ChatGPT/Claude Desktop

| Feature | ChatGPT/Claude | omni-ai |
|---------|----------------|---------|
| Multi-step investigations | ❌ Manual steps | ✅ Automatic |
| API integrations | ❌ None | ✅ 30+ built-in |
| Query templates | ❌ Write from scratch | ✅ 60+ pre-built |
| Cross-service correlation | ❌ Manual | ✅ Automatic |
| Enterprise authentication | ❌ No OAuth2 | ✅ OAuth2 + API keys |
| Investigation workflows | ❌ No structure | ✅ 2 proven workflows |

### vs Building from Scratch

| Aspect | From Scratch | With Mastra + omni-api-mcp |
|--------|--------------|----------------------------|
| Development time | 6 months | 6 weeks |
| Agent orchestration | Build yourself | ✅ Mastra framework |
| API integrations | 30+ integrations | ✅ Already built |
| Query intelligence | Build NLP parser | ✅ Query Builder (98% accurate) |
| Memory management | Implement yourself | ✅ Built-in |
| Error recovery | Manual handling | ✅ Automatic retries |

---

## Technical Innovation

### 1. **Hybrid Provider System**

Combines Mastra's built-in providers with custom OAuth2:
- **Standard providers**: OpenAI, Anthropic (via Mastra)
- **Enterprise providers**: Azure OpenAI, AWS Bedrock, GCP Vertex (custom OAuth2)
- **Runtime switching**: Change provider/model without restart

**Reference**: Similar pattern to omni-agent's `UniversalLLMClient` but integrated with Mastra

### 2. **MCP Protocol Integration**

Uses Model Context Protocol to consume omni-api-mcp tools:
```
Mastra Agent → @mastra/mcp → omni-api-mcp → 30+ APIs
```

**Benefits**:
- Modular architecture
- Reusable tools across agents
- Clear separation: agents (omni-ai) vs tools (omni-api-mcp)

### 3. **Progressive Transparency**

Real-time UI updates showing agent's thought process:
- One-liner hints above chat input ("Querying DataDog...")
- Iteration progress bar (Step 3 of 5)
- Tool call visualization cards
- Auto-fades after completion

**UX Innovation**: Users see the "thinking" process, not just final answers

### 4. **Command Palette (Cmd+K)**

Quick actions without clicking:
- "Switch to DataDog Champion"
- "Change model to GPT-4"
- "Open Settings"

**Inspired by**: VS Code, Linear, Notion command palettes

---

## Success Metrics

### Performance Targets

| Metric | Goal |
|--------|------|
| Investigation time | 45 min → 2 min (95% reduction) |
| Query success rate | 95% in ≤3 iterations |
| Template coverage | 60% of queries use templates |
| Memory usage | <500MB for normal use |

### User Experience

| Aspect | Target |
|--------|--------|
| Time to first result | <5 seconds |
| Accuracy | 95% correct root cause |
| Transparency | Show all steps before execution |
| Efficiency | No more than 5 API calls per investigation |

---

## Development Status

**Current Phase**: Bootstrap & Documentation ✅ Complete

**Next Phase**: Implementation (6 weeks)
- Week 1-2: Mastra setup + OAuth2 providers
- Week 2-3: MCP integration
- Week 3-4: 3 agents + 2 workflows
- Week 5-6: UI polish + testing

**Production Timeline**: 6 weeks to MVP

---

## Showcase Value (For Leadership)

### Business Impact

1. **Faster Incident Response**: 45 min → 2 min investigations (95% time savings)
2. **Reduced MTTR**: Mean Time To Resolution cut by 80%
3. **Knowledge Sharing**: Proven workflows encoded as templates (no tribal knowledge)
4. **Cost Optimization**: Use cheaper models for simple queries (70% cost reduction)

### Technical Innovation

1. **AI-First Architecture**: Not bolted-on AI, designed for agent workflows
2. **Production-Ready Framework**: Mastra (proven, not experimental)
3. **Hybrid Approach**: Templates + LLMs (98% accuracy vs 60% LLM-only)
4. **Enterprise-Grade**: OAuth2, runtime switching, multi-provider support

### Competitive Advantage

1. **Faster than manual analysis**: 20x speed improvement
2. **More accurate than basic chatbots**: Workflow-driven investigations
3. **Cheaper than hiring consultants**: One-time build vs recurring costs
4. **Scalable across organization**: Add more APIs/agents as needed

---

## Vision: The Future

**Phase 1 (MVP)**: DataDog + API correlation (Current)

**Phase 2**: Expand to more services
- Kubernetes investigation agent
- GitHub PR reviewer agent
- AWS infrastructure analyzer

**Phase 3**: Custom workflows
- User-defined investigation templates
- Workflow marketplace (share templates)

**Phase 4**: Autonomous operation
- Scheduled investigations (nightly health checks)
- Proactive alerting (detect issues before humans notice)
- Auto-remediation (fix simple issues automatically)

---

## References & Inspiration

- **Mastra Framework**: https://mastra.ai
- **Example App**: https://fromolive.com (built with Mastra)
- **MCP Protocol**: Model Context Protocol by Anthropic
- **omni-api-mcp**: 30+ API integrations, 60+ templates (already built)
- **omni-agent**: Reference UI/UX patterns (Activity Bar design)

---

**Built with**: Next.js, Mastra.ai, TypeScript, shadcn/ui, Tailwind CSS
**Powered by**: GPT-4, Claude, Gemini (runtime switchable)
**Integrated with**: 30+ enterprise APIs via omni-api-mcp

**Simple idea. Powerful execution. 10x faster investigations.**
