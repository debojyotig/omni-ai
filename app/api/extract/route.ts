/**
 * Data Extraction API Route
 *
 * Server-side endpoint for LLM-based data extraction fallback.
 * Used by the client when pattern-based extraction has low confidence.
 *
 * POST /api/extract
 * Body: { content: string }
 * Response: { pattern: DataPattern | null, method: 'pattern' | 'llm' | 'none', fallbackUsed: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractStructuredDataHybrid } from '@/lib/visualization/hybrid-extractor.server';

export async function POST(request: NextRequest) {
  try {
    const { content, enableLLMFallback } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    // Perform hybrid extraction (pattern + optional LLM fallback)
    // enableLLMFallback from client takes precedence over server env var
    const result = await extractStructuredDataHybrid(content, enableLLMFallback);

    // Return extraction result
    return NextResponse.json({
      pattern: result.pattern,
      method: result.method,
      fallbackUsed: result.fallbackUsed,
      duration: result.duration,
    });
  } catch (error) {
    console.error('[Extract API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Extraction failed' },
      { status: 500 }
    );
  }
}
