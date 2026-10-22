import type { CalendarDate } from '../CalendarDate';
import { photoSetSpacingDays } from './photoSetSpacingDays';
import type { ProgressPhoto } from './ProgressPhoto';

/**
 * Whether a set taken on `day` comes within `photoSetSpacingDays` of an
 * earlier set (MM-157): it is still kept, and gently noted. A photo
 * already taken on `day` itself is the same set.
 */
export function tooSoonForPhotos(photos: readonly ProgressPhoto[], day: CalendarDate): boolean {
  return photos.some((photo) => photo.date.epochDay < day.epochDay && day.epochDay - photo.date.epochDay < photoSetSpacingDays);
}
