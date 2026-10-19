import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chooseSimulator, isSimulatorId, simulatorsOf, xcodebuildArgs } from '../src/ios.ts';

/** MM-403: the iOS shell is built, installed and launched through `mm`, as the Android one is. */
const listed = JSON.stringify({
  devices: {
    'com.apple.CoreSimulator.SimRuntime.iOS-26-3': [
      { udid: 'D10767A6-3822-4ECA-A8FA-0937E6656F96', name: 'iPhone 17 Pro Max', state: 'Shutdown', isAvailable: true },
      { udid: 'F8432DF9-20C7-4C91-9F22-29DB0D110B10', name: 'iPhone 16e', state: 'Booted', isAvailable: true },
      { udid: '11111111-2222-3333-4444-555555555555', name: 'iPad Air', state: 'Shutdown', isAvailable: true },
    ],
    'com.apple.CoreSimulator.SimRuntime.iOS-15-2': [
      { udid: '22222222-2222-3333-4444-555555555555', name: 'iPhone 13', state: 'Shutdown', isAvailable: false },
    ],
    'com.apple.CoreSimulator.SimRuntime.iOS-18-0': [
      { udid: '33333333-2222-3333-4444-555555555555', name: 'iPhone 16', state: 'Shutdown', isAvailable: true },
    ],
    'com.apple.CoreSimulator.SimRuntime.watchOS-26-2': [{ udid: '44444444-2222-3333-4444-555555555555', name: 'Apple Watch', state: 'Shutdown' }],
  },
});

test('a simulator is told from an Android device by its UDID', () => {
  assert.equal(isSimulatorId('D10767A6-3822-4ECA-A8FA-0937E6656F96'), true);
  assert.equal(isSimulatorId('emulator-5554'), false);
  assert.equal(isSimulatorId('47261FDAS00EDR'), false);
});

test('only iPhones that can run are listed, the newest iOS first', () => {
  const simulators = simulatorsOf(listed);
  assert.deepEqual(
    simulators.map((s) => [s.name, s.runtime, s.state]),
    [
      ['iPhone 17 Pro Max', '26.3', 'Shutdown'],
      ['iPhone 16e', '26.3', 'Booted'],
      ['iPhone 16', '18.0', 'Shutdown'],
    ],
  );
});

test('the booted simulator is chosen, else the first, else the one asked for by name or UDID', () => {
  const simulators = simulatorsOf(listed);
  assert.equal((chooseSimulator(simulators, undefined) as { name: string }).name, 'iPhone 16e');
  assert.equal((chooseSimulator(simulators.filter((s) => s.state !== 'Booted'), undefined) as { name: string }).name, 'iPhone 17 Pro Max');
  assert.equal((chooseSimulator(simulators, 'iPhone 16') as { runtime: string }).runtime, '18.0');
  assert.equal((chooseSimulator(simulators, 'D10767A6-3822-4ECA-A8FA-0937E6656F96') as { name: string }).name, 'iPhone 17 Pro Max');
});

test('nothing to choose says how to get a simulator, and a wrong name lists what there is', () => {
  assert.match(chooseSimulator([], undefined) as string, /No iPhone simulator is installed/);
  assert.match(chooseSimulator(simulatorsOf(listed), 'iPhone 4') as string, /not found.*iPhone 17 Pro Max/);
});

test('a simulator build needs no signing team', () => {
  const args = xcodebuildArgs({ release: false });
  assert.ok(args.includes('CODE_SIGNING_ALLOWED=NO'));
  assert.ok(args.includes('iphonesimulator'));
  assert.equal(args[args.indexOf('-configuration') + 1], 'Debug');
  assert.equal(xcodebuildArgs({ release: true })[xcodebuildArgs({ release: true }).indexOf('-configuration') + 1], 'Release');
});
