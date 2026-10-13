import type { AppServices } from '../state/AppServices';
import type { AppState } from '../state/AppState';

/** What every screen can reach: where things are stored, and what is worked out from them. */
export interface AppScope {
  readonly services: AppServices;
  readonly state: AppState;
}
