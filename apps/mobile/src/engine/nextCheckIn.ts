import type { CalendarDate } from '../domain/CalendarDate';
import type { UserSetup } from '../domain/UserSetup';
import { calibrationDays, checkInIntervalDays } from './coachConstants';
import { DietBreakRule } from './DietBreakRule';
import type { TargetsRecord } from './TargetsRecord';

/**
 * The first day targets may next change: a week after the current ones
 * took effect, or the break's length after a diet break began (MM-135),
 * and never before calibration ends. From the Flutter app, where it sat
 * among the screens' state.
 */
export function nextCheckIn(setup: UserSetup, current: TargetsRecord): CalendarDate {
  const onBreak = current.targets.flags.has('dietBreak') || current.targets.flags.has('requestedBreak');
  const weekly = current.effectiveFrom.addDays(onBreak ? DietBreakRule.breakWeeks * 7 : checkInIntervalDays);
  const calibrated = setup.onboardedOn.addDays(calibrationDays);
  return weekly.isAfter(calibrated) ? weekly : calibrated;
}
