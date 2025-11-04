/**
 * Response Visualizer Component
 *
 * Two-stage visualization strategy:
 * 1. First: Check for agent-provided visualization hints in response
 * 2. Second: Fall back to pattern detection + optional LLM extraction
 */

'use client';

import React from 'react';
import { detectVisualizablePatterns } from '@/lib/visualization/chart-detector';
import { transformPatternToChartData, DataMapping } from '@/lib/visualization/chart-transformer';
import { useExtractionSettingsStore } from '@/lib/stores/extraction-settings-store';
import { extractVisualizationHint } from '@/lib/agents/visualization-hints';
import { AreaChartComponent } from './charts/area-chart';
import { BarChartComponent } from './charts/bar-chart';
import { PieChartComponent } from './charts/pie-chart';
import { TableViewer } from './charts/table-viewer';

interface ResponseVisualizerProps {
  content: string;
}

export function ResponseVisualizer({ content }: ResponseVisualizerProps) {
  const [visualizations, setVisualizations] = React.useState<any[]>([]);
  const { enableLLMExtraction } = useExtractionSettingsStore();

  React.useEffect(() => {
    (async () => {
      try {
        // Stage 1: Check for agent-provided visualization hints
        const hint = extractVisualizationHint(content);
        if (hint) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[ResponseVisualizer] Using agent-provided visualization hint:', hint.dataType, hint.visualizationType);
          }

          // Convert hint to chart visualization
          setVisualizations([
            {
              hint,
              data: hint.structuredData,
              metadata: {
                title: hint.title,
                description: hint.description,
                dataMapping: hint.dataMapping,
              }
            }
          ]);
          return;
        }

        // Stage 2: Try standard pattern detection (JSON + markdown tables)
        let patterns = detectVisualizablePatterns(content);

        // Stage 3: If no patterns found, try hybrid extraction via API (pattern + optional LLM fallback)
        if (patterns.length === 0) {
          try {
            const response = await fetch('/api/extract', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content, enableLLMFallback: enableLLMExtraction }),
            });

            if (response.ok) {
              const result = await response.json();
              if (result.pattern) {
                patterns = [result.pattern];
                if (process.env.NODE_ENV === 'development') {
                  const method = result.method === 'llm' ? 'LLM' : 'Pattern';
                  const fallback = result.fallbackUsed ? ' (fallback)' : '';
                  console.log(
                    `[ResponseVisualizer] [${method}${fallback}] type=${result.pattern.type}, confidence=${result.pattern.confidence.toFixed(2)}, time=${result.duration}ms`
                  );
                }
              }
            }
          } catch (error) {
            console.warn('[ResponseVisualizer] Hybrid extraction API call failed:', error);
            // Continue with just pattern-based results if API fails
          }
        }

        if (patterns.length === 0) {
          return;
        }

        const chartData = patterns.map((pattern) => ({
          pattern,
          data: transformPatternToChartData(pattern),
          dataMapping: undefined, // Pattern-based visualizations don't have explicit dataMapping
        }));

        setVisualizations(chartData);
      } catch (error) {
        console.error('Visualization parsing failed:', error);
      }
    })();
  }, [content]);

  if (visualizations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 my-4">
      {visualizations.map((viz, idx) => {
        // Determine visualization type: hint-based or pattern-based
        const isHint = !!viz.hint;
        const chartType = isHint ? viz.hint.visualizationType : viz.pattern?.type;
        const dataMapping = isHint ? viz.metadata?.dataMapping : undefined;

        // For hint-based visualizations, use the provided data directly
        // For pattern-based, apply dataMapping during transformation if available
        let chartData = viz.data;
        if (!isHint && viz.pattern && dataMapping) {
          // Re-transform pattern data with explicit dataMapping hints
          chartData = transformPatternToChartData(viz.pattern, dataMapping);
        }

        const chartTitle = isHint ? viz.metadata?.title : viz.pattern?.metadata?.title;

        try {
          switch (chartType) {
            case 'timeseries':
            case 'area':
              return (
                <AreaChartComponent
                  key={idx}
                  data={chartData}
                  title={chartTitle}
                />
              );
            case 'comparison':
            case 'ranking':
            case 'bar':
              return (
                <BarChartComponent
                  key={idx}
                  data={chartData}
                  title={chartTitle}
                />
              );
            case 'distribution':
            case 'pie':
              return (
                <PieChartComponent
                  key={idx}
                  data={chartData}
                  title={chartTitle}
                />
              );
            case 'table':
              return (
                <TableViewer
                  key={idx}
                  data={chartData}
                  title={chartTitle}
                />
              );
            default:
              return null;
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[ResponseVisualizer] Chart rendering failed:', error);
          }
          return null;
        }
      })}
    </div>
  );
}
