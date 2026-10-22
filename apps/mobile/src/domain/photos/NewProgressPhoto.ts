import type { CalendarDate } from '../CalendarDate';
import type { PhotoPose } from './PhotoPose';

/** A photo to keep (MM-157): its day, pose and time, and the picture as a JPEG of about 2 megapixels. */
export interface NewProgressPhoto {
  readonly date: CalendarDate;
  readonly pose: PhotoPose;
  readonly takenAt: Date;
  readonly width: number;
  readonly height: number;
  readonly jpeg: Uint8Array;
}
