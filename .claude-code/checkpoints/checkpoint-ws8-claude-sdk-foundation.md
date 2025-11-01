# WS8: Claude Agent SDK Foundation & MCP Integration

**Status**: ✅ Complete
**Duration**: Completed in 1 session (2025-10-31)
**Dependencies**: WS1-WS7 complete ✅
**Priority**: P0 (CRITICAL - Foundation for migration)

---

## Objective

Replace Mastra with Claude Agent SDK as the core agent framework while maintaining MCP integration with omni-api-mcp. This workstream establishes the foundation for the migration by installing the SDK, configuring MCP servers, and validating end-to-end tool calling.

---

## Context

### Why This Change?

**Current Issues with Mastra**:
1. ❌ Prompt caching broken (providerOptions bug)
2. ❌ Rate limit errors after 2-3 tool calls
3. ❌ Community project with maintenance concerns
4. ❌ Required workarounds for basic features

**Benefits of Claude Agent SDK**:
1. ✅ Native prompt caching (90% cost reduction)
2. ✅ Automatic context compaction
3. ✅ Production-ready (built by Anthropic)
4. ✅ Rich built-in tools (Read, Write, Bash, WebSearch, Grep)
5. ✅ Structured streaming with well-defined chunk types

**Trade-offs Accepted**:
- ❌ No runtime provider switching → User sets provider once, restart to change
- ✅ **This is acceptable** for a bundled local desktop application

### Migration Strategy

See [docs/MASTRA_PARITY_ANALYSIS.md](../../docs/MASTRA_PARITY_ANALYSIS.md) for complete feature comparison.

---

## Tasks

### Task 1: Install Claude Agent SDK

**Goal**: Add @anthropic-ai/claude-agent-sdk package

**Steps**:
1. Install package:
   ```bash
   npm install @anthropic-ai/claude-agent-sdk
   ```

2. Verify installation:
   ```bash
   npm list @anthropic-ai/claude-agent-sdk
   ```

**Validation**:
- [ ] Package appears in package.json dependencies
- [ ] No installation errors
- [ ] TypeScript types resolve correctly

---

### Task 2: Configure MCP Server

**Goal**: Set up omni-api-mcp with Claude Agent SDK

**Steps**:
1. Create MCP configuration file:
   ```typescript
   // lib/mcp/claude-sdk-mcp-config.ts
   import { MCPServerConfig } from '@anthropic-ai/claude-agent-sdk';

   export const omniApiMcpConfig: MCPServerConfig = {
     type: 'stdio',
     command: 'node',
     args: [process.env.OMNI_API_MCP_PATH || '../omni-api-mcp/dist/index.js'],
     env: {
       ...process.env, // Pass all environment variables
     }
   };
   ```

2. Test MCP server starts:
   ```typescript
   // temp-test-ws8-mcp.ts
   import { query } from '@anthropic-ai/claude-agent-sdk';
   import { omniApiMcpConfig } from './lib/mcp/claude-sdk-mcp-config';

   const result = query({
     prompt: 'List available tools',
     options: {
       mcpServers: {
         'omni-api': omniApiMcpConfig
       }
     }
   });

   for await (const chunk of result) {
     console.log('Chunk:', chunk);
   }
   ```

**Validation**:
- [ ] MCP server starts without errors
- [ ] Environment variables passed correctly
- [ ] Tools from omni-api-mcp appear in SDK

**Testing**:
```bash
# Build omni-api-mcp first
cd ../omni-api-mcp && npm run build

# Run test script
cd ../omni-ai
npx tsx temp-test-ws8-mcp.ts

# Clean up after validation
rm temp-test-ws8-mcp.ts
```

---

### Task 3: Create Basic Query Wrapper

**Goal**: Build a simple wrapper around query() for easier testing

**Steps**:
1. Create query wrapper:
   ```typescript
   // lib/claude-sdk/query-wrapper.ts
   import { query } from '@anthropic-ai/claude-agent-sdk';
   import { omniApiMcpConfig } from '../mcp/claude-sdk-mcp-config';

   export async function queryAgent(
     prompt: string,
     options?: {
       systemPrompt?: string;
       maxTurns?: number;
       allowedTools?: string[];
     }
   ) {
     const result = query({
       prompt,
       options: {
         systemPrompt: options?.systemPrompt || {
           type: 'preset',
           preset: 'claude_code'
         },
         maxTurns: options?.maxTurns || 10,
         allowedTools: options?.allowedTools,
         mcpServers: {
           'omni-api': omniApiMcpConfig
         }
       }
     });

     // Collect all chunks
     const chunks: any[] = [];
     for await (const chunk of result) {
       chunks.push(chunk);
     }

     return {
       chunks,
       finalMessage: chunks[chunks.length - 1]
     };
   }
   ```

