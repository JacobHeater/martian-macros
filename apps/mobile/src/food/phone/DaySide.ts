import type { DayCompleteness } from '../../domain/DayCompleteness';
import type { DayKind } from '../../domain/DayKind';

/** One phone's day, counted, for the words of a sync (MM-719): its foods, its water and its marks. */
export interface DaySide {
  readonly foods: number;
  readonly waterMl: number;
  readonly kind: DayKind;
  readonly completeness: DayCompleteness;
}
