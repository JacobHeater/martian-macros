import type { Watched } from '../../lang/Watched';
import type { DetailLevel } from '../food/detail/DetailLevel';

/** Reads how much nutrition detail to show. */
export interface DetailLevelReader {
  /** The setting, then each change. Standard until it changes. */
  watchDetailLevel(): Watched<DetailLevel>;
}
