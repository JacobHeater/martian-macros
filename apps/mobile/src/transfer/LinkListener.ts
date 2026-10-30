import type { LinkAddress } from './LinkAddress';
import type { LinkConnection } from './LinkConnection';

/** The receiving phone's side of the link (MM-697): it listens on the Wi-Fi while its code is on screen. */
export interface LinkListener {
  /** Starts listening and says where. Fails with a `MoveProblem` of kind `noWifi` when the phone has no Wi-Fi address. */
  listen(): Promise<LinkAddress>;
  /** The next connection. Fails with kind `stopped` once `stop` is called. */
  accept(): Promise<LinkConnection>;
  /** Stops listening; a waiting `accept` fails, and nothing more is accepted. */
  stop(): Promise<void>;
}
