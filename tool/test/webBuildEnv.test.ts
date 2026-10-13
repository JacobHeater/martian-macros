import assert from 'node:assert/strict';
import { test } from 'node:test';
import { webBuildEnv } from '../src/android.ts';

/**
 * MM-177: only `mm demo --seed` builds a shell that starts from the demo
 * scenario; a normal build never carries the variable, even when the
 * caller's shell happens to have it set.
 */
test('a seeded build sets MM_DEMO_SEED and keeps the rest of the environment', () => {
  const env = webBuildEnv({ PATH: 'p', HOME: 'h' }, { seed: true });
  assert.deepEqual(env, { PATH: 'p', HOME: 'h', MM_DEMO_SEED: '1' });
});

test('a normal build never carries MM_DEMO_SEED, whatever the shell had', () => {
  assert.deepEqual(webBuildEnv({ PATH: 'p', MM_DEMO_SEED: '1' }, { seed: false }), { PATH: 'p' });
  assert.deepEqual(webBuildEnv({ PATH: 'p' }, { seed: false }), { PATH: 'p' });
});
