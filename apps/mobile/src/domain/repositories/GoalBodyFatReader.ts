import type { Watched } from '../../lang/Watched';
import type { GoalBodyFat } from '../GoalBodyFat';

/** Reads the goal body fat the user set (MM-36). */
export interface GoalBodyFatReader {
  /** The goal, or undefined with none, then the goal after each change. */
  watchGoalBodyFat(): Watched<GoalBodyFat | undefined>;
}
