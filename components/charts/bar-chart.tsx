/**
 * Bar Chart Component
 *
 * Displays comparison data with bar visualization using Recharts and shadcn styling
 */

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ComparisonData } from '@/lib/visualization/chart-transformer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';

interface BarChartProps {
  data: ComparisonData;
  title?: string;
}

// Color palette for chart bars
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

export function BarChartComponent({ data, title }: BarChartProps) {
  if (!data.data || data.data.length === 0) {
    return <div className="text-muted-foreground text-sm">No data to display</div>;
  }

  const categoryKey = Object.keys(data.data[0])[0];

  // Build chart config from data bars
  const chartConfig: ChartConfig = {};
  data.bars.forEach((bar, idx) => {
    chartConfig[bar.key] = {
      label: bar.name,
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
            <BarChart
              data={data.data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey={categoryKey}
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
              {data.bars.map((bar, idx) => {
                const color = CHART_COLORS[idx % CHART_COLORS.length];
                return (
                  <Bar
                    key={bar.key}
                    dataKey={bar.key}
                    fill={color}
                    radius={[8, 8, 0, 0]}
                    isAnimationActive={true}
                  />
                );
              })}
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
