/**
 * Bar Chart Component
 *
 * Displays comparison data with bar visualization using Recharts and shadcn styling
 */

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ComparisonData } from '@/lib/visualization/chart-transformer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BarChartProps {
  data: ComparisonData;
  title?: string;
  height?: number;
}

export function BarChartComponent({ data, title, height = 300 }: BarChartProps) {
  if (!data.data || data.data.length === 0) {
    return <div className="text-muted-foreground text-sm">No data to display</div>;
  }

  const categoryKey = Object.keys(data.data[0])[0];

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
            <BarChart
              data={data.data}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey={categoryKey}
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
              {data.bars.map((bar) => (
                <Bar
                  key={bar.key}
                  dataKey={bar.key}
                  fill={bar.fill}
                  name={bar.name}
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
