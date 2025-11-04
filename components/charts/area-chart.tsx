/**
 * Area Chart Component
 *
 * Displays time-series data with area visualization
 */

'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimeSeriesData } from '@/lib/visualization/chart-transformer';

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
    <div className="w-full space-y-2">
      {title && <h3 className="font-semibold text-sm">{title}</h3>}
      <div className="w-full h-[300px] rounded-lg border border-border p-4">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={data.data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              {data.lines.map((line) => (
                <linearGradient key={`gradient-${line.key}`} id={`gradient-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={line.stroke} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={line.stroke} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
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
              <Area
                key={line.key}
                type="monotone"
                dataKey={line.key}
                stroke={line.stroke}
                fillOpacity={1}
                fill={`url(#gradient-${line.key})`}
                name={line.name}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
