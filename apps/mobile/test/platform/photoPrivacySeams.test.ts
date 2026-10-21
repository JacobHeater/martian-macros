import { afterEach, expect, it, vi } from 'vitest';
import { MediaDevicesPhotoCamera } from '../../src/platform/MediaDevicesPhotoCamera';
import type { MmPrivacyApi } from '../../src/platform/MmPrivacyApi';
import { NativeDeviceLock } from '../../src/platform/NativeDeviceLock';
import { NativePrivateScreen } from '../../src/platform/NativePrivateScreen';
import { NoDeviceLock } from '../../src/platform/NoDeviceLock';
import { NoPrivateScreen } from '../../src/platform/NoPrivateScreen';
import { deviceLockContract } from '../contracts/deviceLockContract';
import { photoCameraContract } from '../contracts/photoCameraContract';
import { privateScreenContract } from '../contracts/privateScreenContract';

/**
 * MM-157 (the panel's architecture finding): the phone's adapters for the
 * photos' lock, private screen and camera, with the bridge or the web
 * view's camera stood in for, and the browser's, held to the contracts the
 * fixtures are held to (test/fixtures/seamFixtures.test.ts).
 */

/** `MmBackupPlugin`'s privacy half stood in for: answers `outcome` (or throws), and keeps the last protection asked. */
const plugin = (outcome: 'unlocked' | 'refused' | 'noLock' | 'throws' = 'unlocked') => {
  let protectedNow = false;
  const api: MmPrivacyApi = {
    unlock: async () => {
      if (outcome === 'throws') throw new Error('The plugin is not there.');
      return { outcome };
    },
    protectScreen: async ({ on }) => {
      protectedNow = on;
    },
  };
  return { api, protectedNow: () => protectedNow };
};

for (const outcome of ['unlocked', 'refused', 'noLock'] as const) {
  deviceLockContract(`Native, ${outcome} (bridge stood in for)`, () => new NativeDeviceLock(plugin(outcome).api), outcome);
}
// A plugin that fails keeps the photos shut.
deviceLockContract('Native, failing (bridge stood in for)', () => new NativeDeviceLock(plugin('throws').api), 'refused');
deviceLockContract('No lock (a browser)', () => new NoDeviceLock(), 'noLock');

privateScreenContract('Native (bridge stood in for)', () => {
  const bridge = plugin();
  return {
    screen: new NativePrivateScreen(bridge.api),
    // The plugin is told asynchronously; what it was told last is what holds.
    hidden: async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      return bridge.protectedNow();
    },
  };
});
privateScreenContract('Nothing to hide from (a browser)', () => ({ screen: new NoPrivateScreen(), hidden: undefined }));

/** A camera stream stood in for: its tracks, and whether each was stopped. */
const stream = () => {
  const tracks = [{ stopped: false, stop() { this.stopped = true; } }];
  return { getTracks: () => tracks, tracks } as unknown as MediaStream & { tracks: typeof tracks };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

const camera = (getUserMedia: (() => Promise<MediaStream>) | undefined) => {
  vi.stubGlobal('navigator', { mediaDevices: getUserMedia === undefined ? {} : { getUserMedia } });
  return new MediaDevicesPhotoCamera();
};

photoCameraContract('The web view’s camera, allowed (media devices stood in for)', () => camera(async () => stream()), {
  available: true,
  captures: false,
});
photoCameraContract(
  'The web view’s camera, not allowed (media devices stood in for)',
  () =>
    camera(async () => {
      throw new DOMException('Permission denied', 'NotAllowedError');
    }),
  { available: false, captures: false },
);
photoCameraContract('No camera (media devices absent)', () => camera(undefined), { available: false, captures: false });

it('the web view’s camera, stopped, stops every track of its stream', async () => {
  const given = stream();
  const preview = await camera(async () => given).start('user');
  preview?.stop();
  expect(given.tracks.every((track) => track.stopped)).toBe(true);
});
