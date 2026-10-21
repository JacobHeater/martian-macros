/** One pack file on its way into its unfinished download (MM-387). */
export interface PackFileTransfer {
  /** 200, or 206 when the server honoured the range. Nothing is written for any other status. */
  readonly statusCode: number;

  /**
   * How many bytes this transfer has written to the file so far, each time
   * more have landed; it ends once the body is written and the file closed.
   * It throws `PackWriteFailed` when the file cannot be written, and
   * anything else when the connection fails. Stopping early closes the file.
   */
  readonly written: AsyncIterable<number>;

  /** Stops the transfer now; what was written stays, so a later one resumes. */
  abort(): void;
}
