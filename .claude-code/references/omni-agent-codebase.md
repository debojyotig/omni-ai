# omni-agent Codebase Reference Guide

**Purpose**: Guide for referencing omni-agent codebase during omni-ai implementation

**Location**: `/Users/debojyoti.ghosh/code/omni-agent`

**Status**: DEPRECATED (used as UI/UX reference only, not for functionality)

---

## What to Copy from omni-agent

### 1. Styling System (COPY EXACTLY)

**Why**: Proven color palette, typography, and visual design that works well

**Files to Reference**:

#### `tailwind.config.js`
**Path**: `/Users/debojyoti.ghosh/code/omni-agent/tailwind.config.js`

**What to Copy**:
- HSL color system (all CSS variables)
- Dark mode configuration (`class` strategy)
- Inter font family
- Border radius tokens
- Custom theme extensions

**Action**: Copy entire config to `tailwind.config.ts` in omni-ai

#### `globals.css`
**Path**: `/Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/styles/globals.css`

**What to Copy**:
- All CSS variable definitions (`:root` and `.dark`)
- Base styles for `*`, `body`, `html`
- Scrollbar styling (if present)

**Action**: Copy to `app/globals.css` in omni-ai

---

### 2. UI Components (COPY WITH ADAPTATIONS)

**Why**: Proven UX patterns, well-designed components

**Files to Reference**:

#### Activity Bar Component
**Path**: `/Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/components/activity-bar.tsx`

**What to Copy**:
- 72px width
- Icon layout and spacing
- Active state styling
- Hover effects
- Overall structure

**What to Adapt**:
- Remove Primary/Secondary Sidebar logic (omni-ai has no sidebars)
- Only Chat and Settings icons needed
- Use Zustand instead of Electron IPC

**Implementation**: `components/activity-bar.tsx`

#### Tool Call Card
**Path**: `/Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/components/tool-call-card.tsx`

**What to Copy**:
- Card layout and structure
- Status icon animations
- Argument/result display format
- Error state styling
- Duration display

**What to Adapt**:
- Use shadcn Card instead of custom div
- Adjust for MCP tool structure
- Add "MCP Tool" badge

**Implementation**: `components/tool-call-card.tsx`

#### shadcn Components
**Path**: `/Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/components/ui/*`

**What to Copy**:
- All shadcn component files (Button, Input, Textarea, Card, etc.)
- Theme configuration
- Component styling

**Action**: Install via shadcn CLI or copy directly to `components/ui/` in omni-ai

---

### 3. OAuth2 Logic (COPY WITH MODIFICATIONS)

**Why**: Proven OAuth2 implementation for enterprise LLM providers

**Files to Reference**:

#### OAuth2Manager
**Path**: `/Users/debojyoti.ghosh/code/omni-agent/src/lib/auth/oauth2-manager.ts`

**What to Copy**:
- Token acquisition logic
- Token refresh with 5min buffer
- Token caching mechanism
- Authenticated fetch wrapper
- Client credentials flow implementation

**What to Adapt**:
- Remove Electron-specific code (IPC, main process)
- Use Next.js API routes for server-side token handling (optional)
- Environment variables instead of Electron store

**Implementation**: `lib/auth/oauth2-gateway.ts` (adapted name)

