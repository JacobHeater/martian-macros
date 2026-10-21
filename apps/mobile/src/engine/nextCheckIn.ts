import type { CalendarDate } from '../domain/CalendarDate';
import type { UserSetup } from '../domain/UserSetup';
import { calibrationDays, checkInIntervalDays } from './coachConstants';
import { breakFlagOf } from './breakFlagOf';
import { breakLengthDays } from './breakLengthDays';
import type { TargetsRecord } from './TargetsRecord';

/**
 * The first day targets may next change: a week after the current ones
 * took effect, or the break's own length after a diet break began (MM-135;
 * one week or two, MM-432), and never before calibration ends. From the
 * Flutter app, where it sat among the screens' state.
 */
export function nextCheckIn(setup: UserSetup, current: TargetsRecord): CalendarDate {
  const onBreak = breakFlagOf(current.targets.flags);
  const weekly = current.effectiveFrom.addDays(onBreak === undefined ? checkInIntervalDays : breakLengthDays(onBreak));
  const calibrated = setup.onboardedOn.addDays(calibrationDays);
  return weekly.isAfter(calibrated) ? weekly : calibrated;
}
