import type { LinkAddress } from './LinkAddress';
import type { LinkConnection } from './LinkConnection';

/** The sending phone's side of the link (MM-697). */
export interface LinkDialer {
  /** Connects to the receiving phone. Fails with a `MoveProblem` of kind `unreachable` when it cannot be reached. */
  connect(address: LinkAddress): Promise<LinkConnection>;
}
