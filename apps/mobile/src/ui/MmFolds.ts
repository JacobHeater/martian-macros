/**
 * Where a fold's state is kept across visits (MM-286): a section or a
 * disclosure that gives a `remember` key reads whether it was left open and
 * writes each change, so a destination finds its folds as they were left.
 * The app provides one over its state; without one a fold is local.
 */
export interface MmFolds {
  get(key: string): boolean | undefined;
  set(key: string, expanded: boolean): void;
}
