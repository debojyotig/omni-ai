/**
 * Area Chart Component
 *
 * Displays time-series data with area visualization using Recharts and shadcn styling
 */

'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimeSeriesData } from '@/lib/visualization/chart-transformer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AreaChartProps {
  data: TimeSeriesData;
  title?: string;
  height?: number;
}

export function AreaChartComponent({ data, title, height = 300 }: AreaChartProps) {
  if (!data.data || data.data.length === 0) {
    return <div className="text-muted-foreground text-sm">No data to display</div>;
  }

  const timeKey = Object.keys(data.data[0])[0];

  return (
    <Card className="w-full">
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="pl-2 pr-2 pb-4">
        <div style={{ width: '100%', height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.data}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <defs>
                {data.lines.map((line) => (
                  <linearGradient key={`gradient-${line.key}`} id={`gradient-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={line.stroke} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={line.stroke} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey={timeKey}
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '16px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              {data.lines.map((line) => (
                <Area
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  stroke={line.stroke}
                  fillOpacity={1}
                  fill={`url(#gradient-${line.key})`}
                  name={line.name}
                  isAnimationActive={true}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