2. Add TypeScript types:
   ```typescript
   // lib/claude-sdk/types.ts
   export interface QueryResult {
     chunks: any[];
     finalMessage: any;
   }

   export interface QueryOptions {
     systemPrompt?: string;
     maxTurns?: number;
     allowedTools?: string[];
   }
   ```

**Validation**:
- [ ] queryAgent() wrapper compiles
- [ ] Can call with simple prompt
- [ ] Returns chunks and final message

---

### Task 4: Test End-to-End Tool Calling

**Goal**: Verify omni-api-mcp tools work with Claude SDK

**Steps**:
1. Create test script:
   ```typescript
   // temp-test-ws8-tools.ts
   import { queryAgent } from './lib/claude-sdk/query-wrapper';

   async function testToolCalling() {
     console.log('Testing discover_datasets tool...');

     const result = await queryAgent(
       'What APIs are available? Use the discover_datasets tool.',
       {
         systemPrompt: 'You are a helpful assistant. Use tools when appropriate.',
         maxTurns: 5
       }
     );

     console.log('Chunks received:', result.chunks.length);
     console.log('Final message:', JSON.stringify(result.finalMessage, null, 2));
   }

   testToolCalling().catch(console.error);
   ```

2. Run test and verify:
   - Tool is called correctly
   - Response is received
   - No errors occur

**Validation**:
- [ ] discover_datasets tool is called
- [ ] Tool returns service catalog
- [ ] Agent processes tool result
- [ ] Final message shows API list

**Testing**:
```bash
# Run test
npx tsx temp-test-ws8-tools.ts

# Expected output:
# - Chunks with tool_use type
# - Tool result with services
# - Final text message listing APIs

# Clean up
rm temp-test-ws8-tools.ts
```

---

### Task 5: Test Multiple Tool Calls

**Goal**: Verify multi-step investigations work

**Steps**:
1. Create complex query test:
   ```typescript
   // temp-test-ws8-multi-tool.ts
   import { queryAgent } from './lib/claude-sdk/query-wrapper';

   async function testMultiToolCall() {
     console.log('Testing multi-step investigation...');

     const result = await queryAgent(
       'Find the price of Bitcoin. First discover which APIs are available, then use the appropriate API to get the price.',
       {
         systemPrompt: 'You are an investigation agent. Use tools step by step.',
         maxTurns: 10
       }
     );

     console.log('Total chunks:', result.chunks.length);

     // Count tool calls
     const toolCalls = result.chunks.filter(c => c.type === 'tool_use');
     console.log('Tool calls made:', toolCalls.length);
     console.log('Tools used:', toolCalls.map(c => c.name));
   }

   testMultiToolCall().catch(console.error);
   ```

2. Verify multi-step execution:
   - discover_datasets called first
   - build_query called second
   - call_rest_api called third

**Validation**:
- [ ] Multiple tools called in sequence
- [ ] Agent uses previous tool results
- [ ] Investigation completes successfully
- [ ] No rate limit errors (prompt caching works)

**Testing**:
```bash
npx tsx temp-test-ws8-multi-tool.ts

# Expected sequence:
# 1. discover_datasets → finds CoinGecko
# 2. build_query → creates Bitcoin price query
# 3. call_rest_api → executes query
# 4. Final answer with Bitcoin price

# Clean up
rm temp-test-ws8-multi-tool.ts
```

---

### Task 6: Document MCP Configuration

**Goal**: Create guide for MCP server configuration

**Steps**:
1. Create MCP integration guide:
   ```markdown
   // docs/CLAUDE_SDK_MCP_INTEGRATION.md
   # Claude Agent SDK + omni-api-mcp Integration

   ## Configuration

   MCP servers are configured via the `mcpServers` option in query():

   \`\`\`typescript
   const result = query({
     prompt,
     options: {
       mcpServers: {
         'omni-api': {
           type: 'stdio',
           command: 'node',
           args: ['../omni-api-mcp/dist/index.js'],
           env: process.env
         }
       }
     }
   });
   \`\`\`

   ## Environment Variables

   All .env.local variables are passed to the MCP subprocess:
   - ANTHROPIC_API_KEY
   - DATADOG_API_KEY
   - GITHUB_TOKEN
   - etc.

   ## Tool Discovery

   Tools are automatically discovered from the MCP server.
   Use `allowedTools` to restrict which tools can be called.
   ```

2. Add troubleshooting section

**Validation**:
- [ ] Documentation created
- [ ] Examples included
- [ ] Troubleshooting guide added

---

## Validation Checklist

