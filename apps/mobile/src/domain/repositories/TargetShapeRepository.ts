import type { TargetShapeReader } from './TargetShapeReader';
import type { TargetShapeWriter } from './TargetShapeWriter';

/**
 * Reads and writes how the user shapes their targets (MM-122, MM-124). Held
 * in memory until its table exists (MM-486).
 */
export interface TargetShapeRepository extends TargetShapeReader, TargetShapeWriter {}
