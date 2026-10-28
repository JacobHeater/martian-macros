/** Where a pull to refresh is (MM-670): nothing, following the finger, far enough, or at work. */
export interface PullState {
  readonly phase: 'idle' | 'pulling' | 'ready' | 'refreshing';
  /** How far the body is drawn down, in px. */
  readonly distance: number;
}
