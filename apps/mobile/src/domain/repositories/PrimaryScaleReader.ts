import type { Watched } from '../../lang/Watched';

/** Reads the scale the person chose as primary in Settings (MM-71). */
export interface PrimaryScaleReader {
  /**
   * The chosen scale's source id, then each change. Undefined until one is
   * chosen, and after "Automatic": the source with the most weigh-ins counts.
   */
  watchPrimaryScale(): Watched<string | undefined>;
}
