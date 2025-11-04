/**
 * Area Chart Component
 *
 * Displays time-series data with area visualization using Recharts and shadcn styling
 */

'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { TimeSeriesData } from '@/lib/visualization/chart-transformer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';

interface AreaChartProps {
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

export function AreaChartComponent({ data, title }: AreaChartProps) {
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
    <Card className="w-full border-0 shadow-sm">
      {title && (
        <CardHeader className="pb-3 pt-6">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="pb-6 pt-0">
        <ChartContainer config={chartConfig} className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.data}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              syncId="anyId"
            >
              <defs>
                {data.lines.map((line, idx) => {
                  const color = CHART_COLORS[idx % CHART_COLORS.length];
                  return (
                    <linearGradient
                      key={`gradient-${line.key}`}
                      id={`gradient-${line.key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={color} stopOpacity={0.6} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey={timeKey}
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
                content={<ChartTooltipContent hideLabel={false} indicator="line" />}
              />
              {data.lines.map((line, idx) => {
                const color = CHART_COLORS[idx % CHART_COLORS.length];
                return (
                  <Area
                    key={line.key}
                    dataKey={line.key}
                    type="natural"
                    fill={`url(#gradient-${line.key})`}
                    stroke={color}
                    strokeWidth={2.5}
                    isAnimationActive={true}
                    dot={false}
                    stackId="stack"
                  />
                );
              })}
              <ChartLegend
                content={<ChartLegendContent />}
                verticalAlign="top"
                height={36}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
