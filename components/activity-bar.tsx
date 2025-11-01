'use client'

import { MessageSquare, Settings } from 'lucide-react'
import { useViewStore, type View } from '@/lib/stores/view-store'

export function ActivityBar() {
  const { activeView, setActiveView } = useViewStore()

  const items: Array<{ id: View; icon: typeof MessageSquare; label: string }> = [
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ]

  return (
    <div
      className="w-[72px] min-w-[72px] bg-muted/50 border-r border-border flex flex-col items-center pt-4 pb-4 gap-2"
      style={{ position: 'relative', zIndex: 9999 }}
    >

      {items.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`
              w-12 h-12 rounded-lg flex items-center justify-center
              transition-colors
              ${
                activeView === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }
            `}
            title={item.label}
            aria-label={item.label}
            aria-pressed={activeView === item.id}
          >
            <Icon className="w-5 h-5" />
          </button>
        )
      })}
    </div>
  )
}
