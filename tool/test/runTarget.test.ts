import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runTargetOf } from '../src/android.ts';

/**
 * MM-695: `mm run --phone` means the one physical Android phone, as
 * `--env phone` does (MM-234), and nothing `mm run` is given goes
 * unaccounted for: before, `--phone` was ignored and the run went to
 * whatever adb listed, or to an emulator it started.
 */
test('--phone and --env phone are the one physical phone', () => {
  assert.deepEqual(runTargetOf(['--phone']), { kind: 'phone' });
  assert.deepEqual(runTargetOf(['--env', 'phone']), { kind: 'phone' });
  assert.deepEqual(runTargetOf(['--live', '--phone', '--port', '5174']), { kind: 'phone' });
  assert.deepEqual(runTargetOf(['--phone', '--prod']), { kind: 'phone' });
});

test('an exact device is -d, --device-id or --phone with an ID', () => {
  assert.deepEqual(runTargetOf(['-d', '47261FDAS00EDR']), { kind: 'device', id: '47261FDAS00EDR' });
  assert.deepEqual(runTargetOf(['--device-id', 'emulator-5554']), { kind: 'device', id: 'emulator-5554' });
  assert.deepEqual(runTargetOf(['--phone', '47261FDAS00EDR']), { kind: 'device', id: '47261FDAS00EDR' });
  assert.match(runTargetOf(['-d']) as string, /-d needs a device ID/);
  assert.match(runTargetOf(['-d', '--prod']) as string, /-d needs a device ID/);
});

test('nothing said is whatever is connected', () => {
  assert.deepEqual(runTargetOf([]), { kind: 'connected' });
  assert.deepEqual(runTargetOf(['--prod']), { kind: 'connected' });
  assert.deepEqual(runTargetOf(['--env', 'dev', '--live']), { kind: 'connected' });
});

test('an unknown argument refuses instead of running somewhere else', () => {
  assert.match(runTargetOf(['--phonee']) as string, /Unknown argument "--phonee"/);
  assert.match(runTargetOf(['--ios-phone']) as string, /Usage: mm run/);
  assert.match(runTargetOf(['pixel']) as string, /Unknown argument "pixel"/);
});

test('--env phone and an explicit device cannot be mixed, as MM-234 ruled', () => {
  assert.match(runTargetOf(['--env', 'phone', '-d', 'x']) as string, /-d DEVICE_ID.*--phone/);
  assert.equal(runTargetOf(['--env', 'demo']), '--env must be one of: dev, prod, phone');
  assert.equal(runTargetOf(['--env']), '--env needs a value: prod, dev or phone.');
  assert.equal(runTargetOf(['--env', '--live']), '--env needs a value: prod, dev or phone.');
});
