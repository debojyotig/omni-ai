/**
 * Fork Session API
 *
 * Creates a new conversation thread branching from an existing session.
 * The new thread starts with the same context as the parent but evolves independently.
 */

import { NextRequest } from 'next/server';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { mcpServers } from '@/lib/mcp/claude-sdk-mcp-config';
import { subAgentConfigs } from '@/lib/agents/subagent-configs';
import { withHallucinationReduction } from '@/lib/agents/hallucination-reduction';
import { getAnthropicConfig } from '@/lib/config/server-provider-config';
import { getSessionStore } from '@/lib/session/simple-session-store';
import type { AgentType } from '@/lib/stores/agent-store';

/**
 * Map UI agent IDs to sub-agent configurations
 */
function getAgentConfiguration(agentType: AgentType) {
  const MASTER_ORCHESTRATOR_INSTRUCTIONS = withHallucinationReduction(`You are the Master Orchestrator for omni-ai, an intelligent investigation platform.

**CRITICAL: You are a DELEGATOR ONLY. You do NOT have direct tool access. You MUST delegate ALL tool-using tasks to sub-agents. Never try to call MCP tools yourself - you will fail. Always delegate.**

Your role:
1. Analyze user queries to understand intent
2. Immediately delegate to the appropriate sub-agent:
   - datadog-champion: For DataDog error analysis, performance issues, service health
   - api-correlator: For multi-API data correlation and consistency checks
   - general-investigator: For API exploration, service discovery, and general queries
3. Let the sub-agent execute (they have tool access, you don't)
4. Present the sub-agent's results to the user

**Delegation is MANDATORY**: Every user query requiring data MUST be delegated to a sub-agent. You orchestrate, sub-agents execute.`);

  switch (agentType) {
    case 'datadog':
      return {
        systemPrompt: subAgentConfigs['datadog-champion'].prompt,
        agents: undefined,
        description: 'DataDog Champion (Root Cause Analysis)'
      };

    case 'correlator':
      return {
        systemPrompt: subAgentConfigs['api-correlator'].prompt,
        agents: undefined,
        description: 'API Correlator (Cross-Service Analysis)'
      };

    case 'smart':
    default:
      return {
        systemPrompt: MASTER_ORCHESTRATOR_INSTRUCTIONS,
        agents: subAgentConfigs,
        description: 'Smart Agent (Auto-routing with sub-agents)'
      };
  }
}

/**
 * POST /api/chat/fork
 *
 * Forks a conversation from an existing thread, creating a new branch
 */
export async function POST(req: NextRequest) {
  try {
    const { message, agent, threadId, resourceId, forkFromThreadId } = await req.json();

    // Validate inputs
    if (!message || !message.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!forkFromThreadId) {
      return new Response(
        JSON.stringify({ error: 'forkFromThreadId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Default values
    const finalResourceId = resourceId || 'default-user';
    const finalThreadId = threadId || `fork-${Date.now()}`;

    // Agent configuration
    const agentType = (agent || 'smart') as AgentType;
    const agentConfig = getAgentConfiguration(agentType);

    console.log(`[FORK] Agent: ${agentConfig.description}`);
    console.log(`[FORK] Fork from: ${forkFromThreadId} → New: ${finalThreadId}`);

    // Configure provider
    const providerConfig = getAnthropicConfig();
    process.env.ANTHROPIC_API_KEY = providerConfig.apiKey;
    if (providerConfig.baseURL) {
      process.env.ANTHROPIC_BASE_URL = providerConfig.baseURL;
      console.log(`[FORK] Using gateway: ${providerConfig.baseURL}`);
    } else {
      delete process.env.ANTHROPIC_BASE_URL;
      console.log('[FORK] Using direct Anthropic API');
    }

    // Get session store
    const sessionStore = getSessionStore();

    // Get parent session ID
    const parentSessionId = await sessionStore.getSessionId(forkFromThreadId, finalResourceId);

    if (!parentSessionId) {
      return new Response(
        JSON.stringify({ error: 'Parent session not found. Cannot fork from non-existent thread.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[FORK] Parent session: ${parentSessionId}`);

    // Execute query with Claude SDK, resuming from parent session
    // Note: Claude SDK will handle session forking internally
    // Each new session created from resume will be independent
    const result = query({
      prompt: message,
      options: {
        resume: parentSessionId, // Start from parent's context
        systemPrompt: agentConfig.systemPrompt,
        agents: agentConfig.agents,
        mcpServers,
        maxTurns: 10,
        canUseTool: async (toolName: string, input: any) => {
          if (toolName.startsWith('mcp__omni-api__')) {
            return { behavior: 'allow' as const, updatedInput: input };
          }
          return { behavior: 'deny' as const, message: 'Only omni-api tools are allowed' };
        }
      }
    });

    // Stream response and capture new session ID
    const encoder = new TextEncoder();
    let forkedSessionId: string | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result) {
            // Capture forked session ID from first chunk
            if (chunk.type === 'system' && chunk.subtype === 'init' && chunk.session_id) {
              forkedSessionId = chunk.session_id;
              console.log(`[FORK] New session ID: ${forkedSessionId}`);

              // Save new session mapping
              await sessionStore.saveSessionId(finalThreadId, finalResourceId, forkedSessionId);
              console.log(`[FORK] Saved fork: ${finalThreadId} → ${forkedSessionId}`);
            }

            // Send each chunk as SSE
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(data));

            // Log tool usage
            if (chunk.type === 'assistant') {
              const toolUses = chunk.message?.content?.filter((c: any) => c.type === 'tool_use') || [];
              if (toolUses.length > 0) {
                console.log(`[FORK] Tools called: ${toolUses.map((t: any) => t.name).join(', ')}`);
              }
            }
          }

          controller.close();
        } catch (error) {
          console.error('[FORK] Stream error:', error);
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
  } catch (error: any) {
    console.error('[FORK] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
