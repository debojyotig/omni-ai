/**
 * Chat API Route (Claude Agent SDK)
 *
 * Handles chat requests using Claude Agent SDK with sub-agent delegation.
 * Automatically routes to appropriate specialist based on query intent.
 */

import { NextRequest } from 'next/server';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { mcpServers } from '@/lib/mcp/claude-sdk-mcp-config';
import { subAgentConfigs } from '@/lib/agents/subagent-configs';
import { withHallucinationReduction } from '@/lib/agents/hallucination-reduction';
import { getSystemPromptWithStandardization } from '@/lib/agents/standardized-response-format';
import { getAnthropicConfig, getProviderConfig } from '@/lib/config/server-provider-config';
import { configureProviderForSDK, validateProviderEnvironment } from '@/lib/config/runtime-provider-switch';
import { getSessionStore } from '@/lib/session/simple-session-store';
import type { AgentType } from '@/lib/stores/agent-store';
import type { RuntimeSettings } from '@/lib/stores/provider-store';
import type { ProviderId } from '@/lib/config/server-provider-config';

/**
 * Master Orchestrator Instructions
 *
 * The orchestrator analyzes user intent and automatically delegates to specialized sub-agents.
 */
const MASTER_ORCHESTRATOR_INSTRUCTIONS = getSystemPromptWithStandardization(
  withHallucinationReduction(`You are the Master Orchestrator for omni-ai, an intelligent investigation platform.

**CRITICAL: You are a DELEGATOR ONLY. You do NOT have direct tool access. You MUST delegate ALL tool-using tasks to sub-agents. Never try to call MCP tools yourself - you will fail. Always delegate.**

Your role:
1. Analyze user queries to understand intent
2. Immediately delegate to the appropriate sub-agent:
   - datadog-champion: For DataDog error analysis, performance issues, service health
   - api-correlator: For multi-API data correlation and consistency checks
   - general-investigator: For API exploration, service discovery, and general queries
3. Let the sub-agent execute (they have tool access, you don't)
4. Present the sub-agent's results to the user

**Delegation is MANDATORY**: Every user query requiring data MUST be delegated to a sub-agent. You orchestrate, sub-agents execute.

Example (CORRECT):
User: "What are the top 5 popular movies on TMDB?"
You: "I'll delegate to the general-investigator to query TMDB."
[Delegates immediately - no tool calls from you]

Example (WRONG - DO NOT DO THIS):
User: "What are the top 5 popular movies on TMDB?"
You: *tries to call mcp__omni-api__call_rest_api directly* ← WRONG! You can't do this!
[You have no tool access - delegate instead]`),
  'smart-agent'
);

/**
 * Map UI agent IDs to sub-agent configurations
 */
function getAgentConfiguration(agentType: AgentType) {
  switch (agentType) {
    case 'datadog':
      return {
        systemPrompt: subAgentConfigs['datadog-champion'].prompt, // Already includes hallucination reduction
        agents: undefined, // No sub-delegation when specific agent selected
        description: 'DataDog Champion (Root Cause Analysis)'
      };

    case 'correlator':
      return {
        systemPrompt: subAgentConfigs['api-correlator'].prompt, // Already includes hallucination reduction
        agents: undefined, // No sub-delegation
        description: 'API Correlator (Cross-Service Analysis)'
      };

    case 'smart':
    default:
      return {
        systemPrompt: MASTER_ORCHESTRATOR_INSTRUCTIONS, // Already includes hallucination reduction
        agents: subAgentConfigs, // Enable automatic delegation (sub-agents already have reduction)
        description: 'Smart Agent (Auto-routing with sub-agents)'
      };
  }
}

