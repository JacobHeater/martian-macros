/**
 * One `packFileProgress` event (MM-387): how many bytes of a transfer are
 * in the file, its end, or its failure. Never the bytes themselves.
 */
export interface PackFileProgress {
  readonly request: number;
  /** Bytes this transfer has written to the file so far. */
  readonly bytes?: number;
  readonly done?: boolean;
  readonly error?: string;
  /** The failure was the file's, not the connection's. */
  readonly writeFailed?: boolean;
}
