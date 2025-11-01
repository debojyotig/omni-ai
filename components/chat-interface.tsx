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
import { TransparencyHint } from '@/components/transparency-hint';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { selectedAgent } = useAgentStore();
  const { setRunning, setHint, reset: resetProgress } = useProgressStore();

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
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setRunning(true);
    setStreamingContent('');

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
          threadId: sessionId, // Resume session or undefined for new
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';

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
            const chunk = JSON.parse(jsonStr);

            // Handle different chunk types
            if (chunk.type === 'system' && chunk.subtype === 'init') {
              // Save session ID for conversation continuity
              if (chunk.session_id) {
                setSessionId(chunk.session_id);
              }
              setHint('Agent initialized, processing query...');
            } else if (chunk.type === 'assistant' && chunk.message?.content) {
              // Extract text and tool calls from assistant message
              const content = chunk.message.content;

              // Look for text content
              const textParts = content.filter((c: any) => c.type === 'text');
              if (textParts.length > 0) {
                const newText = textParts.map((t: any) => t.text).join('');
                accumulatedText = newText;
                setStreamingContent(newText);
              }

              // Look for tool uses
              const toolUses = content.filter((c: any) => c.type === 'tool_use');
              if (toolUses.length > 0) {
                const toolNames = toolUses.map((t: any) => t.name.replace('mcp__omni-api__', '')).join(', ');
                setHint(`Calling tools: ${toolNames}`);
              }
            } else if (chunk.type === 'result') {
              // Final result received
              setHint(null);
            }
          } catch (parseError) {
            console.error('Failed to parse SSE chunk:', parseError);
          }
        }
      }

      // Add final assistant message
      if (accumulatedText) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: accumulatedText,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted by user');
      } else {
        console.error('Chat error:', error);
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
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
              <p className="text-xs mt-4 text-muted-foreground/70">
                Press <kbd className="px-1.5 py-0.5 text-xs border rounded">Cmd</kbd> +{' '}
                <kbd className="px-1.5 py-0.5 text-xs border rounded">K</kbd> for quick actions
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
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

          {/* Streaming message */}
          {isLoading && streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[80%] bg-muted rounded-lg px-4 py-2">
                <p className="whitespace-pre-wrap">{streamingContent}</p>
                <span className="inline-block w-2 h-4 ml-1 bg-foreground/50 animate-pulse" />
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && !streamingContent && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
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
  );
}
