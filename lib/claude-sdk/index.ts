/**
 * Claude Agent SDK Integration
 *
 * Exports:
 * - queryAgent(): Simplified query interface
 * - streamQuery(): Streaming query with callbacks
 * - Types: QueryOptions, QueryResult, Chunk types
 */

export { queryAgent, streamQuery } from './query-wrapper';
export type {
  QueryOptions,
  QueryResult,
  ChunkType,
  Chunk,
  TextChunk,
  ToolUseChunk,
  ToolResultChunk,
  ThinkingChunk,
  ErrorChunk
} from './types';
