import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-690: which kinds Apple Health has been asked to read is HealthKit's
 * own record (`getRequestStatusForAuthorization`), never a memory the
 * plugin keeps in the app's preferences: the owner's phone held "workout"
 * in that memory while HealthKit had never been asked, so no workout was
 * ever read. CI builds no iOS, so this reads the Swift source.
 */
it('answers permitted from HealthKit’s record of what was asked, not a memory of its own', () => {
  const swift = readFileSync('ios/App/App/Plugins/MmHealthPlugin.swift', 'utf8');
  const asked = swift.indexOf('private func askedToRead(');
  expect(asked, 'askedToRead is in the plugin').toBeGreaterThan(-1);
  expect(swift.indexOf('getRequestStatusForAuthorization(toShare: [], read: [type])', asked), 'it asks HealthKit per kind').toBeGreaterThan(asked);
  expect(swift.indexOf('status == .unnecessary', asked), 'a kind a request is no longer needed for was asked').toBeGreaterThan(asked);
  for (const method of ['func permitted(', 'func requestPermission(']) {
    const start = swift.indexOf(method);
    expect(start, `${method} is in the plugin`).toBeGreaterThan(-1);
    const end = swift.indexOf('\n    }\n', start);
    expect(swift.slice(start, end), `${method} answers through askedToRead`).toContain('askedToRead(');
  }
  expect(swift, 'no memory of what was asked lives in the app’s preferences').not.toMatch(/mm_health_asked|askedKey/);
});
