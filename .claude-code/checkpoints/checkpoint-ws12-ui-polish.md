# WS12: UI Polish & Smart Message Display

**Status**: Not Started
**Duration**: 5-7 days
**Dependencies**: WS9, WS11 complete
**Priority**: P1 (HIGH)

---

## Objective

Enhance chat UI with smart message formatting, code block rendering, streaming indicators, and polished tool call visualization using shadcn/ui components.

---

## Tasks

### Task 1: Enhance Message Components (2-3 days)

**Install shadcn Components**:
```bash
npx shadcn@latest add skeleton avatar separator
```

**Create Smart Message Component**:
```typescript
// components/chat-message.tsx
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function ChatMessage({ message }: { message: Message }) {
  return (
    <div className="flex gap-3 p-4">
      <Avatar>
        {message.role === 'assistant' ? <Bot /> : <User />}
      </Avatar>

      <div className="flex-1 space-y-2">
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>

        {message.toolCalls?.map((tool) => (
          <ToolCallCard key={tool.id} tool Call={toolCall} />
        ))}
      </div>
    </div>
  );
}
```

**Validation**:
- [x] Markdown renders correctly
- [x] Code blocks syntax highlighted
- [x] Tool calls display nicely
- [x] Avatar shows correct icon

**Status**: ✅ Complete (2025-11-01)
**Implementation**:
- Installed react-markdown, react-syntax-highlighter, remark-gfm
- Created shadcn components: skeleton, avatar, separator
- Created ChatMessage component with markdown and syntax highlighting
- Added prose styles to globals.css
- Updated ChatInterface to use ChatMessage component
- Fixed deprecated substr() calls
- Dev server running successfully at http://localhost:3000

---

### Task 2: Improve Streaming UI (1-2 days)

**Parse Claude SDK Chunks**:
```typescript
// lib/claude-sdk/stream-parser.ts
export function parseStreamChunk(chunk: any) {
  switch (chunk.type) {
    case 'text':
      return { type: 'text', content: chunk.content };

    case 'tool_use':
      return {
        type: 'tool_call',
        toolName: chunk.name,
        toolInput: chunk.input
      };

    case 'tool_result':
      return {
        type: 'tool_result',
        toolName: chunk.name,
        result: chunk.result
      };

    default:
      return { type: 'unknown', data: chunk };
  }
}
```

**Update Stream Handler**:
```typescript
// components/chat-interface.tsx
const handleStream = async (message: string) => {
  setIsStreaming(true);

  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    body: JSON.stringify({ message, threadId, agentId })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value);

    // Parse SSE events
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        const parsed = parseStreamChunk(data);

        // Update UI based on chunk type
        updateMessageStream(parsed);
      }
    }
  }

  setIsStreaming(false);
};
```

**Validation**:
- [x] Streaming displays smoothly
- [x] Tool calls appear in real-time
- [x] No UI freezing
- [x] Error handling works

**Status**: ✅ Complete (2025-11-01)
**Implementation**:
- Created StreamParser class with parseChunk() method
- Added support for parsing: text, tool_use, thinking, error, system chunks
- Integrated StreamParser into ChatInterface streaming logic
- Added activeToolCalls state to track real-time tool calls
- Display tool calls using ToolCallCard component during streaming
- Added getHintFromChunk() helper for transparency hints
- Clear tool calls on new message send
- Dev server running successfully

---

### Task 3: Enhanced Tool Call Cards (1 day)

**Use shadcn Collapsible**:
```bash
npx shadcn@latest add collapsible
```

```typescript
// components/tool-call-card.tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50">
            <div className="flex items-center gap-2">
              <Badge>{toolCall.toolName}</Badge>
              <span className="text-sm text-muted-foreground">
                {isOpen ? 'Hide details' : 'Show details'}
              </span>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium">Input</label>
                <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(toolCall.input, null, 2)}
                </pre>
              </div>

              <div>
                <label className="text-xs font-medium">Result</label>
                <pre className="bg-muted p-2 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                  {JSON.stringify(toolCall.result, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
```

**Validation**:
- [ ] Cards collapse/expand
- [ ] JSON formatted nicely
- [ ] Long results scrollable
- [ ] Matches omni-agent style

---

### Task 4: Add Loading Skeletons (1 day)

```typescript
// components/message-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

export function MessageSkeleton() {
  return (
    <div className="flex gap-3 p-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
```

**Validation**:
- [ ] Skeletons show while streaming
- [ ] Smooth transition to content
- [ ] Matches overall design

---

### Task 5: Improve Error Display (1 day)

```typescript
// components/error-message.tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ErrorMessage({ error }: { error: Error }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error.message}

        {error.cause && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs">
              Technical details
            </summary>
            <pre className="mt-1 text-xs overflow-x-auto">
              {JSON.stringify(error.cause, null, 2)}
            </pre>
          </details>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

**Validation**:
- [ ] Errors display clearly
- [ ] Technical details collapsible
- [ ] User-friendly messages

---

## Success Criteria

**Must Have**:
- ✅ Markdown rendering with code highlighting
- ✅ Smooth streaming UI
- ✅ Collapsible tool call cards
- ✅ Loading skeletons
- ✅ Error messages

**Nice to Have**:
- ✅ Copy code button
- ✅ Scroll to bottom on new message
- ✅ Message timestamps
- ✅ Read receipts

---

## References

- shadcn/ui Components: https://ui.shadcn.com/
- react-markdown: https://github.com/remarkjs/react-markdown
- react-syntax-highlighter: https://github.com/react-syntax-highlighter/react-syntax-highlighter
