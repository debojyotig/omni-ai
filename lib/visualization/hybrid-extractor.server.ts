/**
 * Hybrid Data Extractor
 *
 * Orchestrates pattern-based extraction with optional LLM fallback.
 * Strategy:
 * 1. Try pattern-based (instant, $0)
 * 2. If confidence < 0.75 and LLM enabled, try LLM ($0.001, 0.5-1s)
 * 3. Return best result or null
 *
 * Default: Pattern-based only (LLM disabled by default)
 * Optional: Enable LLM fallback via ENABLE_LLM_EXTRACTION=true
 *
 * NOTE: Server-side only. Called from API routes to handle LLM fallback.
 */

import { extractStructuredData as extractWithPatterns } from './data-extractor';
import { extractWithLLM, isLLMExtractionEnabled, getExtractionInfo } from './llm-extractor.server';
import { DataPattern } from './chart-detector';

export interface ExtractionResult {
  pattern: DataPattern | null;
  method: 'pattern' | 'llm' | 'none';
  fallbackUsed: boolean;
  duration: number; // ms
}

/**
 * Hybrid extraction: patterns first, LLM fallback optional
 */
export async function extractStructuredDataHybrid(
  content: string
): Promise<ExtractionResult> {
  const startTime = Date.now();

  // Strategy 1: Try pattern-based (fast path)
  console.log('[Hybrid Extractor] Attempting pattern-based extraction...');
  const patternResult = extractWithPatterns(content);

  if (patternResult && patternResult.confidence >= 0.75) {
    const duration = Date.now() - startTime;
    console.log(
      `[Hybrid Extractor] Pattern extraction successful: confidence=${patternResult.confidence}, duration=${duration}ms`
    );
    return {
      pattern: patternResult,
      method: 'pattern',
      fallbackUsed: false,
      duration,
    };
  }

  // Strategy 2: Check if we should try LLM fallback
  if (!isLLMExtractionEnabled()) {
    if (patternResult) {
      // Pattern found but low confidence, LLM disabled
      console.log(
        `[Hybrid Extractor] Pattern confidence too low (${patternResult.confidence}), LLM fallback disabled`
      );
      return {
        pattern: patternResult,
        method: 'pattern',
        fallbackUsed: false,
        duration: Date.now() - startTime,
      };
    }

    // No pattern found, LLM disabled
    console.log('[Hybrid Extractor] No pattern found and LLM fallback disabled');
    return {
      pattern: null,
      method: 'none',
      fallbackUsed: false,
      duration: Date.now() - startTime,
    };
  }

  // Strategy 3: LLM fallback enabled, try extraction
  console.log(
    '[Hybrid Extractor] Pattern confidence low, attempting LLM fallback extraction...'
  );
  try {
    const llmResult = await extractWithLLM(content);

    if (llmResult && llmResult.confidence >= (patternResult?.confidence ?? 0)) {
      const duration = Date.now() - startTime;
      console.log(
        `[Hybrid Extractor] LLM extraction successful: confidence=${llmResult.confidence}, duration=${duration}ms`
      );
      return {
        pattern: llmResult,
        method: 'llm',
        fallbackUsed: true,
        duration,
      };
    }

    // LLM result is worse than pattern, use pattern
    if (patternResult) {
      const duration = Date.now() - startTime;
      console.log(
        '[Hybrid Extractor] LLM result lower confidence, using pattern result'
      );
      return {
        pattern: patternResult,
        method: 'pattern',
        fallbackUsed: true, // Tried fallback
        duration,
      };
    }

    // Neither pattern nor LLM worked
    const duration = Date.now() - startTime;
    console.log('[Hybrid Extractor] Both pattern and LLM extraction failed');
    return {
      pattern: null,
      method: 'none',
      fallbackUsed: true,
      duration,
    };
  } catch (error) {
    console.error('[Hybrid Extractor] LLM fallback error:', error);

    // Fall back to pattern if available
    if (patternResult) {
      const duration = Date.now() - startTime;
      console.log('[Hybrid Extractor] LLM error, using pattern result');
      return {
        pattern: patternResult,
        method: 'pattern',
        fallbackUsed: true,
        duration,
      };
    }

    return {
      pattern: null,
      method: 'none',
      fallbackUsed: true,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Synchronous version for non-async contexts
 * Only uses pattern-based (no LLM fallback)
 */
export function extractStructuredDataSync(content: string): ExtractionResult {
  const startTime = Date.now();
  const pattern = extractWithPatterns(content);

  return {
    pattern,
    method: 'pattern',
    fallbackUsed: false,
    duration: Date.now() - startTime,
  };
}

/**
 * Get extraction configuration info
 */
export function getHybridExtractionConfig() {
  const llmEnabled = isLLMExtractionEnabled();

  return {
    primaryMethod: 'pattern-based',
    fallbackMethod: llmEnabled ? 'llm' : 'none',
    llmEnabled,
    primaryInfo: getExtractionInfo('pattern'),
    fallbackInfo: llmEnabled ? getExtractionInfo('llm') : null,
    description: llmEnabled
      ? 'Pattern-based extraction with LLM fallback (enabled)'
      : 'Pattern-based extraction only (LLM fallback disabled)',
  };
}

/**
 * Format extraction result for logging/UI
 */
export function formatExtractionResult(result: ExtractionResult): string {
  const methodLabel = result.method === 'llm' ? 'LLM' : 'Pattern';
  const fallbackLabel = result.fallbackUsed ? ' (fallback)' : '';
  const confidence = result.pattern?.confidence.toFixed(2) || 'N/A';

  return `[${methodLabel}${fallbackLabel}] type=${result.pattern?.type || 'none'}, confidence=${confidence}, time=${result.duration}ms`;
}
