# Checkpoint WS4: Agents + Workflows

**Project**: omni-ai
**Duration**: 1-2 weeks
**Priority**: Critical Path (core functionality)
**Dependencies**: WS1 (Mastra setup), WS2 (Providers), WS3 (MCP integration)

## Overview

Implement the 3 intelligent agents (DataDog Champion, API Correlator, Smart Agent) and 2 investigation workflows (DataDog Investigation, Multi-API Correlation). Build chat interface with Mastra Memory for persistence.

## Goals

1. Implement 3 Mastra agents with specialized instructions
2. Create 2 investigation workflows using `createWorkflow()`
3. Build chat interface with message history
4. Integrate Mastra Memory for conversation persistence
5. Add agent selector UI
6. Implement progressive transparency (one-liner hints, iteration progress)
7. Test end-to-end investigation scenarios

## Prerequisites

- [ ] WS1-WS3 complete
- [ ] omni-api-mcp connected and working
- [ ] MCP tools tested and verified

## Tasks

### Task 1: Configure Mastra Storage with LibSQL

**File**: `lib/mastra/instance.ts` (new)

**Purpose**: Initialize Mastra with persistent storage

**Implementation**:
```typescript
import { Mastra } from '@mastra/core/mastra'
import { LibSQLStore } from '@mastra/libsql'
import path from 'path'

/**
 * Main Mastra instance with LibSQL storage
 * Persists conversation history to file
 */
export const mastra = new Mastra({
  storage: new LibSQLStore({
    url: `file:${path.join(process.cwd(), '.mastra', 'data.db')}`
  })
})
```

**Acceptance Criteria**:
- [ ] Mastra instance created with LibSQL storage
- [ ] Storage persists to `.mastra/data.db` file
- [ ] `.mastra/` added to .gitignore

### Task 2: Implement DataDog Champion Agent

**File**: `lib/mastra/agents/datadog-champion.ts` (new)

**Purpose**: Root cause analysis for errors, latency, and availability issues

**Implementation**:
```typescript
import { Agent } from '@mastra/core'
import { Memory } from '@mastra/memory'
import { providerManager } from '../hybrid-provider-manager'
import { mcpTools } from '@/lib/mcp/tools'

/**
 * DataDog Champion Agent
 *
 * Specializes in DataDog-based investigations for errors, latency, and availability.
 * Uses 3-layer intelligence approach:
 * 1. Investigation Templates (60% queries, 1 iteration)
 * 2. Query Builder Intelligence (35% queries, 2-3 iterations)
 * 3. Exploration Fallback (5% queries, 5-10 iterations)
 */
export function createDataDogChampion(provider: string, model: string) {
  const providerInstance = providerManager.getProvider(provider as any)

  return new Agent({
    name: 'DataDog Champion',
    instructions: `You are a DataDog expert specializing in root cause analysis for production issues.

## Your Capabilities

You have access to these MCP tools:
- discover_datasets: Find available monitoring services
- build_query: Convert natural language to DataDog API queries
- call_rest_api: Execute API calls
- summarize_multi_api_results: Correlate data from multiple sources

## Investigation Strategy

When investigating issues, follow this systematic approach:

### 1. Understand the Problem (1 step)
- Identify: service name, error type, time range
- Ask clarifying questions if needed
- Use discover_datasets if service is unknown

### 2. Build Initial Query (1 step)
- Use build_query with clear intent
- Example: "Find 500 errors in payment-service from last 2 hours"
- The query builder knows 60+ DataDog templates

### 3. Execute and Analyze (1-2 steps)
- Call the API using call_rest_api
- Analyze results for patterns:
  - Error rate spikes
  - Timeframe of issues
  - Affected endpoints
  - Error messages

### 4. Correlate with Deployments (1 step)
- Check if error spike correlates with deployment time
- Look for code changes around spike timeframe

