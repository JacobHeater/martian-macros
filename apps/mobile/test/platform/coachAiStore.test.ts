import { expect, it } from 'vitest';
import { InMemoryCoachAiStore } from '../../src/fixtures/InMemoryCoachAiStore';
import { LocalStorageCoachAiStore } from '../../src/platform/LocalStorageCoachAiStore';
import { coachAiStoreContract } from '../contracts/coachAiStoreContract';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
  };
}

coachAiStoreContract('In-memory', () => new InMemoryCoachAiStore());
coachAiStoreContract('LocalStorage', () => new LocalStorageCoachAiStore(memoryStorage()));

it('rehydrates a saved BYOK configuration across instances and ignores malformed JSON', async () => {
  const backing = memoryStorage();
  const first = new LocalStorageCoachAiStore(backing);
  await first.saveConfig({ provider: 'anthropic', apiKey: 'sk-ant-123' });

  const second = new LocalStorageCoachAiStore(backing);
  expect(await second.loadConfig()).toEqual({ provider: 'anthropic', apiKey: 'sk-ant-123' });

  backing.setItem('mm.coachAiConfig.v1', '{not-json');
  const malformed = new LocalStorageCoachAiStore(backing);
  expect(await malformed.loadConfig()).toEqual({ provider: 'none', apiKey: '' });
});
