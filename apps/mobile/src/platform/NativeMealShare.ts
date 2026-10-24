import type { CapturedPhoto } from '../domain/integration/CapturedPhoto';
import type { MealShare } from '../domain/integration/MealShare';
import { base64OfBytes } from '../lang/base64OfBytes';
import type { MmMealShareApi } from './MmMealShareApi';

/**
 * `MealShare` through the shell (MM-599): `MmBackup.shareMeal`, the share
 * sheet (iOS) or the send chooser (Android) with the photos and the prompt
 * together. The photos are written to the app's cache to be handed on, and
 * `clearMealShare` deletes them. A refusal is an answer, never an error.
 */
export class NativeMealShare implements MealShare {
  readonly available = true;
  private readonly api: MmMealShareApi;

  constructor(api: MmMealShareApi) {
    this.api = api;
  }

  async send({ text, photos }: { readonly text: string; readonly photos: readonly CapturedPhoto[] }): Promise<'sent' | 'cancelled' | 'unavailable'> {
    try {
      const { outcome } = await this.api.shareMeal({ text, photos: photos.map((photo) => base64OfBytes(photo.jpeg)) });
      return outcome;
    } catch {
      return 'unavailable';
    }
  }

  async clear(): Promise<void> {
    await this.api.clearMealShare().catch(() => undefined);
  }
}