### 5. Synthesize Root Cause (1 step)
- Combine all findings
- Identify most likely root cause
- Suggest fix or mitigation
- Provide confidence level

## Progressive Transparency

Before each step, announce what you're doing:
- "Querying DataDog for errors in payment-service..."
- "Analyzing error patterns to identify spike timeframe..."
- "Checking deployment history for correlation..."

## Constraints

- Target: 95% success in ≤3 iterations
- If query fails, use build_query to refine it
- Be concise - engineers want answers, not essays
- Always provide actionable recommendations

## Example Investigation

User: "Why are we seeing 500 errors in the payment service?"

Your response:
1. "Querying DataDog for errors in payment-service from last 2 hours..."
   [Use build_query + call_rest_api]
2. "Found 1,247 errors with spike at 2:45 PM. Analyzing patterns..."
   [Analyze results]
3. "Checking recent deployments for correlation..."
   [Query deployment data]
4. "Root Cause: payment-v2.3 deployed at 2:40 PM introduced timeout in validation logic. Recommend rollback."

Time saved: 45 minutes → 2 minutes`,
    model: {
      provider: providerInstance,
      name: model
    },
    tools: mcpTools,
    memory: new Memory()
  })
}
```

**Acceptance Criteria**:
- [ ] DataDog Champion agent created
- [ ] Instructions follow 3-layer intelligence approach
- [ ] Progressive transparency pattern in instructions
- [ ] Memory enabled for context retention

### Task 3: Implement API Correlator Agent

**File**: `lib/mastra/agents/api-correlator.ts` (new)

**Purpose**: Find data inconsistencies across multiple services

**Implementation**:
```typescript
import { Agent } from '@mastra/core'
import { Memory } from '@mastra/memory'
import { providerManager } from '../hybrid-provider-manager'
import { mcpTools } from '@/lib/mcp/tools'

/**
 * API Correlator Agent
 *
 * Specializes in cross-service data correlation and inconsistency detection.
 */
export function createAPICorrelator(provider: string, model: string) {
  const providerInstance = providerManager.getProvider(provider as any)

  return new Agent({
    name: 'API Correlator',
    instructions: `You are an API correlation expert specializing in finding data inconsistencies across multiple services.

## Your Capabilities

You have access to these MCP tools:
- discover_datasets: Find available APIs
- build_query: Convert natural language to API queries
- call_rest_api: Execute API calls
- summarize_multi_api_results: Correlate data from multiple sources (KEY TOOL)

## Investigation Strategy

When investigating data inconsistencies:

### 1. Identify Data Sources (1 step)
- Determine which APIs to query
- Use discover_datasets to find relevant services
- Identify common correlation keys (IDs, timestamps)

### 2. Fetch Data in Parallel (1 step)
- Query all relevant APIs
- Use the same filters (time range, IDs) for consistency
- Collect responses

### 3. Correlate and Detect Issues (1 step)
- Use summarize_multi_api_results with correlation key
- The tool will automatically:
  - Match records by key
  - Detect mismatches
  - Find orphaned records
  - Identify sync issues

### 4. Explain Business Impact (1 step)
- Translate technical findings to business impact
- Example: "45 orders failed because inventory API returned stale data"
- Suggest remediation steps

## Progressive Transparency

Before each step:
- "Fetching data from Stripe and order database..."
- "Correlating 1,234 records by order ID..."
- "Analyzing mismatches to identify root cause..."

## Example Investigation

User: "Find mismatches between Stripe payments and our order database"

Your response:
1. "Fetching payment data from Stripe and order data from our database..."
   [Parallel API calls]
2. "Correlating 1,234 records by order_id..."
   [Use summarize_multi_api_results]
3. "Found 45 mismatches: orders marked as 'paid' in our DB but 'failed' in Stripe"
4. "Root Cause: Webhook delay caused order confirmation before payment verification. Recommend sync job."`,
    model: {
      provider: providerInstance,
      name: model
    },
    tools: mcpTools,
    memory: new Memory()
  })
}
```

