import type { CalendarDate } from '../domain/CalendarDate';
import type { IntakeDay } from '../domain/IntakeDay';
import { Fmt } from '../format/Fmt';
import type { MmDayMark } from '../ui/MmDayMark';
import type { MmRhythmDay } from '../ui/MmRhythmDay';

const letters = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'] as const;
const weekdayOf = (date: CalendarDate) => new Date(date.year, date.month - 1, date.day).getDay();

const words: Readonly<Record<MmDayMark, string>> = {
  full: 'logged and marked complete',
  half: 'partly logged',
  none: 'nothing logged',
};

/**
 * The last seven days as the Dashboard's rhythm strip shows them (MM-254):
 * a day marked complete is a full dot, a day with food logged but not
 * marked complete (or marked partial) a half dot, a day with nothing an
 * empty one. Rolling seven days, so every dot is a real day.
 */
export function rhythmDays(intake: readonly IntakeDay[], today: CalendarDate): MmRhythmDay[] {
  const byDay = new Map(intake.map((day) => [day.date.epochDay, day]));
  const days: MmRhythmDay[] = [];
  for (let back = 6; back >= 0; back--) {
    const date = today.addDays(-back);
    const logged = byDay.get(date.epochDay);
    let mark: MmDayMark = 'none';
    if (logged !== undefined && logged.completeness === 'complete') mark = 'full';
    else if (logged !== undefined && logged.kcal > 0) mark = 'half';
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
