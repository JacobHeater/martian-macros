import type { CalendarDate } from '../../../domain/CalendarDate';
import type { DayKind } from '../../../domain/DayKind';
import type { FoodEntry } from '../../../domain/FoodEntry';
import type { IntakeDay } from '../../../domain/IntakeDay';
import type { TargetsRecord } from '../../TargetsRecord';

/** One calendar day as the food analysis reads it (MM-606). */
export interface FoodDay {
  readonly date: CalendarDate;
  readonly entries: readonly FoodEntry[];

  /** The day's totals, when anything was logged. */
  readonly intake: IntakeDay | undefined;

  /** A whole day of eating (`usableIntakeDays`): a partial day is judged by no signal, ratios included. */
  readonly whole: boolean;

  /** The targets in force that day: every day is judged by its own (`recordOn`). */
  readonly record: TargetsRecord | undefined;

  /** The day's calorie target as planned (MM-124): the flat target times the day's planned share. */
  readonly kcalTarget: number | undefined;

  /** A Refeed or a Day off (MM-611); 'none' for an ordinary day. */
  readonly kind: DayKind;
}