/**
 * POST /api/chat
 *
 * Handles chat messages with streaming support via Server-Sent Events (SSE)
 *
 * Request body:
 * {
 *   message: string (required)
 *   agent?: 'smart' | 'datadog' | 'correlator'
 *   threadId?: string
 *   resourceId?: string
 *   providerId?: string (for model config)
 *   modelId?: string (for model config)
 *   modelConfig?: {
 *     providerId: string
 *     modelId: string
 *     maxOutputTokens: number
 *     temperature: number
 *     maxIterations: number
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      agent,
      threadId,
      resourceId,
      providerId,
      modelId,
      modelConfig
    } = body;

    // Validate inputs
    if (!message || !message.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Default resourceId to 'default-user' if not provided
    const finalResourceId = resourceId || 'default-user';
    const finalThreadId = threadId || `thread-${Date.now()}`;

    // Agent configuration
    const agentType = (agent || 'smart') as AgentType;
    const agentConfig = getAgentConfiguration(agentType);

    console.log(`[CHAT] Agent: ${agentConfig.description}, Thread: ${finalThreadId}, Resource: ${finalResourceId}`);

    // Provider configuration with runtime switching
    // Extract provider from modelConfig if provided, otherwise use Anthropic default
    let currentProviderId: ProviderId = 'anthropic';
    if (providerId) {
      currentProviderId = (providerId as ProviderId);
      console.log(`[CHAT] Provider: ${currentProviderId}`);
    }

    // Configure Claude Agent SDK for the selected provider
    configureProviderForSDK(currentProviderId);

    // Validate provider environment
    const providerValidation = validateProviderEnvironment(currentProviderId);
    if (!providerValidation.valid) {
      console.warn(`[CHAT] Provider validation failed: ${providerValidation.missingVars.join(', ')}`);
    }

    // Get full provider configuration including available models
    const fullProviderConfig = getProviderConfig();
    const anthropicConfig = getAnthropicConfig();

    // Log available models for debugging
    console.log(`[CHAT] Provider: ${currentProviderId}, Available models:`, fullProviderConfig.models);
    if (modelId) {
      const isAllowedModel = fullProviderConfig.models.includes(modelId);
      console.log(`[CHAT] Selected model: ${modelId}, Is allowed: ${isAllowedModel}`);
      if (!isAllowedModel) {
        console.warn(`[CHAT] ⚠️ WARNING: Model ${modelId} is NOT in the allowed list for ${currentProviderId}!`);
        console.warn(`[CHAT] Allowed models: ${fullProviderConfig.models.join(', ')}`);
      }
    }
    process.env.ANTHROPIC_API_KEY = anthropicConfig.apiKey;
    if (anthropicConfig.baseURL) {
      process.env.ANTHROPIC_BASE_URL = anthropicConfig.baseURL;
      console.log(`[CHAT] Using gateway: ${anthropicConfig.baseURL}`);
    } else {
      delete process.env.ANTHROPIC_BASE_URL; // Use default Anthropic API
      console.log('[CHAT] Using direct Anthropic API');
    }

    // Get session store
    const sessionStore = getSessionStore();

    // Try to get existing session ID
    let sessionId = await sessionStore.getSessionId(finalThreadId, finalResourceId);

    if (sessionId) {
      console.log(`[CHAT] Resuming session: ${sessionId}`);
    } else {
      console.log('[CHAT] Starting new session');
    }

    // Apply model configuration if provided
    let maxTurns = 10; // Default
    let modelConfigInfo = '';

    if (modelConfig) {
      maxTurns = modelConfig.maxIterations || 10;
      modelConfigInfo = `Model: ${modelId}, Tokens: ${modelConfig.maxOutputTokens}, Temp: ${modelConfig.temperature}, Iterations: ${modelConfig.maxIterations}`;
      console.log(`[CHAT] ${modelConfigInfo}`);
    }

    // Execute query with Claude SDK
    const result = query({
      prompt: message,
      options: {
        resume: sessionId || undefined, // Resume existing conversation or undefined for new
        systemPrompt: agentConfig.systemPrompt,
        agents: agentConfig.agents,
        mcpServers,
        maxTurns: maxTurns,
        // Grant permission to all MCP tools (omni-api)
        canUseTool: async (toolName: string, input: any) => {
          // Allow all omni-api-mcp tools automatically
          if (toolName.startsWith('mcp__omni-api__')) {
            return { behavior: 'allow' as const, updatedInput: input };
          }
          // Deny other tools (shouldn't happen, but safety first)
          return { behavior: 'deny' as const, message: 'Only omni-api tools are allowed' };
        }
      }
    });

    // Stream response as Server-Sent Events
    const encoder = new TextEncoder();
    let capturedSessionId: string | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result) {
            // Capture session ID from first chunk
            if (chunk.type === 'system' && chunk.subtype === 'init' && chunk.session_id) {
              capturedSessionId = chunk.session_id;
              console.log(`[CHAT] Session ID: ${capturedSessionId}`);

              // Save session mapping if new (only if we didn't already have a sessionId)
              if (!sessionId) {
                await sessionStore.saveSessionId(finalThreadId, finalResourceId, capturedSessionId);
                console.log(`[CHAT] Saved session mapping: ${finalThreadId} → ${capturedSessionId}`);
              }
            }

            // Send each chunk as SSE (check if controller is still open)
            try {
              const data = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(data));
            } catch (enqueueError) {
              // Controller is closed, client disconnected - stop processing
              console.log('[CHAT] Client disconnected, stopping stream');
              break;
            }

            // Log tool usage (debug)
            if (chunk.type === 'assistant') {
              const toolUses = chunk.message?.content?.filter((c: any) => c.type === 'tool_use') || [];
              if (toolUses.length > 0) {
                console.log(`[CHAT] Tools called: ${toolUses.map((t: any) => t.name).join(', ')}`);
              }
            }
          }

          try {
            controller.close();
          } catch (closeError) {
            // Already closed, that's fine
          }
        } catch (error) {
          console.error('[CHAT] Stream error:', error);
          try {
            controller.error(error);
          } catch (errorError) {
            // Controller already closed, ignore
          }
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
  } catch (error: any) {
    console.error('[CHAT] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
