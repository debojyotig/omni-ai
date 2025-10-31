/**
 * OAuth2 Gateway for Enterprise Providers
 *
 * Manages OAuth2 client credentials flow for:
 * - Azure OpenAI
 * - AWS Bedrock
 * - GCP Vertex AI
 *
 * Features:
 * - Token caching in memory
 * - Auto-refresh 5 minutes before expiry
 * - Thread-safe token management
 */

export interface OAuth2Config {
  tokenEndpoint: string
  clientId: string
  clientSecret: string
  scope?: string
}

export interface OAuth2Token {
  access_token: string
  expires_in: number
  token_type: string
  expires_at: number  // Calculated timestamp (ms)
}

interface TokenCache {
  token: OAuth2Token
  refreshTimer?: NodeJS.Timeout
}

export class OAuth2Gateway {
  private tokens: Map<string, TokenCache> = new Map()
  private configs: Map<string, OAuth2Config> = new Map()

  /**
   * Register an OAuth2 configuration for a provider
   */
  registerProvider(providerId: string, config: OAuth2Config): void {
    this.configs.set(providerId, config)
  }

  /**
   * Authenticate with a provider using client credentials flow
   */
  async authenticate(providerId: string): Promise<OAuth2Token> {
    const config = this.configs.get(providerId)
    if (!config) {
      throw new Error(`OAuth2 config not found for provider: ${providerId}`)
    }

    try {
      // Prepare request body for client credentials flow
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        ...(config.scope && { scope: config.scope })
      })

      // Make token request
      const response = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`OAuth2 authentication failed: ${response.status} ${error}`)
      }

      const tokenData = await response.json()

      // Parse token response
      const token: OAuth2Token = {
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type || 'Bearer',
        expires_at: Date.now() + tokenData.expires_in * 1000
      }

      // Store token
      this.tokens.set(providerId, { token })

      // Schedule auto-refresh (5 minutes before expiry)
      this.scheduleRefresh(providerId, token.expires_at)

      return token
    } catch (error) {
      throw new Error(`OAuth2 authentication failed for ${providerId}: ${error}`)
    }
  }

  /**
   * Get a valid access token for a provider
   * Automatically refreshes if expired or close to expiry
   */
  async getToken(providerId: string): Promise<string> {
    const cached = this.tokens.get(providerId)

    // Check if token exists and is still valid (with 5 min buffer)
    const bufferMs = 5 * 60 * 1000 // 5 minutes
    if (!cached || cached.token.expires_at < Date.now() + bufferMs) {
      // Token expired or doesn't exist, authenticate
      const token = await this.authenticate(providerId)
      return token.access_token
    }

    return cached.token.access_token
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleRefresh(providerId: string, expiresAt: number): void {
    // Clear existing timer if any
    const cached = this.tokens.get(providerId)
    if (cached?.refreshTimer) {
      clearTimeout(cached.refreshTimer)
    }

    // Schedule refresh 5 minutes before expiry
    const refreshAt = expiresAt - 5 * 60 * 1000
    const delay = Math.max(0, refreshAt - Date.now())

    const timer = setTimeout(async () => {
      try {
        await this.authenticate(providerId)
      } catch (error) {
        console.error(`Failed to refresh token for ${providerId}:`, error)
      }
    }, delay)

    // Update cache with timer
    const current = this.tokens.get(providerId)
    if (current) {
      current.refreshTimer = timer
    }
  }

  /**
   * Clear all tokens (useful for logout)
   */
  clearAll(): void {
    // Clear all timers
    for (const cached of this.tokens.values()) {
      if (cached.refreshTimer) {
        clearTimeout(cached.refreshTimer)
      }
    }

    // Clear caches
    this.tokens.clear()
  }

  /**
   * Clear token for a specific provider
   */
  clearProvider(providerId: string): void {
    const cached = this.tokens.get(providerId)
    if (cached?.refreshTimer) {
      clearTimeout(cached.refreshTimer)
    }
    this.tokens.delete(providerId)
  }
}

// Singleton instance
export const oauth2Gateway = new OAuth2Gateway()
