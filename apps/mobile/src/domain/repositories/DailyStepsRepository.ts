import type { Watched } from '../../lang/Watched';
import type { StepsDay } from '../training/StepsDay';

/**
 * The platform's daily step totals as kept in the app (MM-677), one row a
 * day. Saving a day already kept changes it; a day the platform no longer
 * totals is not chased.
 */
export interface DailyStepsRepository {
  /** Every day kept, oldest first. */
  watchDailySteps(): Watched<StepsDay[]>;

  /** Keeps each day's total, replacing the day's row. A day with no steps above zero is not kept. */
  saveDailySteps(days: readonly StepsDay[]): Promise<void>;
}
