/** One direction of a move's sealed stream (MM-695): each frame sealed in order, the last marked final. */
export interface MoveSealer {
  /** Sent first, in the clear: the stream's random start, which reveals nothing of the key or the data. */
  readonly header: Uint8Array;
  seal(plain: Uint8Array, final?: boolean): Uint8Array;
}
