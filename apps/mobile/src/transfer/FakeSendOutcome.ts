import type { MoveProblem } from './MoveProblem';

/** What a fake sender does with a scanned code (MM-697). */
export type FakeSendOutcome =
  | { readonly kind: 'sends' }
  | { readonly kind: 'connecting' }
  | { readonly kind: 'sending'; readonly done: number; readonly total: number }
  | { readonly kind: 'fails'; readonly problem: MoveProblem };