**Acceptance Criteria**:
- [ ] API Correlator agent created
- [ ] Instructions focus on multi-API correlation
- [ ] Uses summarize_multi_api_results as key tool
- [ ] Memory enabled

### Task 4: Implement Smart Agent (Auto-Router)

**File**: `lib/mastra/agents/smart-agent.ts` (new)

**Purpose**: Automatically route queries to appropriate agent/workflow

**Implementation**:
```typescript
import { Agent } from '@mastra/core'
import { Memory } from '@mastra/memory'
import { providerManager } from '../hybrid-provider-manager'
import { mcpTools } from '@/lib/mcp/tools'

/**
 * Smart Agent (Default)
 *
 * Auto-detects intent and routes to appropriate workflow or handles directly.
 */
export function createSmartAgent(provider: string, model: string) {
  const providerInstance = providerManager.getProvider(provider as any)

  return new Agent({
    name: 'Smart Agent',
    instructions: `You are an intelligent routing agent that determines the best approach for each query.

## Your Capabilities

You have access to all MCP tools and can handle various types of queries:
- DataDog investigations (errors, latency, availability)
- Multi-API data correlation
- General API queries
- Service discovery

## Intent Detection

Analyze the user's query and determine:

1. **DataDog Investigation Intent** - Route to DataDog workflow:
   - Keywords: errors, latency, slow, 500, timeout, availability, spike
   - Examples:
     - "Why are we seeing 500 errors?"
     - "What's causing slow checkout?"
     - "Investigate production issues"

2. **Data Correlation Intent** - Route to API Correlator workflow:
   - Keywords: mismatch, inconsistency, compare, sync, orphaned, correlate
   - Examples:
     - "Find mismatches between Stripe and orders"
     - "Compare user data across systems"
     - "Detect orphaned records"

3. **General Query Intent** - Handle directly:
   - Service discovery: "What APIs are available?"
   - Simple data fetch: "Get user by ID"
   - Capability check: "Can I query GitHub?"

## Auto-Routing Logic

Based on detected intent:
- **DataDog patterns** → Use DataDog investigation approach
- **Correlation patterns** → Use multi-API correlation approach
- **General patterns** → Handle with direct tool calls

## Progressive Transparency

Always announce your approach:
- "Detected DataDog investigation intent. Querying error logs..."
- "Detected correlation intent. Fetching data from multiple sources..."
- "Direct query. Using discover_datasets..."

## Workflow Execution

You can execute multi-step workflows yourself:

**DataDog Workflow**:
1. Discover datasets (if service unknown)
2. Build query with clear intent
3. Execute API call
4. Analyze results
5. Check correlations (deployments, etc.)
6. Synthesize root cause

**Correlation Workflow**:
1. Identify data sources
2. Fetch data in parallel
3. Use summarize_multi_api_results
4. Explain business impact

**General Workflow**:
1. Use appropriate tools directly
2. Provide clear answers

## Example

User: "Something's weird with payments"

Your response:
1. "Detected potential error investigation. Let me check payment-service errors..."
2. [Execute DataDog workflow]
3. "Found 1,247 payment errors starting 2:45 PM. Root cause: timeout in validation..."`,
    model: {
      provider: providerInstance,
      name: model
    },
    tools: mcpTools,
    memory: new Memory()
  })
}
```

**Acceptance Criteria**:
- [ ] Smart Agent created with intent detection logic
- [ ] Can route to DataDog or Correlation approaches
- [ ] Handles general queries directly
- [ ] Memory enabled

### Task 5: Create Agent Store (Zustand)

**File**: `lib/stores/agent-store.ts` (new)

**Purpose**: Track selected agent and persist selection

**Implementation**:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AgentType = 'smart' | 'datadog' | 'correlator'

