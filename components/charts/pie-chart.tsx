/**
 * Pie Chart Component
 *
 * Displays distribution data with pie/donut visualization using Recharts and shadcn styling
 */

'use client';

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { DistributionData } from '@/lib/visualization/chart-transformer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#14b8a6', // teal
];

interface PieChartProps {
  data: DistributionData;
  title?: string;
  height?: number;
  variant?: 'pie' | 'donut';
}

export function PieChartComponent({ data, title, height = 300, variant = 'donut' }: PieChartProps) {
  if (!data.data || data.data.length === 0) {
    return <div className="text-muted-foreground text-sm">No data to display</div>;
  }

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
            <PieChart>
              <Pie
                data={data.data}
                cx="50%"
                cy="50%"
                innerRadius={variant === 'donut' ? 60 : 0}
                outerRadius={80}
                paddingAngle={2}
                dataKey={data.dataKey}
                nameKey={data.nameKey}
                label={(entry) => `${entry[data.nameKey]}: ${entry[data.dataKey]}`}
                isAnimationActive={true}
              >
                {data.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
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
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
