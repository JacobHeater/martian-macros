import type { Watched } from '../../lang/Watched';
import type { Entitlement } from './Entitlement';

/**
 * Whether Coach is available. Implemented by the store billing libraries, a
 * local trial clock, or a fixture; free logging never depends on it.
 */
export interface EntitlementReader {
  /** The current entitlement, then every change. */
  watchEntitlement(): Watched<Entitlement>;
}
