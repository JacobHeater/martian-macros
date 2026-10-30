/**
 * One connection between the two phones (MM-695), carrying whole frames: what
 * one side sends in one `send` the other gets in one `receive`.
 */
export interface LinkConnection {
  send(frame: Uint8Array): Promise<void>;
  /** The next frame, or undefined once the other side has closed the connection. */
  receive(): Promise<Uint8Array | undefined>;
  close(): Promise<void>;
}
