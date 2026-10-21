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
  expect([...profile.matchAll(/answer\["sex"\] = "(\w+)"/g)].map((m) => m[1])).toEqual(['female', 'male', 'other']);
  expect(profile).not.toContain('notSet');
});

it('answers the date of birth as its parts and the height in metres', () => {
  for (const key of ['birthYear', 'birthMonth', 'birthDay']) expect(profile).toContain(`answer["${key}"]`);
  expect(profile).toContain('answer["heightM"] = height.quantity.doubleValue(for: .meter())');
});
