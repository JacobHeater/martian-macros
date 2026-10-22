import type { Watched } from '../../lang/Watched';
import type { WeightDisplay } from '../WeightDisplay';

/** Reads how much of the person's weight the app shows (MM-118). */
export interface WeightDisplayReader {
  /**
   * The display the person chose, then each change. Undefined until one is
   * chosen: the default then follows the health check (`weightDisplayOf`).
   */
  watchWeightDisplay(): Watched<WeightDisplay | undefined>;

  /** Whether the one-time offer of the setting (frequent weighing) has been answered, then each change. */
  watchWeightDisplayOffered(): Watched<boolean>;
}
