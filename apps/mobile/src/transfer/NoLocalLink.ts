import type { LinkAddress } from './LinkAddress';
import type { LinkConnection } from './LinkConnection';
import type { LinkDialer } from './LinkDialer';
import type { LinkListener } from './LinkListener';
import { MoveProblem } from './MoveProblem';

/** Where the app cannot use the local network itself: a browser (MM-695). Listening says there is no Wi-Fi; connecting, that the other phone cannot be reached. */
export class NoLocalLink implements LinkListener, LinkDialer {
  listen(): Promise<LinkAddress> {
    return Promise.reject(new MoveProblem('noWifi'));
  }

  accept(): Promise<LinkConnection> {
    return Promise.reject(new MoveProblem('stopped'));
  }

  async stop(): Promise<void> {}

  connect(): Promise<LinkConnection> {
    return Promise.reject(new MoveProblem('unreachable'));
  }
}
