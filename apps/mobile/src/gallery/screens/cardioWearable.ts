import { CardioSession } from '../../domain/training/CardioSession';
import type { CardioActivity } from '../../domain/training/CardioActivity';
import type { StoryDevice } from './StoryDevice';
import { storyToday } from './storyToday';

const minuteMs = 60 * 1000;

/**
 * A watch worn for a fortnight (MM-677): its sessions and the phone's step
 * totals, as the app keeps them after a read of the platform. `long` makes
 * the week's longest session a stair climb of over an hour, for the
 * phone-width story. `stepsPerDay` is each day's total; `floorsSet` saves
 * the person's own floors (MM-678).
 */
export function cardioWearable({
  long = false,
  stepsPerDay = 6100,
  floorsSet = false,
}: { long?: boolean; stepsPerDay?: number; floorsSet?: boolean } = {}): StoryDevice {
  const session = (daysAgo: number, activity: CardioActivity, minutes: number, hour = 7) => {
    const date = storyToday.addDays(-daysAgo);
    const start = new Date(date.year, date.month - 1, date.day, hour, 5);
    return new CardioSession({ platformId: `${activity}-${daysAgo}`, sourceName: 'Watch', activity, start, end: new Date(start.getTime() + minutes * minuteMs) });
  };
  return async (services) => {
    await services.cardioSessions.saveCardioSessions([
      session(0, 'walking', 32),
      session(2, 'running', 24, 18),
      session(4, long ? 'stairClimbing' : 'walking', long ? 72 : 40),
      session(8, 'cycling', 55),
      session(11, 'walking', 35),
    ]);
    await services.dailySteps.saveDailySteps(Array.from({ length: 14 }, (_, daysAgo) => ({ date: storyToday.addDays(-daysAgo), steps: stepsPerDay + (daysAgo % 3) * 250 })));
    if (floorsSet) await services.preferences.saveCardioFloors({ stepsPerDay: 10000, minutesPerWeek: 120 });
    return services;
  };
}
