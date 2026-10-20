import type { Watched } from '../../lang/Watched';

/** Whether targets are shown exact, unrounded (MM-123); off by default. */
export interface ExactTargetsReader {
  watchExactTargets(): Watched<boolean>;
}
