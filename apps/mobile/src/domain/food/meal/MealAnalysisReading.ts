import type { MealDraft } from './MealDraft';

/** What was read from a pasted answer (MM-586): a meal to review, or why there is none. */
export type MealAnalysisReading = { readonly kind: 'read'; readonly draft: MealDraft } | { readonly kind: 'unreadable'; readonly reason: string };
