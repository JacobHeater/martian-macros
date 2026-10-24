import type { CapturedPhoto } from '../domain/integration/CapturedPhoto';
import type { MealShare } from '../domain/integration/MealShare';

const fileOf = (photo: CapturedPhoto, at: number) =>
  new File([photo.jpeg as BlobPart], `meal-${at + 1}.jpg`, { type: 'image/jpeg' });

/**
 * `MealShare` through a browser's share, where it can share files (MM-599).
 * Nothing is written anywhere: the files are made in memory and handed on.
 * Where the browser cannot share files, it is unavailable.
 */
export class NavigatorMealShare implements MealShare {
  get available(): boolean {
    try {
      if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false;
      return navigator.canShare({ files: [fileOf({ jpeg: new Uint8Array(), width: 0, height: 0 }, 0)] });
    } catch {
      return false;
    }
  }

  async send({ text, photos }: { readonly text: string; readonly photos: readonly CapturedPhoto[] }): Promise<'sent' | 'cancelled' | 'unavailable'> {
    if (!this.available) return 'unavailable';
    try {
      await navigator.share({ text, files: photos.map(fileOf) });
      return 'sent';
    } catch (error) {
      return error instanceof DOMException && error.name === 'AbortError' ? 'cancelled' : 'unavailable';
    }
  }

  async clear(): Promise<void> {}
}
