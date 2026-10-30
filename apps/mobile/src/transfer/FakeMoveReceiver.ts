import { MoveCode } from './MoveCode';
import type { MoveParcel } from './MoveParcel';
import { MoveProblem } from './MoveProblem';
import type { FakeReceiveOutcome } from './FakeReceiveOutcome';
import type { MoveProgress } from './MoveProgress';
import type { MoveReceiving } from './MoveReceiving';

/**
 * A receiving phone for tests and stories (MM-698): its code is a fixed address with a key of counted bytes, and once
 * shown it waits, stays part-way, receives the payload it was given, or fails, as told. `open` fails with `noWifi`
 * when told there is none. Every code it opens carries a new key, as the real one's do.
 */
export class FakeMoveReceiver implements MoveReceiving {
  outcome: FakeReceiveOutcome;
  noWifi = false;
  /** Never gives a code, as a phone still getting one ready. */
  holdsOpening = false;
  listening = false;
  opened = 0;

  constructor(outcome: FakeReceiveOutcome = { kind: 'waits' }) {
    this.outcome = outcome;
  }

  async open(): Promise<MoveCode> {
    if (this.noWifi) throw new MoveProblem('noWifi');
    if (this.holdsOpening) return new Promise<MoveCode>(() => undefined);
    this.opened += 1;
    this.listening = true;
    return new MoveCode({ host: '192.168.1.24', port: 47_310 }, new Uint8Array(32).map((_, i) => (i * 7 + this.opened) % 256));
  }

  receive(progress?: MoveProgress): Promise<MoveParcel> {
    const outcome = this.outcome;
    switch (outcome.kind) {
      case 'waits':
        return new Promise<MoveParcel>(() => undefined);
      case 'receiving':
        progress?.(outcome.done, outcome.total);
        return new Promise<MoveParcel>(() => undefined);
      case 'receives': {
        this.listening = false;
        const size = outcome.parcel.kind === 'everything' ? outcome.parcel.payload.snapshot.length : outcome.parcel.foods.length;
        progress?.(size, size);
        return Promise.resolve(outcome.parcel);
      }
      case 'fails':
        this.listening = false;
        return Promise.reject(outcome.problem);
    }
  }

  async stop(): Promise<void> {
    this.listening = false;
  }
}
