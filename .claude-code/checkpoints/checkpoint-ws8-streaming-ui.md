# WS8: Real Streaming & Investigation UI (Mastra Way)

**Priority**: P1 (High)
**Duration**: 3-4 days
**Dependencies**: WS4 (Agents), WS5 (UI Polish)
**Status**: Not Started

---

## Objective

Connect UI to **Mastra's real-time agent streaming events** for live investigation progress.

**Problem**: TransparencyHint and IterationProgress are simulated, not connected to actual agent execution.

**Mastra Way**: Use Mastra's agent streaming API and events instead of polling or simulation.

---

## Research First: Mastra Streaming API

### Task 1: Check Mastra Docs for Agent Streaming

**Query Mastra docs for**:
- [ ] Agent streaming API (`agent.stream()` vs `agent.generate()`)
- [ ] Event types available (step-start, tool-call, step-end, etc.)
- [ ] How to stream from Next.js API route to client
- [ ] Server-Sent Events (SSE) pattern with Mastra

**Paths to check**:
- `reference/agents/`
- `streaming/`
- Examples with streaming

**Action**: Find Mastra's streaming examples and patterns.

---

## Implementation (After Research)

### Task 2: Update Chat API to Use Mastra Streaming

**Expected pattern**:
```typescript
// app/api/chat/route.ts
export async function POST(req: NextRequest) {
  const { message, agent, provider, model, threadId } = await req.json();

  const selectedAgent = await createAgent(agent, provider, model);

  // Use Mastra's streaming API
  const stream = await selectedAgent.stream(
    [{ role: 'user', content: message }],
    {
      threadId: threadId || 'default',
      resourceId: 'default-user',
    }
  );

  // Return Server-Sent Events
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      // Listen to Mastra's stream events
      for await (const event of stream) {
        if (event.type === 'step-start') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'step-start', step: event.step })}\n\n`));
        }
        if (event.type === 'tool-call') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tool-call', tool: event.tool })}\n\n`));
        }
        if (event.type === 'text-delta') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text: event.delta })}\n\n`));
        }
        if (event.type === 'finish') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'finish' })}\n\n`));
          controller.close();
        }
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Subtasks**:
- [ ] Research Mastra's streaming API from docs
- [ ] Update chat API to use `stream()` instead of `generate()`
- [ ] Return SSE stream to client
- [ ] Test basic streaming flow

---

### Task 3: Connect Client to Real Streaming Events

**Update ChatInterface to consume SSE**:
```typescript
// components/chat-interface.tsx
async function handleSubmit(message: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, agent, provider, model, threadId }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));

        switch (data.type) {
          case 'step-start':
            // Update progress store
            setProgress({ currentStep: data.step, status: 'running' });
            break;

          case 'tool-call':
            // Add tool call card
            addToolCall(data.tool);
            setTransparencyHint(`Calling ${data.tool.name}...`);
            break;

          case 'text':
            // Append text to message
            setStreamingText(prev => prev + data.text);
            break;

          case 'finish':
            setProgress({ status: 'complete' });
            setTransparencyHint(null);
            break;
        }
      }
    }
  }
}
```

**Subtasks**:
- [ ] Update ChatInterface to use EventSource or fetch streaming
- [ ] Connect to progress store for real-time updates
- [ ] Update TransparencyHint with real tool call status
- [ ] Test end-to-end streaming flow

---

### Task 4: Add Investigation Panel (Optional Enhancement)

**If time permits**, add investigation panel like omni-agent:
```typescript
// components/investigation-panel.tsx
export function InvestigationPanel({ investigationId }: { investigationId: string }) {
  const steps = useProgressStore(state => state.steps);
  const currentStep = useProgressStore(state => state.currentStep);

  return (
    <div className="investigation-panel">
      <h3>Investigation Progress</h3>
      <div className="steps">
        {steps.map(step => (
          <StepCard
            key={step.id}
            step={step}
            isCurrent={step.id === currentStep}
            status={step.status}
          />
        ))}
      </div>
    </div>
  );
}
```

**Subtasks**:
- [ ] Create InvestigationPanel component
- [ ] Add to main layout (optional sidebar or modal)
- [ ] Show step-by-step progress from Mastra events

---

## Acceptance Criteria

- [ ] Mastra docs consulted for streaming patterns
- [ ] Chat API uses `agent.stream()` with real events
- [ ] Client receives Server-Sent Events (SSE)
- [ ] TransparencyHint shows real tool calls (not simulated)
- [ ] IterationProgress updates in real-time
- [ ] No polling or fake delays

---

## Files to Modify

- [ ] `app/api/chat/route.ts` - Switch to streaming API
- [ ] `components/chat-interface.tsx` - Consume SSE stream
- [ ] `components/transparency-hint.tsx` - Use real events
- [ ] `components/iteration-progress.tsx` - Use real events
- [ ] `lib/stores/progress-store.ts` - Update with stream events

**New Files** (optional):
- [ ] `components/investigation-panel.tsx` - Step-by-step view

---

**Created**: 2025-10-31
**Status**: Ready - Start after WS6+WS7
**Mastra-First Approach**: ✅ Use Mastra's streaming API, not custom WebSockets
