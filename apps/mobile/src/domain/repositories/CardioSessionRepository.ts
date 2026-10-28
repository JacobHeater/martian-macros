import type { Watched } from '../../lang/Watched';
import type { CardioSession } from '../training/CardioSession';

/**
 * The wearable's cardio sessions as kept in the app (MM-677), keyed by the
 * platform's id. Saving a session already kept changes it; nothing here
 * deletes, since the platform is the only source of truth.
 */
export interface CardioSessionRepository {
  /** Every session kept, newest first. */
  watchCardioSessions(): Watched<CardioSession[]>;

  /** Keeps each session, replacing one with the same platform id. */
  saveCardioSessions(sessions: readonly CardioSession[]): Promise<void>;
}
