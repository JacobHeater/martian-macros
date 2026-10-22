import type { CalendarDate } from '../CalendarDate';
import type { ProgressPhoto } from './ProgressPhoto';

/**
 * The photos grouped by the day they were taken, newest day first, each
 * day's in the order of the standard set (MM-157).
 */
export function photoSets(photos: readonly ProgressPhoto[]): { date: CalendarDate; photos: ProgressPhoto[] }[] {
  const order = ['front', 'side', 'back'];
  const byDay = new Map<number, { date: CalendarDate; photos: ProgressPhoto[] }>();
  for (const photo of photos) {
    const set = byDay.get(photo.date.epochDay) ?? { date: photo.date, photos: [] };
    set.photos.push(photo);
    byDay.set(photo.date.epochDay, set);
  }
  return [...byDay.values()]
    .sort((a, b) => b.date.epochDay - a.date.epochDay)
    .map((set) => ({
      date: set.date,
      photos: set.photos.sort((a, b) => order.indexOf(a.pose) - order.indexOf(b.pose) || b.takenAt.getTime() - a.takenAt.getTime()),
    }));
}
