import type { Watched } from '../../lang/Watched';
import type { OnlineLookupChoice } from '../food/online/OnlineLookupChoice';

/** Whether unknown foods may be looked up online (MM-58); "ask" until the person chooses. */
export interface OnlineLookupReader {
  watchOnlineLookup(): Watched<OnlineLookupChoice>;
}
