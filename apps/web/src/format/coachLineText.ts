import type { CalendarDate, UserSetup } from '../domain';
import { calibrationDays, type ConfidenceLevel, nextCheckIn, type TargetsRecord } from '../engine';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { Fmt } from './Fmt';

/** The one line the dashboard says about what the coach is doing. */
export function coachLineText({
  setup,
  history,
  today,
  confidence = 'good',
}: {
  setup: UserSetup;
  history: readonly TargetsRecord[];
  today: CalendarDate;
  confidence?: ConfidenceLevel;
}): string {
  const day = setup.onboardedOn.daysUntil(today) + 1;
  if (day <= calibrationDays) {
    return `Calibration, day ${day} of ${calibrationDays}. Targets hold while the app learns your metabolism.`;
  }
  const current = history[history.length - 1];
  if (current === undefined) return 'Targets arrive with your first weigh-in.';
  const previous = history[history.length - 2];
  if (previous !== undefined && current.effectiveFrom.daysUntil(today) <= 7) {
    const change = current.targets.kcal - previous.targets.kcal;
    if (roundHalfAwayFromZero(change) !== 0) {
      const approximate = confidence !== 'good';
      return (
        'Targets went ' +
        `${change < 0 ? 'down' : 'up'} ` +
        `${approximate ? 'about ' : ''}` +
        `${roundHalfAwayFromZero(Math.abs(change))} kcal on ` +
        `${Fmt.day(current.effectiveFrom, today)}` +
        `${approximate ? ', so far' : ''}.`
      );
    }
  }
  if (confidence === 'learning') return 'Targets are held while the coach learns from more complete data.';
  return `Next check-in ${Fmt.day(nextCheckIn(setup, current), today)}.`;
}
