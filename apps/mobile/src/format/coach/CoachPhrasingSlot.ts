import type { coachPhrasings } from './coachPhrasings';

/** A slot of the coach's phrasing grammar (MM-617): one of `coachPhrasings`' keys. */
export type CoachPhrasingSlot = keyof typeof coachPhrasings;
