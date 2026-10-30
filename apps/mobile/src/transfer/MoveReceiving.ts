import type { MoveCode } from './MoveCode';
import type { MovePayload } from './MovePayload';
import type { MoveProgress } from './MoveProgress';

/** What the receiving phone's screen needs of a move (MM-697). */
export interface MoveReceiving {
  /** Listens under a new key and gives the code to show; fails with a `MoveProblem` of kind `noWifi`. */
  open(): Promise<MoveCode>;
  /** The payload from the phone that scanned the code; fails with a `MoveProblem`. */
  receive(progress?: MoveProgress): Promise<MovePayload>;
  /** Stops listening; the code shown no longer works. */
  stop(): Promise<void>;
}
