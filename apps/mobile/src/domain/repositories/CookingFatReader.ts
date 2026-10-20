import type { Watched } from '../../lang/Watched';
import type { CookingFatKind } from '../food/CookingFatKind';

/** Reads the fat the person usually cooks with (MM-152). */
export interface CookingFatReader {
  /** The usual fat, then each change. Oil until one is chosen. */
  watchUsualCookingFat(): Watched<CookingFatKind>;
}
