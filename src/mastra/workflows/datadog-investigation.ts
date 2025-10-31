import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import {
  buildQueryTool,
  callRestAPITool,
  discoverDatasetsTool,
} from '@/lib/mcp/tools';

/**
 * DataDog Investigation Workflow
 *
 * Orchestrates a multi-step investigation for DataDog errors, latency, and availability issues.
 * Follows the 3-layer intelligence approach:
 * 1. Investigation Templates (via build_query)
 * 2. Query Builder Intelligence
 * 3. Exploration Fallback
 */

// Step 1: Discover available DataDog services
const discoverServicesStep = createStep({
  id: 'discover-services',
  description: 'Discover available monitoring services',
  inputSchema: z.object({
    query: z.string().describe('User investigation query'),
  }),
  outputSchema: z.object({
    query: z.string(),
    services: z.any().describe('Available services from discover_datasets'),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { query } = inputData;

    // Discover DataDog and monitoring services
    const result = await discoverDatasetsTool.execute({
      context: {
        category: 'monitoring',
      },
      runtimeContext,
    });

    return {
      query,
      services: result,
    };
  },
});

// Step 2: Build investigation query
const buildInvestigationQueryStep = createStep({
  id: 'build-query',
  description: 'Build DataDog query from natural language intent',
  inputSchema: z.object({
    query: z.string(),
    services: z.any(),
  }),
  outputSchema: z.object({
    query: z.string(),
    builtQuery: z.any().describe('Query built from intent'),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { query } = inputData;

    // Use build_query to translate intent to DataDog API query
    const result = await buildQueryTool.execute({
      context: {
        intent: query,
        targetService: 'datadog',
      },
      runtimeContext,
    });

    return {
      query,
      builtQuery: result,
    };
  },
});

// Step 3: Execute DataDog API call
const executeQueryStep = createStep({
  id: 'execute-query',
  description: 'Execute DataDog API query',
  inputSchema: z.object({
    query: z.string(),
    builtQuery: z.any(),
  }),
  outputSchema: z.object({
    query: z.string(),
    apiResponse: z.any().describe('Response from DataDog API'),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { query, builtQuery } = inputData;

    // Extract query details from built query
    const queryDetails = builtQuery.query || builtQuery.restQuery;

    if (!queryDetails) {
      throw new Error('No valid query found in built query result');
    }

    // Execute the API call
    const result = await callRestAPITool.execute({
      context: {
        service: queryDetails.service || 'datadog',
        method: queryDetails.method || 'GET',
        path: queryDetails.path || '/api/v1/query',
        queryParams: queryDetails.queryParams,
        body: queryDetails.body,
      },
      runtimeContext,
    });

    return {
      query,
      apiResponse: result,
    };
  },
});

// Step 4: Analyze results (using agent)
const analyzeResultsStep = createStep({
  id: 'analyze-results',
  description: 'Analyze investigation results and identify root cause',
  inputSchema: z.object({
    query: z.string(),
    apiResponse: z.any(),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    rootCause: z.string().optional(),
    recommendations: z.array(z.string()).optional(),
  }),
  execute: async ({ inputData, mastra }) => {
    const { query, apiResponse } = inputData;

    // Use DataDog Champion agent to analyze results
    const agent = mastra?.getAgent('datadogChampion');
    if (!agent) {
      // Fallback: basic analysis
      return {
        analysis: JSON.stringify(apiResponse, null, 2),
        rootCause: 'Analysis agent not available',
        recommendations: ['Review API response manually'],
      };
    }

    const analysisPrompt = `Analyze the following DataDog investigation results for the query: "${query}"

API Response:
${JSON.stringify(apiResponse, null, 2)}

Provide:
1. Summary of findings
2. Root cause analysis
3. Actionable recommendations

Be concise and focus on key insights.`;

    const response = await agent.generate(analysisPrompt);

    return {
      analysis: response.text,
      rootCause: 'See analysis for root cause',
      recommendations: ['See analysis for recommendations'],
    };
  },
});

// Create the DataDog Investigation workflow
export const datadogInvestigation = createWorkflow({
  id: 'datadog-investigation',
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'Investigation query (e.g., "Find 500 errors in payment-service from last 2 hours")',
      ),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    rootCause: z.string().optional(),
    recommendations: z.array(z.string()).optional(),
  }),
})
  .then(discoverServicesStep)
  .then(buildInvestigationQueryStep)
  .then(executeQueryStep)
  .then(analyzeResultsStep);

datadogInvestigation.commit();