interface AgentState {
  selectedAgent: AgentType
  setAgent: (agent: AgentType) => void
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set) => ({
      selectedAgent: 'smart',
      setAgent: (agent) => set({ selectedAgent: agent })
    }),
    {
      name: 'omni-ai-agent-storage'
    }
  )
)
```

**Acceptance Criteria**:
- [ ] Agent store tracks selected agent
- [ ] Default: Smart Agent
- [ ] Persists across refreshes

### Task 6: Build Chat Interface with Mastra Memory

**File**: `components/chat-interface.tsx` (new)

**Implementation**:
```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAgentStore } from '@/lib/stores/agent-store'
import { useProviderStore } from '@/lib/stores/provider-store'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { selectedAgent } = useAgentStore()
  const { selectedProvider, selectedModel } = useProviderStore()

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Call API to generate response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          agent: selectedAgent,
          provider: selectedProvider,
          model: selectedModel,
          threadId: 'main' // Will use Mastra thread management
        })
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg">Ask me anything about your services</p>
              <p className="text-sm mt-2">
                I can investigate errors, correlate data, and more.
              </p>
            </div>
          )}

          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask about errors, data inconsistencies, or service status..."
            className="min-h-[60px] max-h-[200px]"
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Acceptance Criteria**:
- [ ] Chat interface renders messages
- [ ] User can send messages
- [ ] Loading state shows
- [ ] Auto-scrolls to bottom
- [ ] Textarea grows with content

### Task 7: Create Chat API Route with Mastra Memory

**File**: `app/api/chat/route.ts` (new)

**Purpose**: Handle chat requests using selected agent with Mastra memory

**Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createDataDogChampion } from '@/lib/mastra/agents/datadog-champion'
import { createAPICorrelator } from '@/lib/mastra/agents/api-correlator'
import { createSmartAgent } from '@/lib/mastra/agents/smart-agent'
import { mastra } from '@/lib/mastra/instance'

