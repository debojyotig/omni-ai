/**
 * Tool Result Compression Processor
 *
 * Compresses large tool results to prevent token overflow.
 * Based on omni-agent's token-optimizer.ts implementation.
 *
 * This processor:
 * - Truncates arrays to first 5 items with metadata
 * - Summarizes objects to first 10 fields
 * - Truncates long strings to 1000 characters
 * - Preserves tool call structure for agent understanding
 */

import { CoreMessage, MemoryProcessorOpts } from '@mastra/core';
import { MemoryProcessor } from '@mastra/core/memory';

interface CompressedArray {
  type: 'array';
  length: number;
  sample: any[];
  truncated: boolean;
}

interface CompressedObject {
  type: 'object';
  keys: string[];
  sampleFields: Record<string, any>;
  truncated: boolean;
}

export class ToolResultCompressionProcessor extends MemoryProcessor {
  private maxArrayItems: number;
  private maxObjectFields: number;
  private maxStringLength: number;

  constructor(options?: {
    maxArrayItems?: number;
    maxObjectFields?: number;
    maxStringLength?: number;
  }) {
    super({ name: 'ToolResultCompressionProcessor' });
    this.maxArrayItems = options?.maxArrayItems || 5;
    this.maxObjectFields = options?.maxObjectFields || 10;
    this.maxStringLength = options?.maxStringLength || 1000;
  }

  process(messages: CoreMessage[], _opts: MemoryProcessorOpts = {}): CoreMessage[] {
    return messages.map((message) => {
      // Only compress tool result messages
      if (message.role !== 'tool') {
        return message;
      }

      // Compress the tool result content
      const compressed = this.compressToolResult(message.content);

      return {
        ...message,
        content: compressed,
      };
    });
  }

  private compressToolResult(content: any): any {
    // Handle string content (already stringified JSON or plain text)
    if (typeof content === 'string') {
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(content);
        const compressed = this.compressValue(parsed);
        return JSON.stringify(compressed, null, 0); // No pretty print to save tokens
      } catch {
        // Not JSON, truncate long strings
        return this.truncateString(content);
      }
    }

    // Handle object/array content directly
    return this.compressValue(content);
  }

  private compressValue(value: any): any {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return value;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return this.compressArray(value);
    }

    // Handle objects
    if (typeof value === 'object') {
      return this.compressObject(value);
    }

    // Handle strings
    if (typeof value === 'string') {
      return this.truncateString(value);
    }

    // Primitives (number, boolean) - no compression needed
    return value;
  }

  private compressArray(arr: any[]): CompressedArray {
    const sample = arr.slice(0, this.maxArrayItems).map((item) => this.compressValue(item));

    return {
      type: 'array',
      length: arr.length,
      sample,
      truncated: arr.length > this.maxArrayItems,
    };
  }

  private compressObject(obj: Record<string, any>): CompressedObject {
    const keys = Object.keys(obj);
    const sampleKeys = keys.slice(0, this.maxObjectFields);

    const sampleFields: Record<string, any> = {};
    for (const key of sampleKeys) {
      sampleFields[key] = this.compressValue(obj[key]);
    }

    return {
      type: 'object',
      keys,
      sampleFields,
      truncated: keys.length > this.maxObjectFields,
    };
  }

  private truncateString(str: string): string {
    if (str.length <= this.maxStringLength) {
      return str;
    }

    return str.slice(0, this.maxStringLength) + `... [truncated, original length: ${str.length}]`;
  }
}
