import { CoachAiConfig } from '../domain/integration/CoachAiConfig';
import { CoachAiProvider } from '../domain/integration/CoachAiProvider';
import type { CoachAiStore } from '../domain/integration/CoachAiStore';
import type { Watched } from '../lang/Watched';

const storageKey = 'mm.coachAiConfig.v1';

interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function parseConfig(raw: string | null): CoachAiConfig {
  if (raw === null || raw === '') return CoachAiConfig.off;
  try {
    const parsed = JSON.parse(raw) as { provider?: unknown; apiKey?: unknown };
    const provider = CoachAiProvider.values.find((p) => p === parsed.provider) ?? 'none';
    const apiKey = typeof parsed.apiKey === 'string' ? parsed.apiKey.trim() : '';
    return { provider, apiKey };
  } catch {
    return CoachAiConfig.off;
  }
}

/**
 * `CoachAiStore` backed by `localStorage` inside the native shell's WebView,
 * keeping the user's API key on this device and out of SQLite backup files
 * (MM-665).
 */
export class LocalStorageCoachAiStore implements CoachAiStore {
  private readonly storage: KeyValueStorage | undefined;
  private current: CoachAiConfig;
  private readonly listeners = new Set<(config: CoachAiConfig) => void>();

  constructor(storage: KeyValueStorage | undefined = typeof localStorage === 'undefined' ? undefined : localStorage) {
    this.storage = storage;
    this.current = parseConfig(this.storage?.getItem(storageKey) ?? null);
  }

  watchConfig(): Watched<CoachAiConfig> {
    return {
      subscribe: (listener) => {
        listener(this.current);
        this.listeners.add(listener);
        return () => {
          this.listeners.delete(listener);
        };
      },
    };
  }

  async loadConfig(): Promise<CoachAiConfig> {
    return this.current;
  }

  async saveConfig(config: CoachAiConfig): Promise<void> {
    const normalized: CoachAiConfig = { provider: config.provider, apiKey: config.apiKey.trim() };
    this.current = normalized;
    if (this.storage !== undefined) {
      if (normalized.provider === 'none' && normalized.apiKey === '') {
        this.storage.removeItem(storageKey);
      } else {
        this.storage.setItem(storageKey, JSON.stringify(normalized));
      }
    }
    for (const listener of [...this.listeners]) listener(normalized);
  }
}
