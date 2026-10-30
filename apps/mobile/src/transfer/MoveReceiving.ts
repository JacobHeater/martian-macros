import type { MoveCode } from './MoveCode';
import type { MoveParcel } from './MoveParcel';
import type { MoveProgress } from './MoveProgress';

/** What the receiving phone's screen needs of a move (MM-698), or of a copy of foods (MM-715). */
export interface MoveReceiving {
  /** Listens under a new key and gives the code to show; fails with a `MoveProblem` of kind `noWifi`. */
  open(): Promise<MoveCode>;
  /** The parcel from the phone that scanned the code; fails with a `MoveProblem`. */
  receive(progress?: MoveProgress): Promise<MoveParcel>;
  /** Stops listening; the code shown no longer works. */
  stop(): Promise<void>;
}
