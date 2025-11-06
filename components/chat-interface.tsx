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
import { useAgentStore } from '@/lib/stores/agent-store';
import { useProviderStore } from '@/lib/stores/provider-store';
import { useProgressStore } from '@/lib/stores/progress-store';
import { useConversationStore } from '@/lib/stores/conversation-store';
import { useActivityStore } from '@/lib/stores/activity-store';
import { ChatMessage } from '@/components/chat-message';
import { StreamParser, getHintFromChunk } from '@/lib/claude-sdk/stream-parser';
import { ErrorMessage } from '@/components/error-message';
import { formatActivityTitle, formatActivityDescription, getActivityIcon, generatePlanningGist } from '@/lib/utils/activity-formatter';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track step IDs for completion
  const planningStepRef = useRef<string | null>(null);
  const toolStepsRef = useRef<Map<string, { stepId: string; startTime: number }>>(new Map());
  const todoStepsRef = useRef<Map<string, { stepId: string }>>(new Map());

  const { selectedAgent } = useAgentStore();
  const { selectedProviderId, selectedModelId, getActiveModelSettings, getModelSettings } = useProviderStore();
  const [modelSettings, setModelSettings] = useState<any>(null);
  const { setRunning, setHint, reset: resetProgress } = useProgressStore();
  const {
    activeConversationId,
    addMessage,
    getActiveConversation,
    syncAddMessage,
    syncUpdateConversationTitle,
  } = useConversationStore();
  const { addStep, completeStep, clearSteps, setThreadId } = useActivityStore();

  // Get active conversation and its messages
  const activeConversation = getActiveConversation();
  const messages = isMounted ? (activeConversation?.messages ?? []) : [];

  // Hydration and initial conversation setup
  useEffect(() => {
    setIsMounted(true);

    // Wait for store to rehydrate from localStorage before loading from database
    // NOTE: Empty dependency array - this runs ONCE on mount only
    // Uses getState() to access fresh store state without creating dependencies
    const checkRehydration = async () => {
      const state = useConversationStore.getState() as any;
      if (state._hasHydrated) {
        // Load conversations from database
        const { loadFromDatabase: loadDB, createConversation: createConv, syncCreateConversation: syncCreate } = useConversationStore.getState() as any;
        await loadDB('default-user');

        const updatedState = useConversationStore.getState() as any;
        if (updatedState.conversations.length === 0) {
          const newConversationId = createConv();
          // Sync the newly created conversation to database
          const newState = useConversationStore.getState() as any;
          const newConversation = newState.conversations.find((c: any) => c.id === newConversationId);
          if (newConversation) {
            await syncCreate(newConversationId, newConversation.title, 'default-user');
          }
        }
        // Clear activity state on initial hydration
        clearSteps();
        const activityState = useActivityStore.getState();
        activityState.setOpen(false);
      } else {
        // Check again after a short delay
        setTimeout(checkRehydration, 50);
      }
    };
    checkRehydration();
  }, [clearSteps]); // Only depends on clearSteps which is stable

  // Load model settings when model selection changes
  useEffect(() => {
    if (selectedProviderId && selectedModelId) {
      const settings = getModelSettings(selectedProviderId, selectedModelId);
      setModelSettings(settings);
    }
  }, [selectedProviderId, selectedModelId, getModelSettings]);

  // Clear activity and streaming state when switching conversations
  // NOTE: We do NOT abort the request - it continues in background and completes when switched back
  useEffect(() => {
    if (activeConversationId) {
      // Clear streaming state from previous conversation
      setStreamingContent('');

      // Reset loading state (visual indicator)
      setIsLoading(false);

      // Clear activity steps and close panel for new conversation
      setThreadId(activeConversationId);
      const { setOpen } = useActivityStore.getState();
      setOpen(false); // Close activity panel when switching conversations
    }
  }, [activeConversationId, setThreadId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
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

    // Capture conversation ID at send time - CRITICAL: must stay fixed for entire request
    const messageConversationId = activeConversationId;

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: input,
      timestamp: Date.now(),
    };

    addMessage(messageConversationId, userMessage);

    // Sync user message to database (fire and forget)
    syncAddMessage(messageConversationId, userMessage, 'default-user').catch(err => {
      console.error('[ChatInterface] Failed to sync user message:', err)
    });

    // Immediately sync the auto-generated conversation title to database
    // (title was auto-generated when addMessage was called)
    const conversationState = useConversationStore.getState() as any;
    const conversation = conversationState.conversations.find((c: any) => c.id === messageConversationId);
    if (conversation && conversation.title !== 'New Conversation') {
      // Only sync if title was actually generated (not the default)
      syncUpdateConversationTitle(messageConversationId, conversation.title, 'default-user').catch(err => {
        console.error('[ChatInterface] Failed to sync conversation title on send:', err);
      });
    }

    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setRunning(true);
    setStreamingContent('');
    setError(null); // Clear previous errors

    // Clear previous activity steps, set thread ID, and open activity panel
    clearSteps();
    setThreadId(messageConversationId);
    toolStepsRef.current.clear();
    todoStepsRef.current.clear();
    const { setOpen } = useActivityStore.getState();
    setOpen(true); // Auto-open activity panel for new messages

    const controller = new AbortController();
    setAbortController(controller);

    try {
      setHint('Connecting to agent...');

      // Add initial thinking step with planning gist
      const { steps } = useActivityStore.getState();
      const initialStepCount = steps.length;
      const planningGist = generatePlanningGist(currentInput);
      addStep({
        type: 'thinking',
        title: 'Planning',
        description: planningGist,
        status: 'running',
        icon: 'spinner',
      });

      // Get the ID of the step we just added
      const updatedSteps = useActivityStore.getState().steps;
      if (updatedSteps.length > initialStepCount) {
        planningStepRef.current = updatedSteps[updatedSteps.length - 1].id;
      }

      // Get current model settings
      const modelSettings = getActiveModelSettings();

      // Call API with SSE streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          agent: selectedAgent,
          threadId: messageConversationId, // Use captured conversation ID as thread ID
          resourceId: 'default-user', // User identifier (can be enhanced later)
          providerId: selectedProviderId,
          modelId: selectedModelId,
          modelConfig: selectedProviderId && selectedModelId ? {
            providerId: selectedProviderId,
            modelId: selectedModelId,
            maxOutputTokens: modelSettings.maxOutputTokens,
            temperature: modelSettings.temperature,
            maxIterations: modelSettings.maxIterations,
          } : undefined,
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

            // Debug: Log raw chunk structure
            if (rawChunk.type === 'assistant' && rawChunk.message?.content) {
              const contentTypes = rawChunk.message.content.map((c: any) => c.type).join(', ');
              console.log(`[STREAM DEBUG] Assistant chunk with content types: ${contentTypes}`);
            }

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
                // Update streaming content with displayed text (planning filtered out)
                if (parsedChunk.content.length > 0) {
                  console.log(`[STREAM] Text chunk received, length: ${parsedChunk.content.length}, displayed: ${parsedChunk.displayedText.length}`);
                }
                // Display only filtered text (planning/reasoning removed)
                setStreamingContent(parsedChunk.displayedText);
                break;

              case 'tool_use':
                // Tool call detected - add to activity panel with formatted name
                const toolName = parsedChunk.displayName || 'Tool execution';
                const formattedTitle = formatActivityTitle(toolName, parsedChunk.input);
                const formattedDescription = formatActivityDescription(toolName, parsedChunk.input);
                const icon = getActivityIcon(toolName, parsedChunk.input);

                console.log(`[STREAM] Tool called: ${toolName} -> ${formattedTitle}`);

                // Complete planning step if this is the first tool
                if (planningStepRef.current && toolStepsRef.current.size === 0) {
                  const planningStartTime = useActivityStore.getState().steps.find(
                    s => s.id === planningStepRef.current
                  )?.timestamp || Date.now();
                  completeStep(planningStepRef.current, Date.now() - planningStartTime);
                  planningStepRef.current = null;
                }

                // Get current step count before adding
                const currentSteps = useActivityStore.getState().steps;
                const currentStepCount = currentSteps.length;

                // Add step to activity panel with human-readable description
                addStep({
                  type: 'tool_call',
                  title: formattedTitle,
                  description: formattedDescription,
                  status: 'running',
                  icon: icon,
                  metadata: {
                    toolId: parsedChunk.id,
                    toolName: toolName,
                    input: parsedChunk.input,
                  },
                });

                // Track the new step ID
                const newSteps = useActivityStore.getState().steps;
                if (newSteps.length > currentStepCount) {
                  const newStepId = newSteps[newSteps.length - 1].id;
                  toolStepsRef.current.set(parsedChunk.id, {
                    stepId: newStepId,
                    startTime: Date.now(),
                  });
                }
                break;

              case 'tool_result':
                // Tool execution completed - mark step as done
                const toolStepInfo = toolStepsRef.current.get(parsedChunk.toolUseId);
                if (toolStepInfo) {
                  const duration = Date.now() - toolStepInfo.startTime;
                  completeStep(toolStepInfo.stepId, duration);
                  toolStepsRef.current.delete(parsedChunk.toolUseId);
                  console.log(`[STREAM] Tool completed: ${parsedChunk.name} (${duration}ms), stepId: ${toolStepInfo.stepId}`);
                } else {
                  console.warn(`[STREAM] Tool result received but no step found for toolUseId: ${parsedChunk.toolUseId}`);
                }
                break;

              case 'todo':
                // Handle TodoWrite chunks from Claude SDK
                console.log(`[STREAM] Todo chunk received with ${parsedChunk.todos.length} items`);

                for (const todo of parsedChunk.todos) {
                  const todoKey = `todo:${todo.content}`; // Unique key for this todo

                  // Only process in_progress and completed todos
                  if (todo.status === 'in_progress' || todo.status === 'completed') {
                    if (!todoStepsRef.current.has(todoKey)) {
                      // New todo - add it as a step
                      const currentSteps = useActivityStore.getState().steps;
                      const currentStepCount = currentSteps.length;

                      addStep({
                        type: 'analysis',
                        title: todo.content,
                        description: todo.activeForm,
                        status: todo.status === 'in_progress' ? 'running' : 'done',
                        icon: todo.status === 'completed' ? 'check' : 'dot',
                      });

                      const newSteps = useActivityStore.getState().steps;
                      if (newSteps.length > currentStepCount) {
                        const newStepId = newSteps[newSteps.length - 1].id;
                        todoStepsRef.current.set(todoKey, { stepId: newStepId });
                        console.log(`[STREAM] Added todo step: ${todo.content} (${newStepId})`);
                      }
                    } else {
                      // Existing todo - update its status if it changed to completed
                      const stepInfo = todoStepsRef.current.get(todoKey);
                      if (stepInfo && todo.status === 'completed') {
                        completeStep(stepInfo.stepId, 0);
                        console.log(`[STREAM] Completed todo step: ${todo.content} (${stepInfo.stepId})`);
                      }
                    }
                  }
                }
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
                  // If completion message contains important info (e.g., max iterations), show it
                  if (parsedChunk.message && parsedChunk.message.includes('maximum iteration')) {
                    console.log('[STREAM] System completion message:', parsedChunk.message);
                    // Display max iterations warning as a hint that persists briefly
                    setHint(`⚠️ ${parsedChunk.message}`);
                  } else {
                    // Clear hint on normal completion
                    setHint(null);
                  }
                }
                break;
            }
          } catch (parseError) {
            console.error('Failed to parse SSE chunk:', parseError);
          }
        }
      }

      // Add final assistant message with displayed text (planning/reasoning filtered out)
      const finalText = parser.getDisplayedText();
      if (finalText && messageConversationId) {
        const assistantMessage = {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: finalText,
          timestamp: Date.now(),
        };
        addMessage(messageConversationId, assistantMessage);
        // Sync assistant message to database (fire and forget)
        syncAddMessage(messageConversationId, assistantMessage, 'default-user').catch(err => {
          console.error('[ChatInterface] Failed to sync assistant message:', err)
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted by user');
      } else {
        console.error('Chat error:', error);
        // Set error state to display ErrorMessage component
        setError(error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      // Complete any remaining running steps
      const currentSteps = useActivityStore.getState().steps;
      let totalDuration = 0;

      currentSteps.forEach((step) => {
        if (step.status === 'running') {
          const duration = Date.now() - step.timestamp;
          completeStep(step.id, duration);
        }
      });

      // Calculate total thinking time
      if (currentSteps.length > 0) {
        const firstStep = currentSteps[0];
        totalDuration = Date.now() - firstStep.timestamp;

        // Add "Thought for Xs" summary
        addStep({
          type: 'complete',
          title: `Thought for ${(totalDuration / 1000).toFixed(0)}s`,
          status: 'done',
          icon: 'check',
        });
      }

      // Clear refs
      planningStepRef.current = null;
      toolStepsRef.current.clear();

      setIsLoading(false);
      setRunning(false);
      setStreamingContent('');
      setHint(null);
      setAbortController(null);
      resetProgress();

      // Title syncing now happens immediately when first message is sent (line 158-167)
      // No need to sync again here
    }
  };

  // Check if we should center the input (empty state with no messages and not loading)
  const shouldCenterInput = messages.length === 0 && !isLoading;

  return (
    <div className="h-full w-full flex flex-col relative">
      {shouldCenterInput ? (
        // Empty state: Centered input like ChatGPT
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            <div className="text-center text-muted-foreground mb-12">
              <p className="text-2xl font-semibold text-foreground mb-2">Ask me anything about your services</p>
              <p className="text-sm">
                I can investigate errors, correlate data, and more.
              </p>
            </div>

            {/* Centered Input */}
            <div className="relative flex items-center">
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
                className="w-full h-[40px] min-h-[40px] max-h-[200px] resize-none rounded-[24px] px-5 py-2 pr-14 border border-input bg-background focus:border-ring focus:ring-1 focus:ring-ring transition-all duration-200 ease-in-out"
                disabled={isLoading}
                aria-label="Message input"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim()}
                variant="ghost"
                size="icon"
                className="absolute right-2.5 top-2 h-8 w-8 rounded-full hover:bg-muted disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs mt-4 text-center text-muted-foreground/70">
              Press <kbd className="px-1.5 py-0.5 text-xs border rounded">Cmd</kbd> +{' '}
              <kbd className="px-1.5 py-0.5 text-xs border rounded">K</kbd> for quick actions
            </p>
          </div>
        </div>
      ) : (
        // Active chat: Messages with independent scroll + floating input
        <>
          {/* Messages - Full height scrollable area */}
          <div className="absolute inset-0 overflow-y-auto" ref={scrollRef}>
            <div className="pb-40">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                />
              ))}

              {/* Streaming assistant message */}
              {isLoading && streamingContent && (
                <ChatMessage
                  key="streaming-message"
                  role="assistant"
                  content={streamingContent}
                  isStreaming
                />
              )}

              {/* Thinking indicator - clickable to toggle activity panel */}
              {isLoading && (
                <div className="max-w-3xl mx-auto px-4">
                  <div className="flex items-center gap-4 py-6">
                    <div className="h-8 w-8" /> {/* Spacer for avatar alignment */}
                    <button
                      onClick={() => {
                        const { isOpen, setOpen } = useActivityStore.getState()
                        setOpen(!isOpen)
                      }}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1 px-2 rounded hover:bg-muted group"
                      title="Toggle activity panel"
                    >
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs">Thinking...</span>
                      <span className="text-xs opacity-50 group-hover:opacity-100 transition-opacity">›</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="max-w-3xl mx-auto px-4 py-6">
                  <ErrorMessage
                    error={error}
                    title="Failed to get response"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Gradient fade effect - masks content scrolling behind input */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background to-transparent pointer-events-none z-10" />

          {/* Input - Fixed floating at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-background z-20">
            <div className="max-w-3xl mx-auto px-4 pb-5 pt-2">
              <div className="relative flex items-start">
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
                  className="w-full h-[40px] min-h-[40px] max-h-[200px] resize-none rounded-[24px] px-5 py-2 pr-14 border border-input bg-background focus:border-ring focus:ring-1 focus:ring-ring transition-all duration-200 ease-in-out"
                  disabled={isLoading}
                  aria-label="Message input"
                />
                {isLoading ? (
                  <Button
                    onClick={handleStop}
                    variant="ghost"
                    size="icon"
                    className="absolute right-2.5 top-2 h-8 w-8 rounded-full hover:bg-muted"
                  >
                    <StopCircle className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    variant="ghost"
                    size="icon"
                    className="absolute right-2.5 top-2 h-8 w-8 rounded-full hover:bg-muted disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {/* Settings Badge */}
              {modelSettings && (
                <div className="text-xs text-muted-foreground mt-2 ml-1">
                  {selectedModelId} ({modelSettings.maxOutputTokens}t, {modelSettings.temperature.toFixed(1)}°)
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
