import type { PauseReader } from './PauseReader';
import type { PauseWriter } from './PauseWriter';

/** Reads and writes pauses (MM-148). */
export interface PauseRepository extends PauseReader, PauseWriter {}
