# Checkpoint WS1: Mastra + Next.js Setup

**Project**: omni-ai
**Duration**: 2-3 days
**Priority**: Critical Path (foundation)
**Dependencies**: None

## Overview

Bootstrap omni-ai with Next.js 15, Mastra framework, and establish development environment. This includes setting up the basic layout (Activity Bar + Main Content), copying styling from omni-agent, and installing shadcn components.

## Goals

1. Initialize Next.js 15 project with Mastra framework
2. Copy styling from omni-agent (Tailwind, HSL colors, Inter font)
3. Install shadcn/ui components
4. Create Activity Bar component (72px width)
5. Set up basic layout (no sidebars)
6. Configure Zustand stores with localStorage persistence
7. Verify basic functionality

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Access to omni-agent codebase at `/Users/debojyoti.ghosh/code/omni-agent`
- [ ] shadcn MCP server available (optional but recommended)

## Tasks

### Task 1: Initialize Next.js + Mastra Project

**Directory**: `~/code/omni-ai`

**Commands**:
```bash
cd ~/code/omni-ai
npm create mastra@latest .
# Follow prompts:
# - Framework: Next.js
# - TypeScript: Yes
# - App Router: Yes (NOT Pages Router)
# - Tailwind CSS: Yes
```

**Verify**:
```bash
npm run dev
# Should start on http://localhost:3000
```

**Acceptance Criteria**:
- [ ] Next.js 15 project initialized
- [ ] Mastra dependencies installed
- [ ] App Router configured (app/ directory, not pages/)
- [ ] TypeScript configured
- [ ] Dev server runs without errors

### Task 2: Copy Tailwind Configuration from omni-agent

**Source File**: `/Users/debojyoti.ghosh/code/omni-agent/tailwind.config.js`

**Target File**: `tailwind.config.ts`

**Key Elements to Copy**:
- HSL color system (--background, --foreground, --primary, etc.)
- Inter font family
- Dark mode configuration
- Border radius tokens
- All custom theme extensions

**Commands**:
```bash
# Read source config
cat /Users/debojyoti.ghosh/code/omni-agent/tailwind.config.js

# Update tailwind.config.ts with HSL color system
```

**Acceptance Criteria**:
- [ ] HSL color system configured
- [ ] Dark mode works (class strategy)
- [ ] Inter font loaded
- [ ] Border radius tokens configured

### Task 3: Copy Global Styles from omni-agent

**Source File**: `/Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/styles/globals.css`

**Target File**: `app/globals.css`

**Key Elements to Copy**:
- CSS variable definitions (HSL colors)
- Dark mode overrides
- Base styles (*, body, html)
- Scrollbar styling (if any)

**Commands**:
```bash
# Read source styles
cat /Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/styles/globals.css

# Update app/globals.css
```

**Acceptance Criteria**:
- [ ] All HSL variables defined
- [ ] Dark mode variables work
- [ ] Base styles applied
- [ ] Background color renders correctly

### Task 4: Install shadcn/ui Components

**Using shadcn MCP server** (if available):
```bash
# Use MCP server to install components
# OR manually:
npx shadcn@latest init
# Follow prompts (use default Next.js app structure)
```

**Components to Install** (install as needed during implementation):
```bash
npx shadcn@latest add button
npx shadcn@latest add dropdown-menu
npx shadcn@latest add select
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add scroll-area
npx shadcn@latest add command
npx shadcn@latest add dialog
```

**Acceptance Criteria**:
- [ ] shadcn/ui initialized
- [ ] components.json configured
- [ ] Basic components installed
- [ ] Components render correctly with theme

### Task 5: Create Activity Bar Component

**File**: `components/activity-bar.tsx` (new)

**Reference**: `/Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/components/activity-bar.tsx`

**Implementation**:
```typescript
'use client'

import { useState } from 'react'
import { MessageSquare, Settings } from 'lucide-react'

type View = 'chat' | 'settings'

export function ActivityBar() {
  const [activeView, setActiveView] = useState<View>('chat')

  const items = [
    { id: 'chat' as View, icon: MessageSquare, label: 'Chat' },
    { id: 'settings' as View, icon: Settings, label: 'Settings' }
  ]

  return (
    <div className="w-[72px] bg-background border-r flex flex-col items-center py-4 gap-2">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => setActiveView(item.id)}
          className={`
            w-12 h-12 rounded-lg flex items-center justify-center
            transition-colors
            ${activeView === item.id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }
          `}
          title={item.label}
        >
          <item.icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  )
}
```

**Acceptance Criteria**:
- [ ] Activity Bar component created
- [ ] 72px width (fixed)
- [ ] Chat and Settings icons
- [ ] Active state styling
- [ ] Hover effects work
- [ ] Component renders without errors

### Task 6: Create Basic Layout Structure

**File**: `app/layout.tsx` (update)

**Implementation**:
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ActivityBar } from '@/components/activity-bar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'omni-ai - Intelligent Investigation Agent',
  description: 'AI-powered investigation assistant for enterprise APIs'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="flex h-screen">
          <ActivityBar />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
