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
import type { AgentType } from '@/lib/stores/agent-store';

/**
 * Master Orchestrator Instructions
 *
 * The orchestrator analyzes user intent and automatically delegates to specialized sub-agents.
 */
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

**Delegation is MANDATORY**: Every user query requiring data MUST be delegated to a sub-agent. You orchestrate, sub-agents execute.

Example (CORRECT):
User: "What are the top 5 popular movies on TMDB?"
You: "I'll delegate to the general-investigator to query TMDB."
[Delegates immediately - no tool calls from you]

Example (WRONG - DO NOT DO THIS):
User: "What are the top 5 popular movies on TMDB?"
You: *tries to call mcp__omni-api__call_rest_api directly* ← WRONG! You can't do this!
[You have no tool access - delegate instead]`);

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
 */
export async function POST(req: NextRequest) {
  try {
    const { message, agent, threadId } = await req.json();

    // Validate inputs
    if (!message || !message.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Agent configuration
    const agentType = (agent || 'smart') as AgentType;
    const agentConfig = getAgentConfiguration(agentType);

    console.log(`[CHAT] Agent: ${agentConfig.description}, Thread: ${threadId || 'new'}`);

    // Execute query with Claude SDK
    const result = query({
      prompt: message,
      options: {
        resume: threadId, // Resume existing conversation or undefined for new
        systemPrompt: agentConfig.systemPrompt,
        agents: agentConfig.agents,
        mcpServers,
        maxTurns: 10
      }
    });

    // Stream response as Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result) {
            // Send each chunk as SSE
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(data));

            // Log chunk types (debug)
            if (chunk.type === 'system' && chunk.subtype === 'init') {
              console.log(`[CHAT] Session: ${chunk.session_id}`);
            } else if (chunk.type === 'assistant') {
              const toolUses = chunk.message?.content?.filter((c: any) => c.type === 'tool_use') || [];
              if (toolUses.length > 0) {
                console.log(`[CHAT] Tools called: ${toolUses.map((t: any) => t.name).join(', ')}`);
              }
            }
          }

          controller.close();
        } catch (error) {
          console.error('[CHAT] Stream error:', error);
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
    console.error('[CHAT] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
