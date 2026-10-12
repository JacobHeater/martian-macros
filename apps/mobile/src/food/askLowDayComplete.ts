import type { DayCompleteness } from '../domain/DayCompleteness';
import { Fmt } from '../format/Fmt';
import type { Overlays } from '../ui/Overlays';

/**
 * Asked when a day far below the calorie floor is marked complete (MM-114).
 * A deliberate fast is a legitimate Yes. Gives the mark to store, or
 * undefined if the question was closed without an answer.
 */
export function askLowDayComplete(overlays: Overlays, loggedKcal: number): Promise<DayCompleteness | undefined> {
  return overlays.choice<DayCompleteness>({
    title: 'Is this everything you ate today?',
    message:
      `${Fmt.whole(loggedKcal)} kcal is logged. If food is missing, mark the ` +
      'day partial so the coach does not read it as a full day.',
    primaryLabel: 'Yes',
    primary: 'complete',
    secondaryLabel: 'Mark partial',
    secondary: 'partial',
  });
}
