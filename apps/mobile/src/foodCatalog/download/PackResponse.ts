/** The answer to a pack request: a status and the body as it arrives. */
export interface PackResponse {
  /** 200, or 206 when the server honoured a range request. */
  readonly statusCode: number;
  readonly body: AsyncIterable<Uint8Array>;
  /** Stops the transfer now. */
  abort(): void;
}
