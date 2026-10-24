import type { CapturedPhoto } from './CapturedPhoto';

/**
 * The phone's own photo picker (MM-599): photos of a meal chosen from the
 * library, to be sent to the person's assistant. The picker needs no
 * permission, since the person chooses each photo; the app holds what was
 * chosen only while it is sent, and keeps none.
 */
export interface PhotoLibrary {
  /** Whether the phone has a picker the app can open. */
  readonly available: boolean;

  /** Up to `max` photos the person chooses, each reduced to about 2 megapixels; none when they cancel or it fails. Never throws. */
  pick(max: number): Promise<readonly CapturedPhoto[]>;
}
