import type { CalendarDate } from '../domain/CalendarDate';
import type { UserSetup } from '../domain/UserSetup';
import { calibrationDays, checkInIntervalDays } from './coachConstants';
import type { TargetsRecord } from './TargetsRecord';

/**
 * The first day targets may next change: a week after the current ones
 * took effect, and never before calibration ends. From the Flutter app,
 * where it sat among the screens' state.
 */
export function nextCheckIn(setup: UserSetup, current: TargetsRecord): CalendarDate {
  const weekly = current.effectiveFrom.addDays(checkInIntervalDays);
  const calibrated = setup.onboardedOn.addDays(calibrationDays);
  return weekly.isAfter(calibrated) ? weekly : calibrated;
}
