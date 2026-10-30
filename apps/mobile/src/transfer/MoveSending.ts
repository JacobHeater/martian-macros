import type { MoveCode } from './MoveCode';
import type { MoveParcel } from './MoveParcel';
import type { MoveProgress } from './MoveProgress';

/** What the sending phone's screen needs of a move (MM-698), or of a copy of foods (MM-715). */
export interface MoveSending {
  /** Sends `parcel` to the phone that showed `code`; fails with a `MoveProblem`. */
  send(code: MoveCode, parcel: MoveParcel, progress?: MoveProgress): Promise<void>;
}