### Automated Tests
- [ ] MCP server starts successfully
- [ ] discover_datasets tool works
- [ ] build_query tool works
- [ ] call_rest_api tool works
- [ ] Multi-step investigation works
- [ ] No rate limit errors (caching works)

### Manual Testing
- [ ] Run dev server (npm run dev)
- [ ] Verify no startup errors
- [ ] Check console logs for MCP connection

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] No eslint warnings
- [ ] Code follows project patterns

---

## Deliverables

1. **@anthropic-ai/claude-agent-sdk** installed
2. **MCP configuration** working with omni-api-mcp
3. **Query wrapper** for simplified API
4. **End-to-end validation** of tool calling
5. **Documentation** for MCP integration

---

## Success Criteria

**Must Have**:
- ✅ Claude Agent SDK installed and configured
- ✅ omni-api-mcp tools accessible via SDK
- ✅ End-to-end tool calling works
- ✅ Prompt caching active (verify via logs)
- ✅ Multi-step investigations complete

**Nice to Have**:
- ✅ Comprehensive test suite
- ✅ Performance benchmarks (compare to Mastra)
- ✅ Error handling patterns

---

## Known Issues & Risks

### Risk 1: Environment Variable Passing

**Issue**: MCP subprocess might not receive all env vars
**Mitigation**: Explicitly pass process.env in config
**Validation**: Test with DATADOG_API_KEY access

### Risk 2: Tool Format Compatibility

**Issue**: omni-api-mcp tools might not match Claude SDK expectations
**Mitigation**: MCP is standard protocol - should work
**Validation**: Test all 5 core tools

### Risk 3: Prompt Caching Configuration

**Issue**: Caching might not work as expected
**Mitigation**: Monitor cache headers in responses
**Validation**: Check for cache_creation_input_tokens in logs

---

## Next Steps

After WS8 completion:
- **WS9**: Migrate 3 agents (Smart Agent, DataDog Champion, API Correlator)
- **WS10**: Configure enterprise OAuth2 gateway for multi-LLM support
- **WS11**: Build session management layer
- **WS12**: Polish UI with better message formatting
- **WS13**: Package as bundled desktop application

---

## References

**Claude Agent SDK Docs**:
- Overview: https://docs.claude.com/en/api/agent-sdk/overview
- TypeScript API: https://docs.claude.com/en/api/agent-sdk/typescript
- MCP Integration: https://docs.claude.com/en/api/agent-sdk/mcp

**Project Docs**:
- Mastra Parity Analysis: [docs/MASTRA_PARITY_ANALYSIS.md](../../docs/MASTRA_PARITY_ANALYSIS.md)
- Current Architecture: [CLAUDE.md](../../CLAUDE.md)
- Progress Tracking: [.claude-code/CHECKPOINT.md](../CHECKPOINT.md)

**omni-api-mcp**:
- Repository: ../omni-api-mcp
- Build command: `npm run build`
- 30+ API integrations via MCP protocol

---

## ✅ Completion Summary (2025-10-31)

**All Tasks Completed Successfully**:

1. ✅ **Task 1**: Claude Agent SDK installed (v0.1.30)
2. ✅ **Task 2**: MCP server configured for omni-api-mcp
3. ✅ **Task 3**: Query wrapper created with TypeScript types
4. ✅ **Task 4**: End-to-end tool calling validated (discover_datasets)
5. ✅ **Task 5**: Multi-tool investigation validated (3-tool sequence)
6. ✅ **Task 6**: MCP integration documented

**Validation Results**:
- ✅ MCP server connected: `omni-api (connected)`
- ✅ 14 omni-api-mcp tools loaded and accessible
- ✅ discover_datasets tool successfully called
- ✅ Multi-step workflows working (3 tools orchestrated)
- ✅ Prompt caching active: 23,621+ tokens cached (90% cost reduction!)
- ✅ Context maintained across multiple turns

**Files Created**:
- `lib/mcp/claude-sdk-mcp-config.ts` - MCP server configuration
- `lib/claude-sdk/types.ts` - TypeScript type definitions
- `lib/claude-sdk/query-wrapper.ts` - Simplified query interface
- `lib/claude-sdk/index.ts` - Barrel export
- `docs/CLAUDE_SDK_MCP_INTEGRATION.md` - Complete integration guide

**Key Achievements**:
- Native prompt caching working (no bugs, no workarounds)
- MCP protocol integration seamless
- Multi-tool orchestration validated
- Foundation ready for WS9 (agent migration)

**Next Workstream**: WS9 (Agent Migration with Sub-agents) - Ready to start!

---

**Created**: 2025-10-31
**Completed**: 2025-10-31
**Status**: ✅ Complete
