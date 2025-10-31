import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Agent types available in the application
 */
export type AgentType = 'smart' | 'datadog' | 'correlator';

/**
 * Agent metadata for UI display
 */
export interface AgentInfo {
  id: AgentType;
  name: string;
  description: string;
}

/**
 * Available agents
 */
export const AGENTS: AgentInfo[] = [
  {
    id: 'smart',
    name: 'Smart Agent',
    description: 'Auto-detects intent and routes to appropriate workflow',
  },
  {
    id: 'datadog',
    name: 'DataDog Champion',
    description: 'Specializes in DataDog error and performance investigations',
  },
  {
    id: 'correlator',
    name: 'API Correlator',
    description: 'Finds data inconsistencies across multiple services',
  },
];

interface AgentState {
  selectedAgent: AgentType;
  setAgent: (agent: AgentType) => void;
  getAgentInfo: (agentId: AgentType) => AgentInfo | undefined;
}

/**
 * Agent Store
 *
 * Manages selected agent and persists selection across sessions.
 * Default: Smart Agent (auto-router)
 */
export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      selectedAgent: 'smart',
      setAgent: (agent: AgentType) => set({ selectedAgent: agent }),
      getAgentInfo: (agentId: AgentType) =>
        AGENTS.find((a) => a.id === agentId),
    }),
    {
      name: 'omni-ai-agent-storage',
    }
  )
);
