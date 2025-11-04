/**
 * Toggle Component
 *
 * A simple on/off switch component for boolean settings.
 * Based on shadcn/ui patterns.
 */

import * as React from "react"

interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
}

const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, label, description, ...props }, ref) => {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-1">
          {label && <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <input
          ref={ref}
          type="checkbox"
          className={`h-6 w-11 cursor-pointer appearance-none rounded-full bg-muted transition-colors checked:bg-primary ${className || ''}`}
          {...props}
        />
      </div>
    )
  }
)

Toggle.displayName = "Toggle"

export { Toggle }
