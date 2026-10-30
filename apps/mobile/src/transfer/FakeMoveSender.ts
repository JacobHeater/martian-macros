import type { MoveCode } from './MoveCode';
import type { MoveParcel } from './MoveParcel';
import type { FakeSendOutcome } from './FakeSendOutcome';
import type { MoveProgress } from './MoveProgress';
import type { MoveSending } from './MoveSending';

/** A sending phone for tests and stories (MM-698): it keeps what it was asked to send, and sends, stays part-way, or fails, as told. */
export class FakeMoveSender implements MoveSending {
  outcome: FakeSendOutcome;
  readonly sent: { code: MoveCode; parcel: MoveParcel }[] = [];

  constructor(outcome: FakeSendOutcome = { kind: 'sends' }) {
    this.outcome = outcome;
  }

  send(code: MoveCode, parcel: MoveParcel, progress?: MoveProgress): Promise<void> {
    const outcome = this.outcome;
    switch (outcome.kind) {
      case 'sends':
        this.sent.push({ code, parcel });
        progress?.(1, 1);
        return Promise.resolve();
      case 'connecting':
        return new Promise<void>(() => undefined);
      case 'sending':
        progress?.(outcome.done, outcome.total);
        return new Promise<void>(() => undefined);
      case 'fails':
        return Promise.reject(outcome.problem);
    }
  }
}
