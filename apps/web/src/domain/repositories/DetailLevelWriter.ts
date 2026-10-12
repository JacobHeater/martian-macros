import type { DetailLevel } from '../food/detail/DetailLevel';

/** Writes how much nutrition detail to show. */
export interface DetailLevelWriter {
  saveDetailLevel(level: DetailLevel): Promise<void>;
}
