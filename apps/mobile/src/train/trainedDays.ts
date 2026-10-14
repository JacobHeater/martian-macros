import type { CalendarDate } from '../domain/CalendarDate';
import type { Workout } from '../domain/training/Workout';
import { Fmt } from '../format/Fmt';
import type { MmRhythmDay } from '../ui/MmRhythmDay';

const letters = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'] as const;
const weekdayOf = (date: CalendarDate) => new Date(date.year, date.month - 1, date.day).getDay();

/**
 * The last seven days as the Train screen's strip shows them (MM-258): a
 * full dot on a day with a finished workout, an empty one otherwise. The
 * same rolling seven days as the Dashboard's strip, so the two pictures
 * mean one thing.
 */
export function trainedDays(workouts: readonly Workout[], today: CalendarDate): MmRhythmDay[] {
  const trained = new Set(workouts.filter((workout) => !workout.inProgress).map((workout) => workout.date.epochDay));
  const days: MmRhythmDay[] = [];
  for (let back = 6; back >= 0; back--) {
    const date = today.addDays(-back);
    const done = trained.has(date.epochDay);
    days.push({
      key: String(date.epochDay),
      letter: letters[weekdayOf(date)] as string,
      label: `${Fmt.day(date, today)}: ${done ? 'trained' : 'no workout'}`,
      mark: done ? 'full' : 'none',
      today: back === 0,
    });
  }
  return days;
}
