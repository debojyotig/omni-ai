/**
 * Table Viewer Component
 *
 * Displays structured data in a table format with smart cell rendering
 * Features:
 * - Status detection with icons (Active → ✓, Retired → ⚠, In Development → ⏱)
 * - Percentage badges with color coding
 * - Date detection with calendar icon
 * - URL detection with link icon
 * - Currency formatting for cost/price columns
 */

'use client';

import { TableData } from '@/lib/visualization/chart-transformer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Link as LinkIcon,
  DollarSign,
  Dot,
} from 'lucide-react';

interface TableViewerProps {
  data: TableData;
  title?: string;
}

/**
 * Detects cell content type and renders appropriate icon/styling
 */
function renderCell(content: string, headerName?: string) {
  if (!content || typeof content !== 'string') {
    return content;
  }

  const lowerContent = content.toLowerCase().trim();
  const lowerHeader = headerName?.toLowerCase() || '';

  // Status detection: Active, Inactive, Retired, In Development, etc.
  if (
    lowerHeader.includes('status') ||
    lowerHeader.includes('state') ||
    lowerHeader.includes('condition')
  ) {
    if (
      lowerContent === 'active' ||
      lowerContent === 'operational' ||
      lowerContent === 'success'
    ) {
      return (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          <span className="font-medium text-green-700 dark:text-green-300">
            {content}
          </span>
        </div>
      );
    }
    if (
      lowerContent === 'retired' ||
      lowerContent === 'inactive' ||
      lowerContent === 'failed'
    ) {
      return (
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span className="font-medium text-amber-700 dark:text-amber-300">
            {content}
          </span>
        </div>
      );
    }
    if (lowerContent.includes('development') || lowerContent.includes('pending')) {
      return (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="font-medium text-blue-700 dark:text-blue-300">
            {content}
          </span>
        </div>
      );
    }
  }

  // Percentage detection (e.g., "100%", "95.5%", "85")
  const percentMatch = content.match(/^(\d+(?:\.\d+)?)\s*%?$/);
  if (
    percentMatch &&
    (lowerHeader.includes('rate') ||
      lowerHeader.includes('percentage') ||
      lowerHeader.includes('percent') ||
      lowerHeader.includes('success') ||
      lowerHeader.includes('completion'))
  ) {
    const percent = parseFloat(percentMatch[1]);
    let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' =
      'default';

    if (percent === 100) badgeVariant = 'default';
    else if (percent >= 90) badgeVariant = 'secondary';
    else if (percent >= 75) badgeVariant = 'secondary';
    else badgeVariant = 'destructive';

    return (
      <Badge variant={badgeVariant} className="flex items-center gap-1 w-fit">
        <TrendingUp className="w-3 h-3" />
        {percent}%
      </Badge>
    );
  }

  // Date detection (e.g., "2024-01-15", "Jan 15, 2024", "15/01/2024")
  const dateMatch = content.match(
    /^\d{1,4}[-\/\.]\d{1,2}[-\/\.]\d{1,4}$|^[A-Za-z]+\s+\d{1,2},?\s+\d{4}$/
  );
  if (
    dateMatch &&
    (lowerHeader.includes('date') ||
      lowerHeader.includes('flight') ||
      lowerHeader.includes('launch') ||
      lowerHeader.includes('time'))
  ) {
    return (
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
        <span className="font-medium">{content}</span>
      </div>
    );
  }

  // URL detection
  if (
    lowerContent.startsWith('http://') ||
    lowerContent.startsWith('https://') ||
    lowerContent.startsWith('www.')
  ) {
    return (
      <div className="flex items-center gap-2">
        <LinkIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <a
          href={
            lowerContent.startsWith('http')
              ? lowerContent
              : `https://${lowerContent}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline truncate"
        >
          {content}
        </a>
      </div>
    );
  }

  // Currency detection
  if (
    (lowerHeader.includes('cost') ||
      lowerHeader.includes('price') ||
      lowerHeader.includes('amount') ||
      lowerHeader.includes('rate')) &&
    (lowerContent.match(/^\$/) || lowerContent.match(/^\d+(?:,\d{3})*(?:\.\d{2})?$/))
  ) {
    return (
      <div className="flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100">
        <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        {content}
      </div>
    );
  }

  // Default: return as-is
  return content;
}

export function TableViewer({ data, title }: TableViewerProps) {
  if (!data.headers || data.headers.length === 0) {
    return <div className="text-muted-foreground text-sm">No data to display</div>;
  }

  return (
    <Card className="w-full">
      {title && (
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-2">
            <Dot className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-current" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
        </CardHeader>
      )}
      <CardContent className="pt-4">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 dark:bg-slate-900/50">
                {data.headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50"
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
                  className={`border-b transition-colors ${
                    rowIdx % 2 === 0
                      ? 'bg-white dark:bg-slate-950'
                      : 'bg-slate-50/50 dark:bg-slate-900/30'
                  } hover:bg-slate-100/50 dark:hover:bg-slate-800/50`}
                >
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-4 py-3">
                      {renderCell(cell, data.headers[cellIdx])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-muted-foreground mt-4 flex gap-4">
          <span>
            {data.rows.length} row{data.rows.length !== 1 ? 's' : ''}
          </span>
          <span>•</span>
          <span>
            {data.headers.length} column{data.headers.length !== 1 ? 's' : ''}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
