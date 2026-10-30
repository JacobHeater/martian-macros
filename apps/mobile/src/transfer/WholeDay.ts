import type { DayCompleteness } from '../domain/DayCompleteness';
import type { DayKind } from '../domain/DayKind';

/**
 * A copy that is a whole day, synced to the other phone (MM-719): the day's marks go with its foods and water, and
 * the receiving phone makes its day match rather than add to it.
 */
export interface WholeDay {
  readonly kind: DayKind;
  readonly completeness: DayCompleteness;
}
