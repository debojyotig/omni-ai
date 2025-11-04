/**
 * Response Visualizer Component
 *
 * Automatically detects and visualizes data patterns in agent responses
 */

'use client';

import React from 'react';
import { detectVisualizablePatterns } from '@/lib/visualization/chart-detector';
import { transformPatternToChartData } from '@/lib/visualization/chart-transformer';
import { AreaChartComponent } from './charts/area-chart';
import { BarChartComponent } from './charts/bar-chart';
import { PieChartComponent } from './charts/pie-chart';
import { TableViewer } from './charts/table-viewer';

interface ResponseVisualizerProps {
  content: string;
}

export function ResponseVisualizer({ content }: ResponseVisualizerProps) {
  const [visualizations, setVisualizations] = React.useState<any[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        // Stage 1: Try standard pattern detection (JSON + markdown tables)
        let patterns = detectVisualizablePatterns(content);

        // Stage 2: If no patterns found, try hybrid extraction via API (pattern + optional LLM fallback)
        if (patterns.length === 0) {
          try {
            const response = await fetch('/api/extract', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content }),
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
        const { pattern, data } = viz;

        try {
          switch (pattern.type) {
            case 'timeseries':
              return (
                <AreaChartComponent
                  key={idx}
                  data={data}
                  title={pattern.metadata?.title}
                />
              );
            case 'comparison':
              return (
                <BarChartComponent
                  key={idx}
                  data={data}
                  title={pattern.metadata?.title}
                />
              );
            case 'distribution':
              return (
                <PieChartComponent
                  key={idx}
                  data={data}
                  title={pattern.metadata?.title}
                />
              );
            case 'table':
              return (
                <TableViewer
                  key={idx}
                  data={data}
                  title={pattern.metadata?.title}
                />
              );
            default:
              return null;
          }
        } catch (error) {
          return null;
        }
      })}
    </div>
  );
}
