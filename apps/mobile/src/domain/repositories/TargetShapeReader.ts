import type { Watched } from '../../lang/Watched';
import type { TargetShape } from '../TargetShape';

/** Reads how the user shapes their targets (MM-122, MM-124). */
export interface TargetShapeReader {
  /** Every shape set, oldest first by the day it took effect, then the full list after each change. */
  watchTargetShapes(): Watched<TargetShape[]>;
}
