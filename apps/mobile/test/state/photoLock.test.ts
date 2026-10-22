import { expect, it } from 'vitest';
import type { DeviceLockOutcome } from '../../src/domain/integration/DeviceLockOutcome';
import { PhotoLock } from '../../src/state/PhotoLock';

/**
 * MM-157, the panel's privacy finding 5: the photos' lock, shared by every
 * screen that shows them. Asked once however often a screen mounts
 * (StrictMode mounts twice), locked again when the last screen closes and
 * when the app goes to the background, and never asked in a loop by the
 * lock's own screen putting the app in the background.
 */
class AskedLock {
  asked = 0;
  answer: DeviceLockOutcome = 'unlocked';
  private pending: ((outcome: DeviceLockOutcome) => void)[] = [];

  unlock(): Promise<DeviceLockOutcome> {
    this.asked++;
    return new Promise((resolve) => this.pending.push(resolve));
  }

  /** The person answers every asking still open. */
  answerAll(): void {
    for (const resolve of this.pending.splice(0)) resolve(this.answer);
  }
}

const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

it('a screen mounted twice in one step (StrictMode) asks once', async () => {
  const device = new AskedLock();
  const lock = new PhotoLock(device);
  const first = lock.enter();
  first();
  const second = lock.enter();
  await settled();
  expect(device.asked).toBe(1);
  device.answerAll();
  await settled();
  expect(lock.status.peek()).toBe('open');
  second();
});

it('two screens open together ask once; the photos lock again when the last closes', async () => {
  const device = new AskedLock();
  const lock = new PhotoLock(device);
  const photos = lock.enter();
  device.answerAll();
  await settled();
  const camera = lock.enter();
  expect(device.asked).toBe(1);
  camera();
  await settled();
  expect(lock.status.peek()).toBe('open');
  photos();
  await settled();
  expect(lock.status.peek()).toBe('asking');
  lock.enter();
  expect(device.asked).toBe(2);
});

it('going to the background locks the photos, and coming back asks again', async () => {
  const device = new AskedLock();
  const lock = new PhotoLock(device);
  lock.enter();
  device.answerAll();
  await settled();
  lock.away();
  expect(lock.status.peek()).toBe('asking');
  lock.back();
  expect(device.asked).toBe(2);
  device.answer = 'refused';
  device.answerAll();
  await settled();
  expect(lock.status.peek()).toBe('locked');
});

it('the lock’s own screen sending the app to the background does not ask again', async () => {
  const device = new AskedLock();
  const lock = new PhotoLock(device);
  lock.enter();
  lock.away();
  lock.back();
  expect(device.asked).toBe(1);
  device.answerAll();
  await settled();
  expect(lock.status.peek()).toBe('open');
  // And the answer, coming after the app is back, is kept.
  lock.back();
  expect(device.asked).toBe(1);
});

it('with no screen showing photos, the background changes nothing', async () => {
  const device = new AskedLock();
  const lock = new PhotoLock(device);
  lock.away();
  lock.back();
  expect(device.asked).toBe(0);
});

it('an answer to an asking that a relock overtook is not taken', async () => {
  const device = new AskedLock();
  const lock = new PhotoLock(device);
  const leave = lock.enter();
  leave();
  await settled();
  device.answerAll();
  await settled();
  expect(lock.status.peek()).toBe('asking');
});
