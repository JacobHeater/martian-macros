import type { CapturedPhoto } from './CapturedPhoto';

/**
 * The phone's share sheet for a meal (MM-599): its photos and the prompt
 * handed to the person's own assistant in one go. Whatever the phone needs
 * written to share them is in the app's cache, and `clear` deletes it.
 */
export interface MealShare {
  /** Whether the phone can share photos with text. */
  readonly available: boolean;

  /** Offers `photos` and `text` to the share sheet. `unavailable` when it cannot be opened. Never throws. */
  send(meal: { readonly text: string; readonly photos: readonly CapturedPhoto[] }): Promise<'sent' | 'cancelled' | 'unavailable'>;

  /** Deletes anything written to share the last meal. Never throws. */
  clear(): Promise<void>;
}
