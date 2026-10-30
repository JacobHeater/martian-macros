import type { MoveCode } from './MoveCode';
import type { MovePayload } from './MovePayload';
import type { MoveProgress } from './MoveProgress';

/** What the sending phone's screen needs of a move (MM-697). */
export interface MoveSending {
  /** Sends `payload` to the phone that showed `code`; fails with a `MoveProblem`. */
  send(code: MoveCode, payload: MovePayload, progress?: MoveProgress): Promise<void>;
}
