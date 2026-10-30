import type { FoodDraft } from './FoodDraft';

/** What was read from text pasted as a food answer (MM-709): the foods, or why nothing could be. */
export type FoodAnalysisReading = { readonly kind: 'read'; readonly foods: readonly FoodDraft[] } | { readonly kind: 'unreadable'; readonly reason: string };
