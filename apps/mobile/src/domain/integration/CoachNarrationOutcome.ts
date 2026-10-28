/**
 * What came of asking the person's own model for the coach's words (MM-671):
 * its words, or the one reason there are none, so Settings can show the
 * reason instead of the coach falling back without a word.
 */
export type CoachNarrationOutcome =
  /** No provider chosen, or no key saved: nothing was asked. */
  | { readonly kind: 'off' }
  | { readonly kind: 'narrated'; readonly text: string; readonly cached: boolean }
  /** The request never got an answer: no connection, a timeout. */
  | { readonly kind: 'unreachable'; readonly detail: string }
  /** The provider answered with an error status; `detail` is its message, when it gave one. */
  | { readonly kind: 'refused'; readonly status: number; readonly detail: string }
  /** The provider answered, with no words in it. */
  | { readonly kind: 'empty' }
  /** The provider's words failed `verifyCoachNarration`; `reason` says how. */
  | { readonly kind: 'rejected'; readonly text: string; readonly reason: string };
