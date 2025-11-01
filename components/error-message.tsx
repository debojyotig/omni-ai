/**
 * Error Message Component
 *
 * Displays errors in a user-friendly format with collapsible technical details.
 * Uses shadcn alert component for consistent styling.
 */

'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface ErrorMessageProps {
  error: Error | string
  title?: string
}

export function ErrorMessage({ error, title = 'Error' }: ErrorMessageProps) {
  const errorMessage = typeof error === 'string' ? error : error.message
  const errorCause = typeof error === 'string' ? null : (error as any).cause

  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p className="text-sm">{errorMessage}</p>

        {errorCause && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-destructive-foreground/80 hover:text-destructive-foreground">
              Show technical details
            </summary>
            <pre className="mt-2 text-xs overflow-x-auto bg-destructive-foreground/10 p-2 rounded">
              {typeof errorCause === 'string'
                ? errorCause
                : JSON.stringify(errorCause, null, 2)}
            </pre>
          </details>
        )}
      </AlertDescription>
    </Alert>
  )
}
