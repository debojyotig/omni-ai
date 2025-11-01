/**
 * Provider API Route
 *
 * Exposes current provider configuration to client.
 * READ-ONLY: Provider changes require app restart.
 */

import { NextRequest } from 'next/server';
import {
  getCurrentProviderName,
  getAvailableProvidersList,
  validateProviderConfig,
  getProviderConfig
} from '@/lib/config/server-provider-config';

/**
 * GET /api/provider
 *
 * Returns current provider configuration and available providers
 */
export async function GET(req: NextRequest) {
  try {
    const currentProvider = getCurrentProviderName();
    const availableProviders = getAvailableProvidersList();
    const validation = validateProviderConfig();
    const config = getProviderConfig();

    return Response.json({
      current: {
        id: config.provider,
        name: currentProvider,
        models: config.models,
        valid: validation.valid
      },
      available: availableProviders,
      validation: validation,
      message: validation.valid
        ? 'Provider configured correctly'
        : 'Provider configuration has errors'
    });
  } catch (error: any) {
    console.error('[PROVIDER] Error:', error);
    return Response.json(
      { error: error.message || 'Failed to get provider info' },
      { status: 500 }
    );
  }
}
