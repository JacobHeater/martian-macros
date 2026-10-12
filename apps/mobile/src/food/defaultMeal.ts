import type { Clock } from '../domain/integration/Clock';
import type { Meal } from '../domain/Meal';

/**
 * The meal a new entry starts in, by the time of day. It asks the app's
 * clock, never the device directly, so a test can fix the hour (MM-190).
 */
export function defaultMeal(clock: Clock): Meal {
  const hour = clock.now().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 15) return 'lunch';
  return hour < 21 ? 'dinner' : 'snack';
}
