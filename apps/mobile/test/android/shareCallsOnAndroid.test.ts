import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-724: on Android, a chooser call carries its bytes no further than the
 * disk. Capacitor keeps the call of an activity it started in the activity's
 * saved state, options and all, twice over; Android refuses a saved state
 * near a megabyte, and the app died with `TransactionTooLargeException` as
 * the chooser put it in the background (the owner's Pixel, 2026-11-04, a
 * meal's photos). CI compiles the Kotlin but runs none of it, so this reads
 * the source: each share drops its payload from the call before the chooser
 * is started.
 */
const kotlin = readFileSync('android/app/src/main/java/com/martianmacros/MmBackupPlugin.kt', 'utf8');

const bodyOf = (method: string): string => {
  const start = kotlin.indexOf(`fun ${method}(call: PluginCall)`);
  expect(start, `Android has ${method}`).toBeGreaterThan(-1);
  const end = kotlin.indexOf('@ActivityCallback', start);
  return kotlin.slice(start, end);
};

it.each([
  ['share', 'data'],
  ['shareMeal', 'photos'],
])('%s drops its "%s" from the call before the chooser is started', (method, key) => {
  const body = bodyOf(method);
  const dropped = body.indexOf(`lightened(call, "${key}")`);
  const started = body.indexOf('startActivityForResult(call,');
  expect(dropped, `${method} drops ${key}`).toBeGreaterThan(-1);
  expect(started, `${method} starts the chooser`).toBeGreaterThan(-1);
  expect(dropped, `${method} drops ${key} before the chooser`).toBeLessThan(started);
});

it('a dropped key is removed from the call’s own data, which is what the saved state copies', () => {
  expect(kotlin).toMatch(/private fun lightened\(call: PluginCall, key: String\) \{\s*call\.data\.remove\(key\)\s*\}/);
});
