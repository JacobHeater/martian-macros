import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-728: the Health Connect plugin never throws through the bridge, which
 * would end the app: each question it starts is wrapped and refused in
 * words when Health Connect is gone; the one history ask is marked asked
 * only once its question is on its way; and a sleep session whose stages
 * are all awake is no sleep, as on iOS. Read from the source.
 */
const kotlin = readFileSync('android/app/src/main/java/com/martianmacros/MmHealthPlugin.kt', 'utf8');

const bodyOf = (method: string): string => {
  const start = kotlin.indexOf(`fun ${method}(call: PluginCall)`);
  expect(start, `Android has ${method}`).toBeGreaterThan(-1);
  return kotlin.slice(start, kotlin.indexOf('@ActivityCallback', start));
};

it.each(['requestPermission', 'requestHistory', 'startWriting'])('%s refuses in words instead of throwing', (method) => {
  const body = bodyOf(method);
  const started = body.indexOf('startActivityForResult(');
  const guarded = body.lastIndexOf('try {', started);
  expect(guarded, `${method} starts its question inside a try`).toBeGreaterThan(-1);
  expect(body.slice(started)).toContain('catch (error: Throwable)');
  expect(body.slice(started)).toContain('call.reject(error.message ?: error.toString())');
});

it('the history ask is spent only once its question is on its way', () => {
  const body = bodyOf('requestHistory');
  expect(body.indexOf('startActivityForResult(')).toBeLessThan(body.indexOf('putBoolean(historyAskedKey, true)'));
});

it('a kind named by something other than a string is skipped, not thrown on', () => {
  expect(kotlin).toContain('asked.optString(it)');
  expect(kotlin).not.toContain('asked.getString(it)');
});

it('a sleep session with stages that are all awake is no sleep, as on iOS', () => {
  const start = kotlin.indexOf('private fun minutesAsleep(');
  const body = kotlin.slice(start, kotlin.indexOf('return millis / 60000.0', start));
  expect(body).toContain('if (record.stages.isEmpty())');
  expect(body).not.toContain('if (asleep.isEmpty())');
});
