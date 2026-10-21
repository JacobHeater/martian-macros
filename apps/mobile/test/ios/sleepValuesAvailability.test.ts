import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-440: the app supports iOS 15, and the staged sleep cases exist only
 * from iOS 16. CI builds no iOS, so this reads the Swift source: in
 * `asleepValues`, no iOS 16 case is named before its `#available` check.
 */
it('names no iOS 16 sleep case outside its availability check', () => {
  const swift = readFileSync('ios/App/App/Plugins/MmHealthPlugin.swift', 'utf8');
  const start = swift.indexOf('static var asleepValues');
  expect(start, 'asleepValues is in the plugin').toBeGreaterThan(-1);
  const guarded = swift.indexOf('#available(iOS 16.0, *)', start);
  expect(guarded, 'asleepValues checks for iOS 16').toBeGreaterThan(start);
  expect(swift.slice(start, guarded)).not.toMatch(/\.asleep(?:Unspecified|Core|Deep|REM)\b/);
});
