/**
 * Bar Chart Component
 *
 * Displays comparison data with bar visualization
 */

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ComparisonData } from '@/lib/visualization/chart-transformer';

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
    <div className="w-full space-y-2">
      {title && <h3 className="font-semibold text-sm">{title}</h3>}
      <div className="w-full h-[300px] rounded-lg border border-border p-4">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data.data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey={categoryKey}
              className="text-xs"
            />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            {data.bars.map((bar) => (
              <Bar
                key={bar.key}
                dataKey={bar.key}
                fill={bar.fill}
                name={bar.name}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
