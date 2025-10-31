import { NextRequest, NextResponse } from 'next/server';
import { createDataDogChampion } from '@/src/mastra/agents/datadog-champion';
import { createAPICorrelator } from '@/src/mastra/agents/api-correlator';
import { createSmartAgent } from '@/src/mastra/agents/smart-agent';
import type { AgentType } from '@/lib/stores/agent-store';

/**
 * Chat API Route
 *
 * Handles chat requests using selected agent with Mastra memory.
 * Agents are created on-demand with the specified provider and model.
 */
export async function POST(req: NextRequest) {
  try {
    const { message, agent, provider, model, threadId } = await req.json();

    // Validate inputs
    if (!message || !message.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Message is required',
        },
        { status: 400 }
      );
    }

    if (!provider || !model) {
      return NextResponse.json(
        {
          success: false,
          error: 'Provider and model are required',
        },
        { status: 400 }
      );
    }

    // Debug: Check if API key is loaded
    console.log('[DEBUG] Environment check:', {
      provider,
      model,
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      keyPrefix: process.env.ANTHROPIC_API_KEY?.substring(0, 15) || 'NOT_SET'
    });

    // Select agent based on type
    let selectedAgent;
    const agentType = (agent || 'smart') as AgentType;

    try {
      switch (agentType) {
        case 'datadog':
          selectedAgent = await createDataDogChampion(provider, model);
          break;
        case 'correlator':
          selectedAgent = await createAPICorrelator(provider, model);
          break;
        case 'smart':
        default:
          selectedAgent = await createSmartAgent(provider, model);
      }
    } catch (error) {
      console.error('Agent creation error:', error);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        { status: 500 }
      );
    }

    // Generate response with Mastra memory
    // Memory automatically loads conversation history from storage
    // resourceId identifies the user, threadId identifies the conversation
    const result = await selectedAgent.generate(
      [{ role: 'user', content: message }],
      {
        threadId: threadId || 'default',
        resourceId: 'default-user', // In production, this would be the actual user ID
      }
    );

    return NextResponse.json({
      success: true,
      response: result.text,
      agent: agentType,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
