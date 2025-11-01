/**
 * Chat Interface (Claude Agent SDK)
 *
 * Main chat UI with real-time streaming via Server-Sent Events (SSE).
 * Handles Claude SDK chunks and displays tool calls.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAgentStore } from '@/lib/stores/agent-store';
import { useProgressStore } from '@/lib/stores/progress-store';
import { useConversationStore } from '@/lib/stores/conversation-store';
import { TransparencyHint } from '@/components/transparency-hint';
import { ChatMessage } from '@/components/chat-message';
import { StreamParser, getHintFromChunk } from '@/lib/claude-sdk/stream-parser';
import { type ToolCall } from '@/components/tool-call-card';
import { MessageSkeleton } from '@/components/message-skeleton';
import { ActivityPanel } from '@/components/activity-panel';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCall[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { selectedAgent } = useAgentStore();
  const { setRunning, setHint, reset: resetProgress, hint } = useProgressStore();
  const {
    conversations,
    activeConversationId,
    createConversation,
    addMessage,
    getActiveConversation,
  } = useConversationStore();

  // Get active conversation and its messages
  const activeConversation = getActiveConversation();
  const messages = isMounted ? (activeConversation?.messages ?? []) : [];

  // Hydration and initial conversation setup
  useEffect(() => {
    setIsMounted(true);
    if (conversations.length === 0) {
      createConversation();
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
      setRunning(false);
      setStreamingContent('');
      resetProgress();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !activeConversationId) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: input,
      timestamp: Date.now(),
    };

    addMessage(activeConversationId, userMessage);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setRunning(true);
    setStreamingContent('');
    setActiveToolCalls([]); // Clear previous tool calls

    const controller = new AbortController();
    setAbortController(controller);

    try {
      setHint('Connecting to agent...');

      // Call API with SSE streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          agent: selectedAgent,
          threadId: activeConversationId, // Use conversation ID as thread ID
          resourceId: 'default-user', // User identifier (can be enhanced later)
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle SSE stream with StreamParser
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const parser = new StreamParser();
      let buffer = '';

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (separated by \n\n)
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          try {
            const jsonStr = line.slice(6); // Remove 'data: ' prefix
            const rawChunk = JSON.parse(jsonStr);

            // Parse chunk with StreamParser
            const parsedChunk = parser.parseChunk(rawChunk);

            if (!parsedChunk) continue;

            // Update hint based on parsed chunk
            const hint = getHintFromChunk(parsedChunk);
            if (hint !== null) {
              setHint(hint);
            }

            // Handle different parsed chunk types
            switch (parsedChunk.type) {
              case 'text':
                // Update streaming content with accumulated text
                setStreamingContent(parsedChunk.accumulatedText);
                break;

              case 'tool_use':
                // Tool call detected - add to active tool calls
                console.log(`[STREAM] Tool called: ${parsedChunk.displayName}`);
                const newToolCall: ToolCall = {
                  id: parsedChunk.id,
                  name: parsedChunk.displayName,
                  arguments: parsedChunk.input,
                  status: 'running',
                  startTime: Date.now(),
                };
                setActiveToolCalls((prev) => [...prev, newToolCall]);
                break;

              case 'thinking':
                // Extended thinking mode
                console.log('[STREAM] Agent thinking...');
                break;

              case 'error':
                // Error occurred
                console.error('[STREAM] Error:', parsedChunk.message);
                setHint(`Error: ${parsedChunk.message}`);
                break;

              case 'system':
                if (parsedChunk.subtype === 'complete') {
                  // Clear hint on completion
                  setHint(null);
                }
                break;
            }
          } catch (parseError) {
            console.error('Failed to parse SSE chunk:', parseError);
          }
        }
      }

      // Add final assistant message with accumulated text
      const finalText = parser.getAccumulatedText();
      if (finalText && activeConversationId) {
        const assistantMessage = {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: finalText,
          timestamp: Date.now(),
        };
        addMessage(activeConversationId, assistantMessage);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted by user');
      } else {
        console.error('Chat error:', error);
        if (activeConversationId) {
          const errorMessage = {
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
            timestamp: Date.now(),
          };
          addMessage(activeConversationId, errorMessage);
        }
      }
    } finally {
      setIsLoading(false);
      setRunning(false);
      setStreamingContent('');
      setHint(null);
      setAbortController(null);
      resetProgress();
    }
  };

  return (
    <div className="h-full flex">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg">Ask me anything about your services</p>
              <p className="text-sm mt-2">
                I can investigate errors, correlate data, and more.
              </p>
              <p className="text-xs mt-4 text-muted-foreground/70">
                Press <kbd className="px-1.5 py-0.5 text-xs border rounded">Cmd</kbd> +{' '}
                <kbd className="px-1.5 py-0.5 text-xs border rounded">K</kbd> for quick actions
              </p>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
            />
          ))}

          {/* Streaming message */}
          {isLoading && streamingContent && (
            <ChatMessage
              role="assistant"
              content={streamingContent}
              isStreaming={true}
            />
          )}

          {/* Loading skeleton */}
          {isLoading && !streamingContent && activeToolCalls.length === 0 && (
            <MessageSkeleton />
          )}
        </div>
      </ScrollArea>

      {/* Progressive Transparency Hint */}
      <TransparencyHint />

      {/* Input */}
      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about errors, data inconsistencies, or service status..."
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={isLoading}
            aria-label="Message input"
          />
          {isLoading ? (
            <Button onClick={handleStop} variant="destructive">
              <StopCircle className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSend} disabled={!input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      </div>

      {/* Activity Panel - Right sidebar */}
      <ActivityPanel
        toolCalls={activeToolCalls}
        isRunning={isLoading}
        hint={hint}
      />
    </div>
  );
}
