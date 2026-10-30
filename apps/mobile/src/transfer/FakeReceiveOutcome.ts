import type { MovePayload } from './MovePayload';
import type { MoveProblem } from './MoveProblem';

/** What a fake receiver does once its code is shown (MM-698). */
export type FakeReceiveOutcome =
  | { readonly kind: 'waits' }
  | { readonly kind: 'receiving'; readonly done: number; readonly total: number }
  | { readonly kind: 'receives'; readonly payload: MovePayload }
  | { readonly kind: 'fails'; readonly problem: MoveProblem };
