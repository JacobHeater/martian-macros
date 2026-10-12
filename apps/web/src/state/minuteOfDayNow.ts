import type { Clock } from '../domain/integration/Clock';

/** The minutes after midnight on `clock`. */
export function minuteOfDayNow(clock: Clock): number {
  const now = clock.now();
  return now.getHours() * 60 + now.getMinutes();
}
