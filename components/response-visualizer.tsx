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
import { LineChartComponent } from './charts/line-chart';
import { PieChartComponent } from './charts/pie-chart';
import { TableViewer } from './charts/table-viewer';

interface ResponseVisualizerProps {
  content: string;
}

export function ResponseVisualizer({ content }: ResponseVisualizerProps) {
  const [visualizations, setVisualizations] = React.useState<any[]>([]);

  React.useEffect(() => {
    try {
      const patterns = detectVisualizablePatterns(content);
      if (patterns.length === 0) return;

      const chartData = patterns.map((pattern) => ({
        pattern,
        data: transformPatternToChartData(pattern),
      }));

      setVisualizations(chartData);
    } catch (error) {
      // Silently fail if visualization parsing fails
      console.debug('Visualization parsing failed:', error);
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
          console.debug(`Failed to render ${pattern.type} chart:`, error);
          return null;
        }
      })}
    </div>
  );
}
