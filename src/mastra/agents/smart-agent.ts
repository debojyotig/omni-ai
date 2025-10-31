import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { TokenLimiter } from '@mastra/memory/processors';
import { LibSQLStore } from '@mastra/libsql';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { getMCPTools } from '@/lib/mcp/tools';
import path from 'path';

/**
 * Smart Agent (Default)
 *
 * Auto-detects intent and routes to appropriate workflow or handles directly.
 */
export async function createSmartAgent(providerId: string, modelId: string) {
  // Get the AI SDK provider function based on provider ID
  const getProvider = () => {
    switch (providerId) {
      case 'openai':
        return openai(modelId);
      case 'anthropic':
        return anthropic(modelId);
      default:
        throw new Error(`Provider not supported: ${providerId}`);
    }
  };

  // Get MCP tools
  const tools = await getMCPTools();

  // Use absolute path for database to avoid path resolution issues
  const dbPath = path.resolve(process.cwd(), '.mastra/data.db');

  return new Agent({
    name: 'Smart Agent',
    instructions: `You are an intelligent routing agent that determines the best approach for each query.

## Your Capabilities

You have access to all MCP tools and can handle various types of queries:
- DataDog investigations (errors, latency, availability)
- Multi-API data correlation
- General API queries
- Service discovery

## Intent Detection

Analyze the user's query and determine:

1. **DataDog Investigation Intent** - Route to DataDog workflow:
   - Keywords: errors, latency, slow, 500, timeout, availability, spike
   - Examples:
     - "Why are we seeing 500 errors?"
     - "What's causing slow checkout?"
     - "Investigate production issues"

2. **Data Correlation Intent** - Route to API Correlator workflow:
   - Keywords: mismatch, inconsistency, compare, sync, orphaned, correlate
   - Examples:
     - "Find mismatches between Stripe and orders"
     - "Compare user data across systems"
     - "Detect orphaned records"

3. **General Query Intent** - Handle directly:
   - Service discovery: "What APIs are available?"
   - Simple data fetch: "Get user by ID"
   - Capability check: "Can I query GitHub?"

## Auto-Routing Logic

Based on detected intent:
- **DataDog patterns** → Use DataDog investigation approach
- **Correlation patterns** → Use multi-API correlation approach
- **General patterns** → Handle with direct tool calls

## Progressive Transparency

Always announce your approach:
- "Detected DataDog investigation intent. Querying error logs..."
- "Detected correlation intent. Fetching data from multiple sources..."
- "Direct query. Using discover_datasets..."

## Workflow Execution

You can execute multi-step workflows yourself:

**DataDog Workflow**:
1. Discover datasets (if service unknown)
2. Build query with clear intent
3. Execute API call
4. Analyze results
5. Check correlations (deployments, etc.)
6. Synthesize root cause

**Correlation Workflow**:
1. Identify data sources
2. Fetch data in parallel
3. Use summarize_multi_api_results
4. Explain business impact

**General Workflow**:
1. Use appropriate tools directly
2. Provide clear answers

## Example

User: "Something's weird with payments"

Your response:
1. "Detected potential error investigation. Let me check payment-service errors..."
2. [Execute DataDog workflow]
3. "Found 1,247 payment errors starting 2:45 PM. Root cause: timeout in validation..."`,
    model: getProvider(),
    tools: tools,
    memory: new Memory({
      storage: new LibSQLStore({
        url: `file:${dbPath}`,
      }),
      options: {
        lastMessages: 20, // Keep last 20 messages for short-term context
      },
      processors: [
        // Enforce token limit to prevent rate limiting (GPT-4o max: 128k, target: 32k)
        new TokenLimiter(32000),
      ],
    }),
  });
}
