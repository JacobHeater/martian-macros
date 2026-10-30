import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adbServerWouldNotStart, connectedDeviceIds, lastLineOf } from '../src/android.ts';

/**
 * MM-696: a failing `adb devices` is not "no phone connected". The runner
 * tells adb's server-start failure apart from an empty list, so it can
 * try the libusb backend and, failing that, show adb's own words.
 */
test("adb's server-start failures are recognised in its own words", () => {
  assert.equal(adbServerWouldNotStart('* daemon not running; starting now at tcp:5037\nADB server didn\'t ACK\n* failed to start daemon\nadb: failed to check server version: cannot connect to daemon\n'), true);
  assert.equal(adbServerWouldNotStart('adb: failed to check server version: protocol fault (couldn\'t read status): Connection reset by peer\n'), true);
  assert.equal(adbServerWouldNotStart(''), false);
  assert.equal(adbServerWouldNotStart('adb: device unauthorized.\n'), false);
});

test('only devices listed as device are connected', () => {
  const listed = 'List of devices attached\n47261FDAS00EDR\tdevice\nemulator-5554\toffline\nABC123\tunauthorized\n\n';
  assert.deepEqual(connectedDeviceIds(listed), ['47261FDAS00EDR']);
  assert.deepEqual(connectedDeviceIds('List of devices attached\n\n'), []);
});

test('the last line of output is what is shown', () => {
  assert.equal(lastLineOf('first\nsecond\n\n'), 'second');
  assert.equal(lastLineOf('\n  \n'), undefined);
});
