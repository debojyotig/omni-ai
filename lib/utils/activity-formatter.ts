/**
 * Activity Formatter - Transform technical tool names into human-readable descriptions
 * Like ChatGPT's activity panel
 */

interface ToolInput {
  [key: string]: any
}

/**
 * Determine icon type for activity step
 */
export function getActivityIcon(toolName: string, _input?: ToolInput): 'web' | 'dot' | 'spinner' | 'api' | 'graphql' | 'check' {
  // Web icon for web-related tools
  if (toolName === 'WebSearch' || toolName === 'WebFetch') {
    return 'web'
  }

  // API icon for REST calls
  if (toolName === 'call_rest_api') {
    return 'api'
  }

  // GraphQL icon for GraphQL calls
  if (toolName === 'call_graphql') {
    return 'graphql'
  }

  // Default to dot for all other tools
  return 'dot'
}

/**
 * Generate planning gist for initial thinking step
 */
export function generatePlanningGist(userMessage: string): string {
  // Extract key intent from user message
  const lowerMessage = userMessage.toLowerCase()

  if (lowerMessage.includes('error') || lowerMessage.includes('500') || lowerMessage.includes('fail')) {
    return 'Analyzing error patterns and investigating root cause'
  }
  if (lowerMessage.includes('data') || lowerMessage.includes('correlate')) {
    return 'Correlating data across services to identify inconsistencies'
  }
  if (lowerMessage.includes('status') || lowerMessage.includes('health')) {
    return 'Checking service health and availability status'
  }

  // Default gist
  return 'Analyzing request and planning investigation approach'
}

/**
 * Generate human-readable description from tool name and input
 * Note: Tool names come pre-cleaned (without mcp__ prefix)
 */
export function formatActivityTitle(toolName: string, input?: ToolInput): string {
  // Handle Mastra Task tool
  if (toolName === 'Task') {
    return formatTaskTool(input)
  }

  // Try formatting as omni-api tool first (most common)
  const formatted = formatOmniApiTool(toolName, input)
  if (formatted !== toolName) {
    // Successfully formatted
    return formatted
  }

  // Handle other common tools
  switch (toolName) {
    case 'WebSearch':
      return `Searching the web${input?.query ? ` for "${input.query}"` : ''}`
    case 'WebFetch':
      return `Fetching data from ${input?.url || 'website'}`
    default:
      // Return as-is (fallback will be applied in formatOmniApiTool)
      return formatted
  }
}

/**
 * Format omni-api-mcp tools into human-readable descriptions
 */
function formatOmniApiTool(toolName: string, input?: ToolInput): string {
  switch (toolName) {
    case 'discover_datasets':
      return 'Discovering available services and datasets'

    case 'build_query':
      const intent = input?.intent ? ` for "${input.intent}"` : ''
      return `Building API query${intent}`

    case 'call_rest_api':
      const service = input?.service || 'API'
      const method = input?.method || 'GET'
      const path = input?.path || ''
      if (service && path) {
        return `Calling ${service} ${method} ${path}`
      }
      return `Calling ${service} API`

    case 'call_graphql':
      const gqlService = input?.service || 'API'
      return `Querying ${gqlService} GraphQL endpoint`

    case 'summarize_multi_api_results':
      const count = input?.results?.length || 'multiple'
      return `Correlating data from ${count} sources`

    case 'interpret_api_response':
      return 'Analyzing API response'

    case 'search_learned_patterns':
      return 'Searching for similar past queries'

    case 'save_api_pattern':
      return 'Saving successful query pattern'

    case 'get_service_stats':
      return 'Getting service statistics'

    case 'get_system_health':
      return 'Checking system health'

    case 'analyze_rest_response':
      return 'Analyzing REST response structure'

    case 'explore_rest_patterns':
      const resource = input?.resource || 'endpoints'
      return `Exploring ${resource} endpoints`

    default:
      // Convert snake_case to human readable
      return toolName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
  }
}

/**
 * Format Task tool (agent subtasks)
 */
function formatTaskTool(input?: ToolInput): string {
  if (input?.description) {
    return input.description
  }
  if (input?.prompt) {
    // Extract first sentence or first 60 chars
    const prompt = input.prompt as string
    const firstSentence = prompt.split('.')[0]
    return firstSentence.length > 60
      ? firstSentence.substring(0, 60) + '...'
      : firstSentence
  }
  return 'Planning sub-task'
}

/**
 * Generate human-readable description with more context
 */
export function formatActivityDescription(toolName: string, input?: ToolInput): string | undefined {
  // Only provide descriptions for complex operations
  if (toolName.includes('call_rest_api') || toolName.includes('call_graphql')) {
    if (input?.service && input?.path) {
      return `${input.method || 'GET'} ${input.path}`
    }
    if (input?.query) {
      return input.query.substring(0, 100)
    }
  }

  if (toolName === 'Task' && input?.prompt) {
    // Show more context for Task subtasks
    const prompt = input.prompt as string
    return prompt.substring(0, 150)
  }

  return undefined
}
