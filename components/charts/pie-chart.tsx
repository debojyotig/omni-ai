/**
 * Pie Chart Component
 *
 * Displays distribution data with pie/donut visualization
 */

'use client';

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { DistributionData } from '@/lib/visualization/chart-transformer';

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
    <div className="w-full space-y-2">
      {title && <h3 className="font-semibold text-sm">{title}</h3>}
      <div className="w-full h-[300px] rounded-lg border border-border p-4">
        <ResponsiveContainer width="100%" height={height}>
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
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
