import { NextRequest, NextResponse } from 'next/server';
import { createDataDogChampion } from '@/src/mastra/agents/datadog-champion';
import { createAPICorrelator } from '@/src/mastra/agents/api-correlator';
import { createSmartAgent } from '@/src/mastra/agents/smart-agent';
import { getAgentConfig } from '@/lib/stores/agent-config-store';
import type { AgentType } from '@/lib/stores/agent-store';

/**
 * Chat API Route
 *
 * Handles chat requests using selected agent with Mastra memory.
 * Agents are created on-demand with the specified provider, model, and dynamic config.
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

    // Load dynamic agent configuration for this provider/model
    const agentConfig = getAgentConfig(provider, model);
    console.log('[DEBUG] Agent config loaded:', {
      provider,
      model,
      maxOutputTokens: agentConfig.maxOutputTokens,
      temperature: agentConfig.temperature,
      maxIterations: agentConfig.maxIterations
    });

    // Select agent based on type
    let selectedAgent;
    const agentType = (agent || 'smart') as AgentType;

    try {
      switch (agentType) {
        case 'datadog':
          selectedAgent = await createDataDogChampion(provider, model, agentConfig);
          break;
        case 'correlator':
          selectedAgent = await createAPICorrelator(provider, model, agentConfig);
          break;
        case 'smart':
        default:
          selectedAgent = await createSmartAgent(provider, model, agentConfig);
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
    const threadIdValue = threadId || 'default';

    // Debug: Check memory state before generation
    const memory = selectedAgent.memory;
    if (memory) {
      try {
        const { messages } = await memory.query({
          threadId: threadIdValue,
          resourceId: 'default-user',
        });
        console.log(`[TOKEN-DEBUG] Thread: ${threadIdValue}, Message count before generation: ${messages.length}`);
      } catch (err) {
        console.log(`[TOKEN-DEBUG] Could not query memory (thread may not exist yet)`);
      }
    }

    // WORKAROUND: Mastra bug - providerOptions in instructions aren't passed to AI SDK
    // Pass system message with cacheControl as an array to avoid TokenLimiter issues
    const systemInstructions = await selectedAgent.getInstructions();
    const instructionContent = Array.isArray(systemInstructions)
      ? systemInstructions.map(i => typeof i === 'string' ? i : i.content).join('\n\n')
      : typeof systemInstructions === 'string'
        ? systemInstructions
        : systemInstructions.content;

    const result = await selectedAgent.generate(
      [{ role: 'user', content: message }],
      {
        memory: {
          thread: threadIdValue,
          resource: 'default-user', // In production, this would be the actual user ID
        },
        // CRITICAL: Override agent instructions to prevent duplication
        instructions: '', // Empty to prevent Mastra from adding default instructions
        // CRITICAL: Pass system as array with cacheControl to work around Mastra bug
        system: [
          {
            role: 'system',
            content: instructionContent,
            providerOptions: {
              anthropic: {
                cacheControl: { type: 'ephemeral' }, // Cache for 5 minutes
              },
            },
          }
        ] as any, // Type assertion needed due to Mastra types
        // CRITICAL: Override max_tokens correctly in modelSettings
        modelSettings: {
          temperature: agentConfig.temperature,
        },
        providerOptions: {
          anthropic: {
            max_tokens: agentConfig.maxOutputTokens, // Override 64k default
          },
        },
        // Note: maxSteps set in agent's defaultGenerateOptions
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
