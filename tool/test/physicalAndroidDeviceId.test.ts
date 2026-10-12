import assert from 'node:assert/strict';
import { test } from 'node:test';
import { physicalAndroidDeviceId } from '../src/android.ts';

/**
 * MM-234: `mm run --env phone` selects the one physical Android phone,
 * never an emulator, as the Dart runner did. Ported from
 * `physical_android_device_id_test.dart`.
 */
test('one phone is picked, with or without an emulator beside it', () => {
  assert.equal(physicalAndroidDeviceId(['47261FDAS00EDR']), '47261FDAS00EDR');
  assert.equal(physicalAndroidDeviceId(['emulator-5554', '47261FDAS00EDR']), '47261FDAS00EDR');
  assert.equal(physicalAndroidDeviceId(['47261FDAS00EDR', 'emulator-5554', 'emulator-5556']), '47261FDAS00EDR');
});

test('an emulator alone is not a phone', () => {
  assert.throws(
    () => physicalAndroidDeviceId(['emulator-5554']),
    (error: unknown) => error instanceof Error && /No Android phone connected/.test(error.message) && /USB debugging/.test(error.message),
  );
});

test('no device at all says how to connect one', () => {
  assert.throws(
    () => physicalAndroidDeviceId([]),
    (error: unknown) => error instanceof Error && /No Android phone connected/.test(error.message),
  );
});

test('two phones must be chosen between explicitly', () => {
  assert.throws(
    () => physicalAndroidDeviceId(['one', 'two']),
    (error: unknown) =>
      error instanceof Error && /Multiple Android phones connected: one, two/.test(error.message) && /-d DEVICE_ID/.test(error.message),
  );
});
