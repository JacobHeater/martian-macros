/** One `packHttpChunk` event: bytes of a response, its end, or the connection failing. */
export interface PackHttpChunk {
  readonly request: number;
  readonly data?: string;
  readonly done?: boolean;
  readonly error?: string;
}
