import type { CoachAiConfig } from '../domain/integration/CoachAiConfig';

/**
 * What a move carries (MM-698): the database's snapshot and the progress photos' archive, as a backup holds them, and
 * the coach's provider and API key (MM-701), which a backup never holds.
 */
export interface MovePayload {
  readonly snapshot: Uint8Array;
  readonly photos: Uint8Array;
  readonly coachAi: CoachAiConfig;
}
