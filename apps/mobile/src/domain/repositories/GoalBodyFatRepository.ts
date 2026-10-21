import type { GoalBodyFatReader } from './GoalBodyFatReader';
import type { GoalBodyFatWriter } from './GoalBodyFatWriter';

/** Reads and writes the goal body fat (MM-36). The SQL table is MM-507. */
export interface GoalBodyFatRepository extends GoalBodyFatReader, GoalBodyFatWriter {}
