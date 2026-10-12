import type { GhResult } from './ghResult.ts';

/**
 * The boundary to GitHub: runs the `gh` CLI with `args`. Tests replace it;
 * nothing else in the watch talks to GitHub.
 */
export interface GhRunner {
  run(args: readonly string[]): Promise<GhResult>;
}
