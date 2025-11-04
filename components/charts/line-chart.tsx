/**
 * Line Chart Component
 *
 * Displays time-series data with line visualization using Recharts and shadcn styling
 */

'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { TimeSeriesData } from '@/lib/visualization/chart-transformer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';

interface LineChartProps {
  data: TimeSeriesData;
  title?: string;
}

// Color palette for chart lines
const CHART_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export function LineChartComponent({ data, title }: LineChartProps) {
  if (!data.data || data.data.length === 0) {
    return <div className="text-muted-foreground text-sm">No data to display</div>;
  }

  const timeKey = Object.keys(data.data[0])[0];

  // Build chart config from data lines
  const chartConfig: ChartConfig = {};
  data.lines.forEach((line, idx) => {
    chartConfig[line.key] = {
      label: line.name,
      color: CHART_COLORS[idx % CHART_COLORS.length],
    };
  });

  return (
    <Card className="w-full">
      {title && (
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-4">
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey={timeKey}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip
                cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                content={<ChartTooltipContent hideLabel={false} />}
              />
              {data.lines.map((line, idx) => {
                const color = CHART_COLORS[idx % CHART_COLORS.length];
                return (
                  <Line
                    key={line.key}
                    dataKey={line.key}
                    type="monotone"
                    stroke={color}
                    strokeWidth={2}
                    isAnimationActive={true}
                    dot={false}
                  />
                );
              })}
              <ChartLegend content={<ChartLegendContent />} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
