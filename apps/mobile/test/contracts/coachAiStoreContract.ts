import { describe, expect, it } from 'vitest';
import { CoachAiConfig } from '../../src/domain/integration/CoachAiConfig';
import type { CoachAiStore } from '../../src/domain/integration/CoachAiStore';

/**
 * Contract suite for every `CoachAiStore` implementation (MM-665).
 */
export function coachAiStoreContract(name: string, open: () => Promise<CoachAiStore> | CoachAiStore): void {
  describe(`CoachAiStore (${name})`, () => {
    it('starts off with no key and emits each saved configuration to watchers', async () => {
      const store = await open();
      const seen: CoachAiConfig[] = [];
      const stop = store.watchConfig().subscribe((config) => seen.push(config));

      expect(await store.loadConfig()).toEqual(CoachAiConfig.off);
      expect(seen).toEqual([CoachAiConfig.off]);

      await store.saveConfig({ provider: 'gemini', apiKey: '  AIzaSyTest123  ' });
      expect(await store.loadConfig()).toEqual({ provider: 'gemini', apiKey: 'AIzaSyTest123' });
      expect(seen.at(-1)).toEqual({ provider: 'gemini', apiKey: 'AIzaSyTest123' });

      await store.saveConfig(CoachAiConfig.off);
      expect(await store.loadConfig()).toEqual(CoachAiConfig.off);
      stop();
    });
  });
}
