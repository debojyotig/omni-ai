/**
 * Response Visualizer Component
 *
 * Automatically detects and visualizes data patterns in agent responses
 */

'use client';

import React from 'react';
import { detectVisualizablePatterns } from '@/lib/visualization/chart-detector';
import { extractStructuredData } from '@/lib/visualization/data-extractor';
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
    try {
      // Stage 1: Try standard pattern detection (JSON + markdown tables)
      let patterns = detectVisualizablePatterns(content);

      // Stage 2: If no patterns found, try plain text data extraction
      if (patterns.length === 0) {
        const plainTextData = extractStructuredData(content);
        if (plainTextData) {
          patterns = [plainTextData];
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
