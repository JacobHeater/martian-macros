/** An unfinished download being written to. */
export interface PackPartial {
  write(chunk: Uint8Array): Promise<void>;
  close(): Promise<void>;
}
