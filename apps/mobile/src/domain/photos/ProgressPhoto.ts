import type { CalendarDate } from '../CalendarDate';
import type { PhotoPose } from './PhotoPose';

/**
 * One progress photo as the list knows it (MM-157): which day and pose, when
 * it was taken and its size in pixels. Its picture is read on its own
 * (`ProgressPhotoReader.photoBytes`), so a list never holds every picture.
 */
export interface ProgressPhoto {
  readonly id: number;
  readonly date: CalendarDate;
  readonly pose: PhotoPose;
  readonly takenAt: Date;
  readonly width: number;
  readonly height: number;
  /** The size of its picture, in bytes. */
  readonly bytes: number;
}
