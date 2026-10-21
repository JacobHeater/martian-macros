import type { TargetShape } from '../TargetShape';

/** Writes how the user shapes their targets (MM-122, MM-124). */
export interface TargetShapeWriter {
  /** Adds `shape`, or replaces the one set on the same day; earlier days keep theirs. */
  saveTargetShape(shape: TargetShape): Promise<void>;
}
