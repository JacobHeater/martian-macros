import { CoachAiConfig } from '../domain/integration/CoachAiConfig';
import type { CoachAiStore } from '../domain/integration/CoachAiStore';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/**
 * `CoachAiStore` held in memory for tests and stories (MM-665).
 */
export class InMemoryCoachAiStore implements CoachAiStore {
  private readonly config = new ObservableValue<CoachAiConfig>(CoachAiConfig.off);

  watchConfig(): Watched<CoachAiConfig> {
    return this.config.watch();
  }

  async loadConfig(): Promise<CoachAiConfig> {
    return this.config.value;
  }

  async saveConfig(config: CoachAiConfig): Promise<void> {
    this.config.value = { provider: config.provider, apiKey: config.apiKey.trim() };
  }
}
