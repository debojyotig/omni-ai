/**
 * Table Viewer Component
 *
 * Displays structured data in a table format with shadcn styling
 */

'use client';

import { TableData } from '@/lib/visualization/chart-transformer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TableViewerProps {
  data: TableData;
  title?: string;
}

export function TableViewer({ data, title }: TableViewerProps) {
  if (!data.headers || data.headers.length === 0) {
    return <div className="text-muted-foreground text-sm">No data to display</div>;
  }

  return (
    <Card className="w-full">
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {data.headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="px-3 py-2 text-left font-semibold text-muted-foreground"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="border-b hover:bg-muted/50 transition-colors"
                >
                  {row.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className="px-3 py-2"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {data.rows.length} row{data.rows.length !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  );
}
