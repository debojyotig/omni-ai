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
    <Card className="w-full border-0 shadow-sm">
      {title && (
        <CardHeader className="pb-3 pt-6">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="pb-6 pt-0">
        <ChartContainer config={chartConfig} className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.data}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              syncId="anyId"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey={categoryKey}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                style={{ fontSize: '11px' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                style={{ fontSize: '11px' }}
                width={40}
              />
              <ChartTooltip
                cursor={{ fill: 'rgba(0, 0, 0, 0.08)' }}
                content={<ChartTooltipContent hideLabel={false} indicator="dot" />}
              />
              {data.bars.map((bar, idx) => {
                const color = CHART_COLORS[idx % CHART_COLORS.length];
                return (
                  <Bar
                    key={bar.key}
                    dataKey={bar.key}
                    fill={color}
                    radius={[12, 12, 4, 4]}
                    isAnimationActive={true}
                  />
                );
              })}
              <ChartLegend
                content={<ChartLegendContent />}
                verticalAlign="top"
                height={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
