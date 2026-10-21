import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-70, MM-314, MM-513, MM-514, MM-515, MM-489: both shells write to the health platform. CI
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
  'removeWritten',
  'writeNamespace',
  'renewWriteNamespace',
  'writeNutrition',
  'removeNutrition',
  'writeWater',
  'removeWater',
  'writeWeight',
  'removeWeight',
  'readWorkouts',
  'writeWorkout',
  'removeWorkout',
];

it.each(methods)('both plugins offer %s', (method) => {
  expect(kotlin).toMatch(new RegExp(`@PluginMethod\\s+fun ${method}\\(`));
  expect(swift).toContain(`CAPPluginMethod(name: "${method}", returnType: CAPPluginReturnPromise)`);
  expect(swift).toMatch(new RegExp(`@objc func ${method}\\(`));
});

it('Android declares each write permission it asks for, and asks for one alone', () => {
  for (const permission of ['WRITE_NUTRITION', 'WRITE_HYDRATION', 'WRITE_WEIGHT', 'WRITE_EXERCISE']) {
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

it('weight is a kind of its own, written as the platform’s weight (MM-513)', () => {
  expect(kotlin).toContain('"weight" to WeightRecord::class,');
  expect(swift).toContain('case "weight": return [bodyMass]');
  expect(plist).toContain('the weight you type');
});

it('removing what was written reaches only the app’s own records, by its prefix (MM-514)', () => {
  expect(kotlin).toContain('if (!prefix.startsWith(ownPrefix))');
  expect(kotlin).toContain('dataOriginFilter = setOf(DataOrigin(context.packageName))');
  expect(kotlin).toContain('if (ours(record) && clientId.startsWith(prefix))');
  expect(swift).toContain('prefix.hasPrefix(Self.ownPrefix)');
  expect(swift).toContain('HKQuery.predicateForObjects(from: HKSource.default())');
  expect(swift).toContain('.hasPrefix(prefix) == true');
});

it('a workout deleted in the app is removed only while writing workouts is on, and only the app’s own (MM-515)', () => {
  expect(kotlin).toContain('client().deleteRecords(ExerciseSessionRecord::class, emptyList(), listOf(clientId))');
  expect(swift).toContain('HKQuery.predicateForObjects(withMetadataKey: HKMetadataKeySyncIdentifier, allowedValues: [clientId])');
});
