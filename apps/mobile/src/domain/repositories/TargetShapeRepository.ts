import type { TargetShapeReader } from './TargetShapeReader';
import type { TargetShapeWriter } from './TargetShapeWriter';

/**
 * Reads and writes how the user shapes their targets (MM-122, MM-124): kept
 * in the database (`SqlTargetShapeRepository`, MM-486).
 */
export interface TargetShapeRepository extends TargetShapeReader, TargetShapeWriter {}
