import assert from 'node:assert/strict';
import { test } from 'node:test';
import { choosePhone, phonesOf, xcodebuildArgs } from '../src/ios.ts';

/** MM-412: the iPhone plugged into the Mac is found, built for with signing, and chosen without a name when it is the one connected. */
const listed = JSON.stringify({
  result: {
    devices: [
      {
        identifier: '517D8538-9950-5519-A17D-E8737F5E7672',
        deviceProperties: { name: 'Jacob’s iPhone', osVersionNumber: '27.0.1' },
        hardwareProperties: { marketingName: 'iPhone 16 Pro Max', deviceType: 'iPhone', platform: 'iOS', udid: '00008140-000A085E02FA801C' },
        connectionProperties: { pairingState: 'paired' },
      },
      {
        identifier: 'AAAAAAAA-0000-1111-2222-333333333333',
        deviceProperties: { name: 'Test iPhone', osVersionNumber: '26.3' },
        hardwareProperties: { marketingName: 'iPhone 15', deviceType: 'iPhone', platform: 'iOS' },
        connectionProperties: { pairingState: 'paired', transportType: 'wired' },
      },
      {
        identifier: 'BBBBBBBB-0000-1111-2222-333333333333',
        deviceProperties: { name: 'Watch', osVersionNumber: '12.0' },
        hardwareProperties: { marketingName: 'Apple Watch', deviceType: 'appleWatch', platform: 'watchOS' },
        connectionProperties: { pairingState: 'paired', transportType: 'wired' },
      },
    ],
  },
});

test('only iPhones are listed, the connected one first, with its model and iOS', () => {
  const phones = phonesOf(listed);
  assert.deepEqual(
    phones.map((p) => [p.name, p.model, p.osVersion, p.connected]),
    [
      ['Test iPhone', 'iPhone 15', '26.3', true],
      ['Jacob’s iPhone', 'iPhone 16 Pro Max', '27.0.1', false],
    ],
  );
});

test('the connected phone is chosen unasked; a paired but absent one says to plug it in', () => {
  const phones = phonesOf(listed);
  assert.equal((choosePhone(phones, undefined) as { name: string }).name, 'Test iPhone');
  assert.match(choosePhone(phones, 'Jacob’s iPhone') as string, /paired but not connected. Plug it in/);
  assert.match(choosePhone(phones, '517D8538-9950-5519-A17D-E8737F5E7672') as string, /not connected/);
  assert.match(choosePhone(phones, 'iPhone 4') as string, /not found.*Jacob/);
  assert.match(choosePhone(phones.filter((p) => !p.connected), undefined) as string, /is paired but not connected/);
  assert.match(choosePhone([], undefined) as string, /No iPhone is paired/);
  const two = phones.map((p) => ({ ...p, connected: true }));
  assert.match(choosePhone(two, undefined) as string, /Several iPhones are connected/);
});

test('a phone build is signed, for the device, with the team from the environment when given', () => {
  const args = xcodebuildArgs({ release: false, identity: 'prod', phone: true, team: 'AB12CD34EF' });
  assert.ok(args.includes('iphoneos'));
  assert.ok(args.includes('generic/platform=iOS'));
  assert.ok(args.includes('-allowProvisioningUpdates'));
  assert.ok(args.includes('DEVELOPMENT_TEAM=AB12CD34EF'));
  assert.ok(!args.includes('CODE_SIGNING_ALLOWED=NO'));
  assert.ok(args.includes('MM_IDENTITY_SUFFIX='));
  assert.ok(args.includes('MM_DISPLAY_NAME=Martian Macros'));
  // Without a team in the environment, the project's own line is left to decide.
  assert.ok(!xcodebuildArgs({ release: false, phone: true }).some((arg) => arg.startsWith('DEVELOPMENT_TEAM=')));
  assert.ok(!xcodebuildArgs({ release: false, phone: true, team: '' }).some((arg) => arg.startsWith('DEVELOPMENT_TEAM=')));
});
