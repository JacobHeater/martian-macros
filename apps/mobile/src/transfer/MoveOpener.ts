/** Opens what a `MoveSealer` sealed, in order (MM-697). */
export interface MoveOpener {
  /** The frame's bytes and whether it was marked final. Fails on a frame changed, reordered or sealed under another key. */
  open(sealed: Uint8Array): { plain: Uint8Array; final: boolean };
}