**Key Pattern to Copy**:
```typescript
// Token expiry with buffer
if (token && token.expires_at > Date.now() + 5 * 60 * 1000) {
  return token.access_token
}

// Authenticated fetch
createAuthenticatedFetch(provider: string): typeof fetch {
  return async (url, init) => {
    const token = await this.getAccessToken(provider)
    return fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${token}`
      }
    })
  }
}
```

#### UniversalLLMClient (PATTERN ONLY)
**Path**: `/Users/debojyoti.ghosh/code/omni-agent/src/lib/llm/universal-client.ts`

**What to Copy** (pattern only):
- Provider abstraction concept
- Runtime provider switching logic
- Model configuration structure

**What NOT to Copy**:
- Actual LLM client implementation (use Mastra's providers instead)
- Electron-specific code

**Implementation**: `lib/mastra/hybrid-provider-manager.ts` (Mastra-based version)

---

### 4. UX Patterns (CONCEPT ONLY)

**Files to Study**:

#### Chat Interface Patterns
**Path**: `/Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/components/chat-*.tsx`

**What to Learn**:
- Message bubble styling (user vs assistant)
- Auto-scroll behavior
- Loading state UX
- Input field behavior (Cmd+Enter to send)

**What NOT to Copy**:
- Agent orchestration logic (replaced by Mastra)
- MCP client code (replaced by @mastra/mcp)
- Chat state management (replaced by Mastra Memory)

#### Settings Panel
**Path**: `/Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/components/settings-panel.tsx`

**What to Learn**:
- Settings layout structure
- Form organization
- Section grouping

**What to Adapt**:
- Remove MCP server management (not needed, omni-api-mcp is fixed)
- Simplify to just Provider selection
- Use shadcn Form components

---

## What NOT to Copy from omni-agent

### ❌ DO NOT COPY - Replaced by Mastra

1. **Agent Orchestrator**
   - Path: `/Users/debojyoti.ghosh/code/omni-agent/src/lib/agents/orchestrator.ts`
   - Reason: Replaced by Mastra's `Agent` class and `createWorkflow()`

2. **Chat State Management**
   - Path: `/Users/debojyoti.ghosh/code/omni-agent/src/lib/stores/chat-store.ts`
   - Reason: Replaced by Mastra Memory (LibSQL persistence)

3. **MCP Client Manager**
   - Path: `/Users/debojyoti.ghosh/code/omni-agent/src/lib/mcp/client-manager.ts`
   - Reason: Replaced by `@mastra/mcp` package

4. **Tool Calling Logic**
   - Path: `/Users/debojyoti.ghosh/code/omni-agent/src/lib/tools/*`
   - Reason: Replaced by Mastra's tool system

### ❌ DO NOT COPY - Electron-Specific

1. **Main Process Code**
   - Path: `/Users/debojyoti.ghosh/code/omni-agent/src/main/*`
   - Reason: omni-ai is Next.js, not Electron

2. **IPC Communication**
   - Path: `/Users/debojyoti.ghosh/code/omni-agent/src/preload/*`
   - Reason: No IPC in web app

3. **Electron Store**
   - Path: Usage of `electron-store`
   - Reason: Use localStorage (Zustand) and Mastra storage instead

### ❌ DO NOT COPY - Architecture Changes

1. **Primary Sidebar**
   - Path: `/Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/components/primary-sidebar.tsx`
   - Reason: omni-ai has no sidebars (Activity Bar + Main Content only)

2. **Secondary Sidebar**
   - Path: `/Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/components/secondary-sidebar.tsx`
   - Reason: omni-ai has no sidebars

3. **View Manager for Sidebars**
   - Reason: Simplified to just Chat vs Settings toggle

---

## Quick Reference Table

| Component | omni-agent Path | Action | omni-ai Path |
|-----------|----------------|--------|--------------|
| Tailwind Config | `tailwind.config.js` | ✅ COPY | `tailwind.config.ts` |
| Global Styles | `src/renderer/src/styles/globals.css` | ✅ COPY | `app/globals.css` |
| Activity Bar | `src/renderer/src/components/activity-bar.tsx` | ✅ ADAPT | `components/activity-bar.tsx` |
| Tool Call Card | `src/renderer/src/components/tool-call-card.tsx` | ✅ ADAPT | `components/tool-call-card.tsx` |
| shadcn Components | `src/renderer/src/components/ui/*` | ✅ COPY | `components/ui/*` |
| OAuth2Manager | `src/lib/auth/oauth2-manager.ts` | ✅ ADAPT | `lib/auth/oauth2-gateway.ts` |
| UniversalLLMClient | `src/lib/llm/universal-client.ts` | 📚 PATTERN | `lib/mastra/hybrid-provider-manager.ts` |
| Agent Orchestrator | `src/lib/agents/orchestrator.ts` | ❌ SKIP | (Use Mastra) |
| Chat Store | `src/lib/stores/chat-store.ts` | ❌ SKIP | (Use Mastra Memory) |
| MCP Client | `src/lib/mcp/client-manager.ts` | ❌ SKIP | (Use @mastra/mcp) |
| Primary Sidebar | `src/renderer/src/components/primary-sidebar.tsx` | ❌ SKIP | (No sidebars) |
| Secondary Sidebar | `src/renderer/src/components/secondary-sidebar.tsx` | ❌ SKIP | (No sidebars) |

---

## File Reading Strategy

### Phase 1: WS1 (Mastra + Next.js Setup)
**Read These Files**:
1. `/Users/debojyoti.ghosh/code/omni-agent/tailwind.config.js`
2. `/Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/styles/globals.css`
3. `/Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/components/activity-bar.tsx`

### Phase 2: WS2 (OAuth2 Providers)
**Read These Files**:
1. `/Users/debojyoti.ghosh/code/omni-agent/src/lib/auth/oauth2-manager.ts`
2. `/Users/debojyoti.ghosh/code/omni-agent/src/lib/llm/universal-client.ts` (pattern only)

### Phase 3: WS3 (MCP Integration)
**Read These Files**:
1. `/Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/components/tool-call-card.tsx`

### Phase 4: WS4 (Agents + Workflows)
**Read These Files**:
1. `/Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/components/chat-*.tsx` (UX patterns)
2. `/Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/components/settings-panel.tsx` (layout)

### Phase 5: WS5 (UI Polish)
**Read These Files**:
1. All shadcn components in `/Users/debojyoti.ghosh/code/omni-agent/src/renderer/src/components/ui/*`

---

## Key Differences: omni-agent vs omni-ai

| Aspect | omni-agent | omni-ai |
|--------|-----------|---------|
| **Platform** | Electron (desktop) | Next.js (web) |
| **Layout** | Activity Bar + 2 Sidebars + Main | Activity Bar + Main only |
| **Agent System** | Custom orchestrator | Mastra Agent class |
| **Workflows** | Custom implementation | Mastra createWorkflow() |
| **Chat Persistence** | Zustand + localStorage | Mastra Memory (LibSQL) |
| **MCP Integration** | Custom MCP client | @mastra/mcp package |
| **Provider System** | UniversalLLMClient | HybridProviderManager (Mastra + OAuth2) |
| **State Management** | Zustand | Zustand (UI) + Mastra Memory (chat) |
| **Tool System** | Custom tool abstraction | Mastra createTool() |

---

## Example: Adapting Activity Bar

**omni-agent Code** (Electron + 2 Sidebars):
```typescript
// Has logic for Primary Sidebar, Secondary Sidebar, and 5+ views
const views = [
  { id: 'chat', icon: MessageSquare },
  { id: 'tools', icon: Wrench },
  { id: 'agents', icon: Bot },
  { id: 'settings', icon: Settings },
  { id: 'debug', icon: Bug }
]
```

**omni-ai Code** (Next.js + No Sidebars):
```typescript
// Simplified to just Chat and Settings
const items = [
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'settings', icon: Settings, label: 'Settings' }
]
```

**What to Keep**:
- 72px width
- Icon styling
- Active state colors
- Hover effects

**What to Remove**:
- Sidebar toggle logic
- Additional view icons
- Electron IPC calls

---

## Common Pitfalls to Avoid

### ❌ Pitfall 1: Copying Electron-Specific Code
**Problem**: Trying to use `window.electron.ipc.send()`
**Solution**: Use Next.js API routes or client-side state

### ❌ Pitfall 2: Using Custom Chat State
**Problem**: Implementing custom chat history persistence
**Solution**: Use Mastra Memory (built-in, better)

### ❌ Pitfall 3: Reimplementing Agent Logic
**Problem**: Copying orchestrator code from omni-agent
**Solution**: Use Mastra's Agent class and instructions

### ❌ Pitfall 4: Complex Layout Management
**Problem**: Managing sidebars visibility
**Solution**: omni-ai has no sidebars - just toggle Chat vs Settings view

---

## Tips for Effective Reference

1. **Read First, Copy Second**: Understand the pattern before copying
2. **Adapt, Don't Blindly Copy**: Most code needs modification for Mastra/Next.js
3. **Focus on UX/UI**: The value is in visual design and UX patterns
4. **Skip Architecture**: omni-ai uses fundamentally different architecture (Mastra)
5. **Use Mastra Features**: When in doubt, use Mastra's built-in capabilities

---

## Questions While Implementing?

### "Should I copy this from omni-agent?"

**Decision Tree**:
1. Is it styling/visual design? → ✅ YES, copy exactly
2. Is it UI component structure? → ✅ YES, but adapt for shadcn
3. Is it OAuth2 logic? → ✅ YES, but remove Electron code
4. Is it agent orchestration? → ❌ NO, use Mastra instead
5. Is it MCP client code? → ❌ NO, use @mastra/mcp instead
6. Is it chat state management? → ❌ NO, use Mastra Memory instead
7. Is it sidebar-related? → ❌ NO, omni-ai has no sidebars

---

**Last Updated**: 2025-10-30
**Status**: Ready for WS1 implementation
