import type { MoveParcel } from './MoveParcel';
import type { MoveProblem } from './MoveProblem';

/** What a fake receiver does once its code is shown (MM-698): a parcel of everything, or of foods (MM-715). */
export type FakeReceiveOutcome =
  | { readonly kind: 'waits' }
  | { readonly kind: 'receiving'; readonly done: number; readonly total: number }
  | { readonly kind: 'receives'; readonly parcel: MoveParcel }
  | { readonly kind: 'fails'; readonly problem: MoveProblem };
