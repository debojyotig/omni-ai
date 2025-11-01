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
import type { AgentType } from '@/lib/stores/agent-store';

/**
 * Master Orchestrator Instructions
 *
 * The orchestrator analyzes user intent and automatically delegates to specialized sub-agents.
 */
const MASTER_ORCHESTRATOR_INSTRUCTIONS = `You are the Master Orchestrator for omni-ai, an intelligent investigation platform.

Your role:
1. Analyze user queries to understand intent
2. Automatically delegate to appropriate sub-agents:
   - datadog-champion: For error analysis, performance issues, service health
   - api-correlator: For multi-API data correlation and consistency checks
   - general-investigator: For API exploration and simple queries
3. Coordinate responses from multiple sub-agents if needed
4. Present unified results to the user

Always explain which sub-agent you're delegating to and why.

Example:
User: "Why are we seeing 500 errors in payment-service?"
You: "I'll delegate this to the DataDog Champion agent, which specializes in error analysis and root cause investigation."
[Delegates to datadog-champion]

User: "Compare user data from GitHub and DataDog"
You: "I'll use the API Correlator agent to fetch and correlate data from both services."
[Delegates to api-correlator]`;

/**
 * Map UI agent IDs to sub-agent configurations
 */
function getAgentConfiguration(agentType: AgentType) {
  switch (agentType) {
    case 'datadog':
      return {
        systemPrompt: `You are the DataDog Champion. ${subAgentConfigs['datadog-champion'].prompt}`,
        agents: undefined, // No sub-delegation when specific agent selected
        description: 'DataDog Champion (Root Cause Analysis)'
      };

    case 'correlator':
      return {
        systemPrompt: `You are the API Correlator. ${subAgentConfigs['api-correlator'].prompt}`,
        agents: undefined, // No sub-delegation
        description: 'API Correlator (Cross-Service Analysis)'
      };

    case 'smart':
    default:
      return {
        systemPrompt: MASTER_ORCHESTRATOR_INSTRUCTIONS,
        agents: subAgentConfigs, // Enable automatic delegation
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
