import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-69: onboarding filled in from Apple Health. CI builds no iOS app, so
 * this reads the Swift source: the plugin offers `profile`, asks to read
 * sex, date of birth and height and to share nothing, and answers sex in
 * the words the adapter reads.
 */
const swift = readFileSync('ios/App/App/Plugins/MmHealthPlugin.swift', 'utf8');
const profile = swift.slice(swift.indexOf('@objc func profile('));

it('offers profile', () => {
  expect(swift).toContain('CAPPluginMethod(name: "profile", returnType: CAPPluginReturnPromise)');
  expect(profile.length).toBeGreaterThan(0);
});

it('asks to read sex, date of birth and height, and to share nothing', () => {
  expect(profile).toContain('characteristicType(forIdentifier: .biologicalSex)');
  expect(profile).toContain('characteristicType(forIdentifier: .dateOfBirth)');
  expect(profile).toContain('HKQuantityType(.height)');
  expect(profile).toContain('store.requestAuthorization(toShare: nil, read: wanted)');
});

it('answers sex as female, male or other, and leaves not set out', () => {
  expect([...profile.matchAll(/found\["sex"\] = "(\w+)"/g)].map((m) => m[1])).toEqual(['female', 'male', 'other']);
  expect(profile).not.toContain('notSet');
});

it('answers the date of birth as its parts and the height in metres', () => {
  for (const key of ['birthYear', 'birthMonth', 'birthDay']) expect(profile).toContain(`found["${key}"]`);
  expect(profile).toContain('answer["heightM"] = height.quantity.doubleValue(for: .meter())');
});

it('no HealthKit handler adds to a var it captured: each takes its own copy (the panel review of MM-69)', () => {
  expect(profile).toContain('let known = found');
  expect(profile).toContain('var answer = known');
  const changes = swift.slice(swift.indexOf('@objc func changes('), swift.indexOf('// MARK: Writing'));
  expect(changes).not.toMatch(/\bvar (upserted|deleted|failure|next)\b/);
  const removeOwn = swift.slice(swift.indexOf('private func removeOwn('));
  expect(removeOwn.slice(0, removeOwn.indexOf('\n    }\n'))).toContain('let failed = FirstFailure()');
});

it('reads changes in the one kind asked for, never every kind with one anchor (MM-551)', () => {
  const changes = swift.slice(swift.indexOf('@objc func changes('), swift.indexOf('// MARK: Writing'));
  expect(changes).toContain('guard let name = call.getString("type")');
  expect(changes).toContain('HKAnchoredObjectQuery(type: type, predicate: nil, anchor: anchor');
  expect(changes).not.toContain('for (name, type) in Self.types');
  expect(swift).not.toContain('ChangesGathered');
});
