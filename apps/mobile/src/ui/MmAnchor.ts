/** Where on the screen a menu hangs from: the trigger's edges, as `getBoundingClientRect` gives them. */
export interface MmAnchor {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}
