import type { CoachAdvice } from './CoachAdvice';

/** What goes in a food's place (MM-617), as `CoachAdvice.replacement` holds it. */
export type CoachAdviceReplacement = NonNullable<CoachAdvice['replacement']>;
