import type { CapturedPhoto } from '../domain/integration/CapturedPhoto';
import type { MealShare } from '../domain/integration/MealShare';

/** A `MealShare` for tests and stories (MM-599): what is sent is only kept, and `clear` forgets it. */
export class InMemoryMealShare implements MealShare {
  available: boolean;
  /** What the person does in the share sheet, or `unavailable` for a sheet that could not be opened. */
  outcome: 'sent' | 'cancelled' | 'unavailable' = 'sent';
  /** The last meal handed to the share sheet, until it is cleared. */
  sent: { readonly text: string; readonly photos: readonly CapturedPhoto[] } | undefined;
  /** How many times it was cleared. */
  cleared = 0;

  constructor({ available = true }: { available?: boolean } = {}) {
    this.available = available;
  }

  async send(meal: { readonly text: string; readonly photos: readonly CapturedPhoto[] }): Promise<'sent' | 'cancelled' | 'unavailable'> {
    if (!this.available || this.outcome === 'unavailable') return 'unavailable';
    this.sent = meal;
    return this.outcome;
  }

  async clear(): Promise<void> {
    this.sent = undefined;
    this.cleared++;
  }
}