export async function POST(req: NextRequest) {
  try {
    const { message, agent, provider, model, threadId } = await req.json()

    // Select agent
    let selectedAgent
    switch (agent) {
      case 'datadog':
        selectedAgent = createDataDogChampion(provider, model)
        break
      case 'correlator':
        selectedAgent = createAPICorrelator(provider, model)
        break
      case 'smart':
      default:
        selectedAgent = createSmartAgent(provider, model)
    }

    // Generate response with Mastra memory
    // Memory automatically loads conversation history from storage
    const result = await selectedAgent.generate({
      messages: [{ role: 'user', content: message }],
      threadId: threadId || 'default'
    })

    return NextResponse.json({
      success: true,
      response: result.text,
      agent: agent
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
```

**Acceptance Criteria**:
- [ ] API route selects correct agent
- [ ] Uses Mastra memory for conversation persistence
- [ ] Returns agent response
- [ ] Error handling works

### Task 8: Add Agent Selector to Chat Header

**File**: `components/chat-header.tsx` (update)

**Changes**:
```typescript
'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProviderStore } from '@/lib/stores/provider-store'
import { useAgentStore } from '@/lib/stores/agent-store'
import { providerManager } from '@/lib/mastra/hybrid-provider-manager'

const agents = [
  { value: 'smart', label: 'Smart Agent (Auto)' },
  { value: 'datadog', label: 'DataDog Champion' },
  { value: 'correlator', label: 'API Correlator' }
]

export function ChatHeader() {
  const { selectedProvider, selectedModel, setModel } = useProviderStore()
  const { selectedAgent, setAgent } = useAgentStore()

  const availableModels = providerManager.getModelsForProvider(selectedProvider)

  return (
    <div className="h-14 border-b flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h2 className="font-semibold">Chat</h2>

        {/* Agent Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Agent:</span>
          <Select value={selectedAgent} onValueChange={(value: any) => setAgent(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map(agent => (
                <SelectItem key={agent.value} value={agent.value}>
                  {agent.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Model Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Model:</span>
        <Select value={selectedModel} onValueChange={setModel}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map(model => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
```

**Acceptance Criteria**:
- [ ] Agent selector added to chat header
- [ ] Shows 3 agents (Smart, DataDog, Correlator)
- [ ] Selection persists
- [ ] Works alongside model selector

### Task 9: Update Page to Use Chat Interface

**File**: `app/page.tsx` (update)

**Changes**:
```typescript
'use client'

import { useViewStore } from '@/lib/stores/view-store'
import { SettingsPanel } from '@/components/settings-panel'
import { ChatHeader } from '@/components/chat-header'
import { ChatInterface } from '@/components/chat-interface'

export default function Home() {
  const { activeView } = useViewStore()

  return (
    <div className="h-full flex flex-col">
      {activeView === 'chat' && (
        <>
          <ChatHeader />
          <ChatInterface />
        </>
      )}
      {activeView === 'settings' && <SettingsPanel />}
    </div>
  )
}
```

**Acceptance Criteria**:
- [ ] Chat interface appears in Chat view
- [ ] Full functionality works end-to-end

## Testing

### Manual Testing Checklist

**Agent Testing**:
- [ ] Select Smart Agent, send query "Why are we seeing errors?"
- [ ] Verify agent detects DataDog intent and investigates
- [ ] Select DataDog Champion, send same query
- [ ] Verify specialized DataDog investigation
- [ ] Select API Correlator, send "Find mismatches between APIs"
- [ ] Verify multi-API correlation workflow

**Memory Testing**:
- [ ] Send multiple messages in conversation
- [ ] Refresh page
- [ ] Verify conversation history persists (Mastra Memory)
- [ ] Check `.mastra/data.db` file exists

**Provider/Model Switching**:
- [ ] Change model mid-conversation
- [ ] Verify new model is used for next response
- [ ] Change provider in Settings
- [ ] Verify model selector updates

### End-to-End Investigation Test

**Scenario**: DataDog error investigation

1. Send: "Find errors in payment-service from last 2 hours"
2. Expect:
   - Agent uses discover_datasets (if needed)
   - Agent uses build_query to create query
   - Agent uses call_rest_api to fetch data
   - Agent analyzes results
   - Agent provides root cause analysis
3. Verify: Investigation completes in ≤3 iterations

## Documentation

**File**: `docs/AGENTS_WORKFLOWS.md` (new)

Document:
1. Agent architecture (3 agents, their specializations)
2. Workflow execution patterns
3. Progressive transparency implementation
4. Mastra Memory usage
5. How to add new agents

## Acceptance Criteria (Summary)

- [ ] Mastra instance configured with LibSQL storage
- [ ] 3 agents implemented (DataDog Champion, API Correlator, Smart Agent)
- [ ] Agent store for selection persistence
- [ ] Chat interface with message history
- [ ] Chat API route using Mastra memory
- [ ] Agent selector in chat header
- [ ] Conversation persistence works (via Mastra Memory)
- [ ] Manual testing complete (all scenarios pass)
- [ ] End-to-end investigation succeeds in ≤3 iterations

## Next Workstream

After completing WS4, proceed to:
- **WS5: UI Polish** - Command palette, iteration progress bar, progressive transparency hints

## Notes

- **Mastra Memory** - Replaces custom Zustand chat-store, provides better persistence
- **LibSQL storage** - File-based, persists to `.mastra/data.db`
- **Agent instructions** - Critical for success, tune based on testing
- **3-layer intelligence** - Template → Query Builder → Exploration fallback
- **Progressive transparency** - Agents announce actions before executing

## Common Issues

**Issue**: Agent doesn't call tools
**Solution**: Verify tools are passed to Agent constructor, check agent instructions guide tool usage

**Issue**: Memory doesn't persist
**Solution**: Verify LibSQL storage configured, check `.mastra/data.db` file permissions

**Issue**: Investigation takes >5 iterations
**Solution**: Review agent instructions, ensure build_query is used early, check query templates in omni-api-mcp
