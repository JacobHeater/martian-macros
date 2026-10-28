import type { CalendarDate } from '../domain/CalendarDate';
import type { CardioSession } from '../domain/training/CardioSession';
import type { Workout } from '../domain/training/Workout';
import { Fmt } from '../format/Fmt';
import type { MmDayMark } from '../ui/MmDayMark';
import type { MmRhythmDay } from '../ui/MmRhythmDay';

const letters = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'] as const;
const weekdayOf = (date: CalendarDate) => new Date(date.year, date.month - 1, date.day).getDay();

const words: Readonly<Record<MmDayMark, string>> = {
  full: 'trained',
  half: 'cardio only',
  none: 'no workout',
};

/**
 * The last seven days as the Train screen's strip shows them (MM-258): a
 * full dot on a day with a finished workout, a half dot on a day with a
 * cardio session from the wearable and no workout (MM-677), an empty one
 * otherwise. The same rolling seven days as the Dashboard's strip, so the
 * two pictures mean one thing.
 */
export function trainedDays(workouts: readonly Workout[], today: CalendarDate, cardio: readonly CardioSession[] = []): MmRhythmDay[] {
  const trained = new Set(workouts.filter((workout) => !workout.inProgress).map((workout) => workout.date.epochDay));
  const moved = new Set(cardio.map((session) => session.date.epochDay));
  const days: MmRhythmDay[] = [];
  for (let back = 6; back >= 0; back--) {
    const date = today.addDays(-back);
    const mark: MmDayMark = trained.has(date.epochDay) ? 'full' : moved.has(date.epochDay) ? 'half' : 'none';
    days.push({
      key: String(date.epochDay),
      letter: letters[weekdayOf(date)] as string,
      label: `${Fmt.day(date, today)}: ${words[mark]}`,
      mark,
      today: back === 0,
    });
  }
  return days;
}
