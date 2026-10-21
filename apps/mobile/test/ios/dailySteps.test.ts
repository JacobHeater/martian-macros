import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-442: a day's steps come from Apple Health's own statistics. CI builds
 * no iOS, so this reads the Swift source: the method is registered with the
 * bridge as every other one is, and it asks HealthKit for a cumulative sum
 * by day with a query that iOS 15 has (the async query descriptors are
 * from iOS 15.4), never by adding up step samples itself.
 */
const swift = readFileSync('ios/App/App/Plugins/MmHealthPlugin.swift', 'utf8');

it('registers every method the plugin has, dailySteps among them', () => {
  const methods = [...swift.matchAll(/@objc func (\w+)\(_ call: CAPPluginCall\)/g)].map((m) => m[1]).sort();
  const registered = [...swift.matchAll(/CAPPluginMethod\(name: "(\w+)"/g)].map((m) => m[1]).sort();
  expect(methods).toContain('dailySteps');
  expect(registered).toEqual(methods);
});

it("reads a day's steps as HealthKit's cumulative sum by day, with a query iOS 15 has", () => {
  const start = swift.indexOf('@objc func dailySteps');
  expect(start, 'dailySteps is in the plugin').toBeGreaterThan(-1);
  const end = swift.indexOf('@objc func', start + 1);
  const body = swift.slice(start, end === -1 ? undefined : end);
  expect(body).toContain('HKStatisticsCollectionQuery(');
  expect(body).toContain('.cumulativeSum');
  expect(body).toContain('DateComponents(day: 1)');
  expect(body).not.toMatch(/QueryDescriptor|HKSampleQuery\(/);
});
