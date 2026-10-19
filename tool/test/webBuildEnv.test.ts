import assert from 'node:assert/strict';
import { test } from 'node:test';
import { webBuildEnv } from '../src/android.ts';

/**
 * MM-177, MM-8: the web build is told which identity its shell has, and
 * only `mm demo --seed` builds one that starts from the demo scenario; a
 * normal build never carries the seed variable, even when the caller's
 * shell happens to have it set.
 */
test('a seeded demo build sets MM_DEMO_SEED and keeps the rest of the environment', () => {
  const env = webBuildEnv({ PATH: 'p', HOME: 'h' }, { seed: true, identity: 'demo' });
  assert.deepEqual(env, { PATH: 'p', HOME: 'h', MM_IDENTITY: 'demo', MM_DEMO_SEED: '1' });
});

test('a normal build never carries MM_DEMO_SEED, whatever the shell had, and is the dev twin unless said', () => {
  assert.deepEqual(webBuildEnv({ PATH: 'p', MM_DEMO_SEED: '1' }, { seed: false }), { PATH: 'p', MM_IDENTITY: 'dev' });
  assert.deepEqual(webBuildEnv({ PATH: 'p', MM_IDENTITY: 'demo' }, { seed: false, identity: 'prod' }), { PATH: 'p', MM_IDENTITY: 'prod' });
});
