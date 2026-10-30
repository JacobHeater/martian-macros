import type { LinkAddress } from './LinkAddress';
import type { LinkConnection } from './LinkConnection';
import type { LinkDialer } from './LinkDialer';
import type { LinkListener } from './LinkListener';
import { MoveProblem } from './MoveProblem';

/** One end of an in-memory connection: frames queued for it, and whoever waits on the next. */
class End implements LinkConnection {
  private readonly inbox: Uint8Array[] = [];
  private readonly waiting: ((frame: Uint8Array | undefined) => void)[] = [];
  private closed = false;
  private readonly network: FakeLocalNetwork;
  other: End | undefined;

  constructor(network: FakeLocalNetwork) {
    this.network = network;
  }

  deliver(frame: Uint8Array): void {
    if (this.closed) return;
    const waiter = this.waiting.shift();
    if (waiter === undefined) this.inbox.push(frame);
    else waiter(frame);
  }

  hangUp(): void {
    this.closed = true;
    for (const waiter of this.waiting.splice(0)) waiter(undefined);
  }

  async send(frame: Uint8Array): Promise<void> {
    if (this.closed) throw new Error('The connection is closed.');
    const index = this.network.frames.length;
    const carried = this.network.tamper?.(frame, index) ?? frame;
    this.network.frames.push(carried.slice());
    this.other?.deliver(carried.slice());
  }

  receive(): Promise<Uint8Array | undefined> {
    const frame = this.inbox.shift();
    if (frame !== undefined) return Promise.resolve(frame);
    if (this.closed) return Promise.resolve(undefined);
    return new Promise((resolve) => this.waiting.push(resolve));
  }

  async close(): Promise<void> {
    this.hangUp();
    this.other?.hangUp();
  }
}

/**
 * A Wi-Fi in memory for tests (MM-698): one phone listens on it and any number may connect. Every frame either way
 * is kept in `frames`, as someone watching the network would see it, and `tamper` may change one on the way.
 */
export class FakeLocalNetwork implements LinkListener, LinkDialer {
  readonly address: LinkAddress = { host: '192.168.1.24', port: 47_310 };
  readonly frames: Uint8Array[] = [];
  tamper: ((frame: Uint8Array, index: number) => Uint8Array) | undefined;
  noWifi = false;
  listening = false;
  private readonly pending: End[] = [];
  private readonly accepting: { resolve: (end: End) => void; reject: (error: Error) => void }[] = [];

  async listen(): Promise<LinkAddress> {
    if (this.noWifi) throw new MoveProblem('noWifi');
    this.listening = true;
    return this.address;
  }

  accept(): Promise<LinkConnection> {
    if (!this.listening) return Promise.reject(new MoveProblem('stopped'));
    const end = this.pending.shift();
    if (end !== undefined) return Promise.resolve(end);
    return new Promise((resolve, reject) => this.accepting.push({ resolve, reject }));
  }

  async stop(): Promise<void> {
    this.listening = false;
    for (const waiter of this.accepting.splice(0)) waiter.reject(new MoveProblem('stopped'));
  }

  async connect(address: LinkAddress): Promise<LinkConnection> {
    if (!this.listening || address.host !== this.address.host || address.port !== this.address.port) {
      throw new MoveProblem('unreachable');
    }
    const dialing = new End(this);
    const answering = new End(this);
    dialing.other = answering;
    answering.other = dialing;
    const waiter = this.accepting.shift();
    if (waiter === undefined) this.pending.push(answering);
    else waiter.resolve(answering);
    return dialing;
  }
}
