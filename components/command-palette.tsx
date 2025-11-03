'use client'

import { useEffect, useState } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { DialogTitle } from '@/components/ui/dialog'
import { MessageSquare, Settings, Zap, Bot } from 'lucide-react'
import { useViewStore } from '@/lib/stores/view-store'
import { useAgentStore } from '@/lib/stores/agent-store'
import { useProviderStore } from '@/lib/stores/provider-store'
import { getModelsForProvider, type ModelConfig } from '@/lib/config/provider-config'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const { setActiveView } = useViewStore()
  const { setAgent } = useAgentStore()
  const { selectedProviderId, setModel } = useProviderStore()

  const models: ModelConfig[] = selectedProviderId ? getModelsForProvider(selectedProviderId) : []

  // Listen for Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Command Palette</DialogTitle>
      <CommandInput placeholder="Type a command or search..." aria-label="Command search" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Views">
          <CommandItem
            onSelect={() => {
              setActiveView('chat')
              setOpen(false)
            }}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Open Chat</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setActiveView('settings')
              setOpen(false)
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Open Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Agents">
          <CommandItem
            onSelect={() => {
              setAgent('smart')
              setActiveView('chat')
              setOpen(false)
            }}
          >
            <Zap className="mr-2 h-4 w-4" />
            <span>Switch to Smart Agent</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setAgent('datadog')
              setActiveView('chat')
              setOpen(false)
            }}
          >
            <Bot className="mr-2 h-4 w-4" />
            <span>Switch to DataDog Champion</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setAgent('correlator')
              setActiveView('chat')
              setOpen(false)
            }}
          >
            <Bot className="mr-2 h-4 w-4" />
            <span>Switch to API Correlator</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Models">
          {models.map((model) => (
            <CommandItem
              key={model.id}
              onSelect={() => {
                setModel(model.id)
                setOpen(false)
              }}
            >
              <span>Change to {model.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
