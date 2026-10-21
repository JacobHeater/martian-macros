import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-70, MM-314, MM-489: both shells write to the health platform. CI
 * builds no iOS app, so this reads the plugins' source: each offers every
 * writing method the adapters call, asks for a write permission apart from
 * reading, declares what it writes, and never reads its own records back
 * as readings.
 */
const kotlin = readFileSync('android/app/src/main/java/com/martianmacros/MmHealthPlugin.kt', 'utf8');
const swift = readFileSync('ios/App/App/Plugins/MmHealthPlugin.swift', 'utf8');
const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
const plist = readFileSync('ios/App/App/Info.plist', 'utf8');

const methods = [
  'writing',
  'startWriting',
  'stopWriting',
  'writeNamespace',
  'renewWriteNamespace',
  'writeNutrition',
  'removeNutrition',
  'writeWater',
  'removeWater',
  'readWorkouts',
  'writeWorkout',
];

it.each(methods)('both plugins offer %s', (method) => {
  expect(kotlin).toMatch(new RegExp(`@PluginMethod\\s+fun ${method}\\(`));
  expect(swift).toContain(`CAPPluginMethod(name: "${method}", returnType: CAPPluginReturnPromise)`);
  expect(swift).toMatch(new RegExp(`@objc func ${method}\\(`));
});

it('Android declares each write permission it asks for, and asks for one alone', () => {
  for (const permission of ['WRITE_NUTRITION', 'WRITE_HYDRATION', 'WRITE_EXERCISE']) {
    expect(manifest).toContain(`<uses-permission android:name="android.permission.health.${permission}" />`);
  }
  expect(kotlin).toContain('contract.createIntent(context, setOf(HealthPermission.getWritePermission(type)))');
});

it('the iPhone says why it writes, and asks to share without asking to read', () => {
  expect(plist).toContain('<key>NSHealthUpdateUsageDescription</key>');
  expect(swift).toContain('store.requestAuthorization(toShare: Set(types), read: nil)');
  // The reading question still shares nothing.
  expect(swift).toContain('store.requestAuthorization(toShare: nil, read: wanted)');
});

it('what the app wrote is never read back as a reading', () => {
  expect(kotlin).toContain('if (!ours(record)) records.put(raw(name, record))');
  expect(kotlin).toContain('is UpsertionChange -> if (!ours(change.record))');
  expect(swift).toContain('if sample.sourceRevision.source == HKSource.default() { return nil }');
});

it('a record is written under the app’s id for it, so writing again replaces it', () => {
  expect(kotlin).toContain('Metadata.manualEntry(clientId, System.currentTimeMillis())');
  expect(swift).toContain('HKMetadataKeySyncIdentifier: clientId');
  expect(swift).toContain('HKMetadataKeySyncVersion');
});