```

**Acceptance Criteria**:
- [ ] Layout uses Activity Bar + Main Content (no sidebars)
- [ ] Inter font loaded
- [ ] Dark mode enabled by default
- [ ] Full height layout (h-screen)
- [ ] Main content area scrollable

### Task 7: Create View State Management with Zustand

**File**: `lib/stores/view-store.ts` (new)

**Implementation**:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type View = 'chat' | 'settings'

interface ViewState {
  activeView: View
  setActiveView: (view: View) => void
}

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      activeView: 'chat',
      setActiveView: (view) => set({ activeView: view })
    }),
    {
      name: 'omni-ai-view-storage'
    }
  )
)
```

**Dependencies**:
```bash
npm install zustand
```

**Acceptance Criteria**:
- [ ] Zustand installed
- [ ] View store created
- [ ] localStorage persistence works
- [ ] Active view state persists across refreshes

### Task 8: Update Activity Bar to Use Store

**File**: `components/activity-bar.tsx` (update)

**Changes**:
```typescript
'use client'

import { MessageSquare, Settings } from 'lucide-react'
import { useViewStore } from '@/lib/stores/view-store'

export function ActivityBar() {
  const { activeView, setActiveView } = useViewStore()

  const items = [
    { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' }
  ]

  return (
    <div className="w-[72px] bg-background border-r flex flex-col items-center py-4 gap-2">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => setActiveView(item.id)}
          className={`
            w-12 h-12 rounded-lg flex items-center justify-center
            transition-colors
            ${activeView === item.id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }
          `}
          title={item.label}
        >
          <item.icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  )
}
```

**Acceptance Criteria**:
- [ ] Activity Bar uses Zustand store
- [ ] View selection persists
- [ ] No console errors

### Task 9: Create Placeholder Views

**File**: `app/page.tsx` (update)

**Implementation**:
```typescript
'use client'

import { useViewStore } from '@/lib/stores/view-store'

export default function Home() {
  const { activeView } = useViewStore()

  return (
    <div className="h-full flex items-center justify-center">
      {activeView === 'chat' && (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Chat View</h1>
          <p className="text-muted-foreground">Chat interface coming in WS4</p>
        </div>
      )}
      {activeView === 'settings' && (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Settings View</h1>
          <p className="text-muted-foreground">Settings panel coming in WS2</p>
        </div>
      )}
    </div>
  )
}
```

**Acceptance Criteria**:
- [ ] Placeholder views render
- [ ] View switching works
- [ ] No hydration errors

### Task 10: Verify Installation

**Manual Testing**:
```bash
npm run dev
# Visit http://localhost:3000
```

**Verification Checklist**:
- [ ] Activity Bar appears on left (72px width)
- [ ] Dark mode is active
- [ ] Inter font is loaded
- [ ] Colors match omni-agent (HSL system)
- [ ] Clicking Chat/Settings icons switches views
- [ ] View selection persists after refresh
- [ ] No console errors
- [ ] No hydration warnings

## Testing

### Manual Testing Steps

1. **Dark Mode**:
   - Check background is dark
   - Check text is light
   - Verify border colors

2. **Activity Bar**:
   - Click Chat icon → "Chat View" appears
   - Click Settings icon → "Settings View" appears
   - Verify active state styling (primary color background)
   - Verify hover effects

3. **Persistence**:
   - Select Settings view
   - Refresh page
   - Verify Settings view is still active

4. **Responsiveness**:
   - Resize browser window
   - Verify Activity Bar stays 72px
   - Verify main content area adjusts

## Documentation

**File**: `docs/SETUP.md` (new)

Document:
1. How to run dev server
2. How to build for production
3. Environment variables needed (none yet, but will be added in WS2)
4. Troubleshooting common issues

## Acceptance Criteria (Summary)

- [ ] Next.js 15 + Mastra initialized
- [ ] Tailwind configured with HSL colors from omni-agent
- [ ] Global styles copied from omni-agent
- [ ] shadcn/ui installed and configured
- [ ] Activity Bar component created (72px width)
- [ ] Layout structure: Activity Bar + Main Content (no sidebars)
- [ ] Zustand store for view state with localStorage persistence
- [ ] Placeholder views for Chat and Settings
- [ ] Manual testing complete (all checks pass)
- [ ] No console errors or warnings
- [ ] Styling matches omni-agent

## Next Workstream

After completing WS1, proceed to:
- **WS2: OAuth2 Hybrid Providers** - Provider selector in Settings, model selector in Chat header

## Notes

- Keep this workstream focused on **foundation only** (layout, styling, basic components)
- Do NOT implement chat functionality yet (that's WS4)
- Do NOT implement Settings panel yet (that's WS2)
- Use shadcn MCP server if available for faster component installation
- Reference omni-agent files directly (paths provided in CLAUDE.md)
- If you encounter issues with Mastra initialization, check Mastra docs: https://mastra.ai/en/docs/

## Common Issues

**Issue**: Hydration errors with Zustand
**Solution**: Use `useViewStore` only in client components (add 'use client' directive)

**Issue**: Tailwind classes not applying
**Solution**: Verify `tailwind.config.ts` includes `content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}']`

**Issue**: Dark mode not working
**Solution**: Check `<html>` tag has `className="dark"` in layout.tsx
