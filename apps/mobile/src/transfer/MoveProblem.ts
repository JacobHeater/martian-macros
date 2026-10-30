import type { MoveIdentity } from './MoveIdentity';
import type { MoveProblemKind } from './MoveProblemKind';

/** A move that did not happen, and why (MM-695). A version mismatch carries the other phone's identity. */
export class MoveProblem extends Error {
  override readonly name = 'MoveProblem';

  readonly kind: MoveProblemKind;
  readonly other: MoveIdentity | undefined;

  constructor(kind: MoveProblemKind, other?: MoveIdentity) {
    super(`The move did not happen: ${kind}.`);
    this.kind = kind;
    this.other = other;
  }
}
