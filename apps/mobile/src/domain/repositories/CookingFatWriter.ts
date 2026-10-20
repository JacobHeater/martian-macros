import type { CookingFatKind } from '../food/CookingFatKind';

/** Writes the fat the person usually cooks with (MM-152). */
export interface CookingFatWriter {
  saveUsualCookingFat(kind: CookingFatKind): Promise<void>;
}
