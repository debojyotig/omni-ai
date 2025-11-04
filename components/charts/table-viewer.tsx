/**
 * Table Viewer Component
 *
 * Displays structured data in a table format
 */

'use client';

import { TableData } from '@/lib/visualization/chart-transformer';

interface TableViewerProps {
  data: TableData;
  title?: string;
}

export function TableViewer({ data, title }: TableViewerProps) {
  if (!data.headers || data.headers.length === 0) {
    return <div className="text-muted-foreground text-sm">No data to display</div>;
  }

  return (
    <div className="w-full space-y-2">
      {title && <h3 className="font-semibold text-sm">{title}</h3>}
      <div className="w-full overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
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
                className="border-b hover:bg-muted/30 transition-colors"
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
      <p className="text-xs text-muted-foreground">
        {data.rows.length} row{data.rows.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
