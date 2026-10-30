import type { Watched } from '../../lang/Watched';
import type { CoachAiConfig } from './CoachAiConfig';

/**
 * Keeps the person's optional BYOK coaching provider and API key on this
 * device, outside the SQLite database so it never enters an exported backup
 * file (MM-665). A move to the person's other phone carries it, sealed (MM-701).
 */
export interface CoachAiStore {
  watchConfig(): Watched<CoachAiConfig>;
  loadConfig(): Promise<CoachAiConfig>;
  saveConfig(config: CoachAiConfig): Promise<void>;
}
