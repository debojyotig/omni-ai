
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import path from 'path';
import { datadogInvestigation } from './workflows/datadog-investigation';
import { multiAPICorrelation } from './workflows/multi-api-correlation';

/**
 * Main Mastra instance for omni-ai
 *
 * Configured with:
 * - File-based LibSQL storage for persistence
 * - Pino logger for observability
 * - Default telemetry enabled
 * - 2 investigation workflows (DataDog Investigation, Multi-API Correlation)
 *
 * Agents are created dynamically at runtime to support provider/model switching.
 * See src/mastra/agents/ for agent factory functions.
 */
export const mastra = new Mastra({
  workflows: {
    datadogInvestigation,
    multiAPICorrelation,
  },
  storage: new LibSQLStore({
    // Persist conversation history and observability data to file
    url: `file:${path.join(process.cwd(), '.mastra', 'data.db')}`,
  }),
  logger: new PinoLogger({
    name: 'omni-ai',
    level: 'info',
  }),
  telemetry: {
    enabled: false, // Telemetry is deprecated
  },
  observability: {
    // Enables DefaultExporter and CloudExporter for AI tracing
    default: { enabled: true },
  },
});
