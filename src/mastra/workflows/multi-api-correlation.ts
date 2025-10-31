import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import {
  buildQueryTool,
  callRestAPITool,
  summarizeMultiAPIResultsTool,
  discoverDatasetsTool,
} from '@/lib/mcp/tools';

/**
 * Multi-API Correlation Workflow
 *
 * Orchestrates cross-service data correlation to find inconsistencies,
 * mismatches, and orphaned records across multiple APIs.
 */

// Step 1: Identify data sources
const identifyDataSourcesStep = createStep({
  id: 'identify-sources',
  description: 'Identify which APIs to query for correlation',
  inputSchema: z.object({
    query: z.string().describe('Correlation query from user'),
  }),
  outputSchema: z.object({
    query: z.string(),
    dataSources: z
      .array(z.string())
      .describe('List of API services to query'),
    correlationKey: z
      .string()
      .optional()
      .describe('Key to use for correlation (e.g., orderId, userId)'),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { query } = inputData;

    // Discover available datasets
    const result = await discoverDatasetsTool.execute({
      context: {},
      runtimeContext,
    });

    // TODO: In a real implementation, use an agent to intelligently determine
    // which services to query based on the user's query
    // For now, return a simple example
    const dataSources = ['stripe', 'orders']; // Example services
    const correlationKey = 'orderId'; // Example key

    return {
      query,
      dataSources,
      correlationKey,
    };
  },
});

// Step 2: Build queries for each API
const buildQueriesStep = createStep({
  id: 'build-queries',
  description: 'Build queries for each identified API',
  inputSchema: z.object({
    query: z.string(),
    dataSources: z.array(z.string()),
    correlationKey: z.string().optional(),
  }),
  outputSchema: z.object({
    query: z.string(),
    queries: z.array(
      z.object({
        service: z.string(),
        queryDetails: z.any(),
      }),
    ),
    correlationKey: z.string().optional(),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { query, dataSources, correlationKey } = inputData;

    // Build queries for each data source
    const queries = await Promise.all(
      dataSources.map(async (service) => {
        const result = await buildQueryTool.execute({
          context: {
            intent: query,
            targetService: service,
          },
          runtimeContext,
        });

        return {
          service,
          queryDetails: result.query || result.restQuery,
        };
      }),
    );

    return {
      query,
      queries,
      correlationKey,
    };
  },
});

// Step 3: Fetch data from all APIs in parallel
const fetchDataStep = createStep({
  id: 'fetch-data',
  description: 'Fetch data from all identified APIs in parallel',
  inputSchema: z.object({
    query: z.string(),
    queries: z.array(
      z.object({
        service: z.string(),
        queryDetails: z.any(),
      }),
    ),
    correlationKey: z.string().optional(),
  }),
  outputSchema: z.object({
    query: z.string(),
    apiResponses: z.array(
      z.object({
        source: z.string(),
        response: z.any(),
      }),
    ),
    correlationKey: z.string().optional(),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { query, queries, correlationKey } = inputData;

    // Execute all API calls in parallel
    const apiResponses = await Promise.all(
      queries.map(async ({ service, queryDetails }) => {
        if (!queryDetails) {
          return {
            source: service,
            response: { error: 'No query details available' },
          };
        }

        const result = await callRestAPITool.execute({
          context: {
            service: queryDetails.service || service,
            method: queryDetails.method || 'GET',
            path: queryDetails.path,
            queryParams: queryDetails.queryParams,
            body: queryDetails.body,
          },
          runtimeContext,
        });

        return {
          source: service,
          response: result,
        };
      }),
    );

    return {
      query,
      apiResponses,
      correlationKey,
    };
  },
});

// Step 4: Correlate data and detect inconsistencies
const correlateDataStep = createStep({
  id: 'correlate-data',
  description: 'Correlate data from multiple APIs and detect issues',
  inputSchema: z.object({
    query: z.string(),
    apiResponses: z.array(
      z.object({
        source: z.string(),
        response: z.any(),
      }),
    ),
    correlationKey: z.string().optional(),
  }),
  outputSchema: z.object({
    summary: z.string(),
    inconsistencies: z.array(z.any()).optional(),
    correlations: z.array(z.any()).optional(),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { apiResponses, correlationKey } = inputData;

    // Use summarize_multi_api_results to correlate data
    const result = await summarizeMultiAPIResultsTool.execute({
      context: {
        results: apiResponses.map((r) => ({
          source: r.source,
          response: r.response,
        })),
        correlationKey,
      },
      runtimeContext,
    });

    return {
      summary: result.summary?.summary || 'Correlation complete',
      inconsistencies: result.summary?.inconsistencies,
      correlations: result.summary?.correlations,
    };
  },
});

// Step 5: Explain business impact (using agent)
const explainImpactStep = createStep({
  id: 'explain-impact',
  description: 'Translate technical findings to business impact',
  inputSchema: z.object({
    summary: z.string(),
    inconsistencies: z.array(z.any()).optional(),
    correlations: z.array(z.any()).optional(),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    businessImpact: z.string(),
    recommendations: z.array(z.string()).optional(),
  }),
  execute: async ({ inputData, mastra }) => {
    const { summary, inconsistencies, correlations } = inputData;

    // Use API Correlator agent to explain business impact
    const agent = mastra?.getAgent('apiCorrelator');
    if (!agent) {
      // Fallback: basic summary
      return {
        analysis: summary,
        businessImpact: 'Analysis agent not available',
        recommendations: ['Review correlation results manually'],
      };
    }

    const impactPrompt = `Analyze the following cross-service correlation results and explain the business impact:

Summary: ${summary}

Inconsistencies Found: ${JSON.stringify(inconsistencies, null, 2)}

Correlations: ${JSON.stringify(correlations, null, 2)}

Provide:
1. Business impact analysis
2. Severity assessment
3. Recommended remediation steps

Be concise and focus on actionable insights.`;

    const response = await agent.generate(impactPrompt);

    return {
      analysis: response.text,
      businessImpact: 'See analysis for business impact',
      recommendations: ['See analysis for recommendations'],
    };
  },
});

// Create the Multi-API Correlation workflow
export const multiAPICorrelation = createWorkflow({
  id: 'multi-api-correlation',
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'Correlation query (e.g., "Find mismatches between Stripe payments and order database")',
      ),
  }),
  outputSchema: z.object({
    analysis: z.string(),
    businessImpact: z.string(),
    recommendations: z.array(z.string()).optional(),
  }),
})
  .then(identifyDataSourcesStep)
  .then(buildQueriesStep)
  .then(fetchDataStep)
  .then(correlateDataStep)
  .then(explainImpactStep);

multiAPICorrelation.commit();
