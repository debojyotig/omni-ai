/**
 * Line Chart Component
 *
 * Displays time-series data with line visualization
 */

'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimeSeriesData } from '@/lib/visualization/chart-transformer';

interface LineChartProps {
  data: TimeSeriesData;
  title?: string;
  height?: number;
}

export function LineChartComponent({ data, title, height = 300 }: LineChartProps) {
  if (!data.data || data.data.length === 0) {
    return <div className="text-muted-foreground text-sm">No data to display</div>;
  }

  const timeKey = Object.keys(data.data[0])[0];

  return (
    <div className="w-full space-y-2">
      {title && <h3 className="font-semibold text-sm">{title}</h3>}
      <div className="w-full h-[300px] rounded-lg border border-border p-4">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={data.data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey={timeKey}
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
            {data.lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                stroke={line.stroke}
                name={line.name}
                isAnimationActive={true}
                dot={false}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
