import { CalendarDate } from './CalendarDate';
import type { DayCompleteness } from './DayCompleteness';
import type { FoodEntry } from './FoodEntry';
import type { IntakeDay } from './IntakeDay';
import { intakeDayFrom } from './intakeDayFrom';

/**
 * One intake observation per day that has any food logged, oldest first.
 *
 * Both the database and the in-memory repositories use this, so they cannot
 * disagree about how a day's intake is formed. `completenessByEpochDay` is
 * keyed by `CalendarDate.epochDay`.
 */
export function intakeDaysFrom(
  entries: Iterable<FoodEntry>,
  completenessByEpochDay: ReadonlyMap<number, DayCompleteness>,
): IntakeDay[] {
  const byDay = new Map<number, FoodEntry[]>();
  for (const e of entries) {
    const day = byDay.get(e.date.epochDay);
    if (day === undefined) {
      byDay.set(e.date.epochDay, [e]);
    } else {
      day.push(e);
    }
  }
  const days = [...byDay.keys()].sort((a, b) => a - b);
  return days.map((day) =>
    intakeDayFrom(CalendarDate.fromEpochDay(day), byDay.get(day) ?? [], {
      completeness: completenessByEpochDay.get(day) ?? 'unmarked',
    }),
  );
}
