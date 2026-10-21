import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { EraserWithPhotos } from '../../src/data/EraserWithPhotos';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { PhotoPose } from '../../src/domain/photos/PhotoPose';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { FixturePhotoCamera } from '../../src/fixtures/FixturePhotoCamera';
import { InMemoryDeviceLock } from '../../src/fixtures/InMemoryDeviceLock';
import { InMemoryPrivateScreen } from '../../src/fixtures/InMemoryPrivateScreen';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { openSettings } from '../support/openSettings';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { topLayer } from '../support/topLayer';

/**
 * MM-157: progress photos that stay on the phone, behind its lock, taken the
 * same way each time and compared side by side.
 */
const today = CalendarDate.of(2026, 10, 19);
let repos: InMemoryRepositories;
let lock: InMemoryDeviceLock;
let privateScreen: InMemoryPrivateScreen;
let camera: FixturePhotoCamera;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  lock = new InMemoryDeviceLock();
  privateScreen = new InMemoryPrivateScreen();
  camera = new FixturePhotoCamera();
});

const layer = () => within(topLayer());

const kept = (pose: PhotoPose, on: CalendarDate, bytes = [0xff, 0xd8, on.day]) =>
  repos.progressPhotos.savePhoto({ date: on, pose, takenAt: new Date(2026, 9, on.day, 7), width: 1200, height: 1600, jpeg: new Uint8Array(bytes) });

function render(): void {
  renderApp(repos, today, { change: (services) => ({ ...services, deviceLock: lock, privateScreen, photoCamera: camera }) });
}

/** Opens Progress, then its photos. */
async function openPhotos(): Promise<void> {
  await openTab('Progress');
  await userEvent.click(await screen.findByRole('button', { name: /^Progress photos/ }));
}

it('Locked: the phone’s lock is asked each time the photos open, and the screen is hidden while they are', async () => {
  lock.answer = 'refused';
  render();
  await openPhotos();
  expect(await layer().findByText('Locked')).toBeInTheDocument();
  expect(layer().queryByRole('button', { name: 'Take photos' })).not.toBeInTheDocument();
  expect(lock.asked).toBe(1);
  expect(privateScreen.hidden).toBe(true);
  lock.answer = 'unlocked';
  await userEvent.click(layer().getByRole('button', { name: 'Unlock' }));
  expect(await layer().findByRole('button', { name: 'Take photos' })).toBeInTheDocument();
  await userEvent.click(layer().getByRole('button', { name: 'Back' }));
  await waitFor(() => expect(privateScreen.hidden).toBe(false));
  await userEvent.click(await screen.findByRole('button', { name: /^Progress photos/ }));
  await layer().findByRole('button', { name: 'Take photos' });
  expect(lock.asked, 'asked again on the next opening').toBe(3);
});

it('Matching the last one: the camera for a front photo shows the last front photo faintly, and a photo taken is kept', async () => {
  await kept('front', today.addDays(-21));
  render();
  await openPhotos();
  await userEvent.click(await layer().findByRole('button', { name: 'Take photos' }));
  expect(await layer().findByRole('img', { name: 'Your last front photo, faint, to line this one up with' })).toBeInTheDocument();
  // The first sets: what makes two photos comparable.
  expect(layer().getByText('The same light: no window behind you.')).toBeInTheDocument();
  await userEvent.click(layer().getByRole('button', { name: 'Take front photo' }));
  expect(await screen.findByText('Front photo kept.')).toBeInTheDocument();
  const photos = await first(repos.progressPhotos.watchPhotos());
  expect(photos.map((p) => [p.date, p.pose])).toEqual([
    [today.addDays(-21), 'front'],
    [today, 'front'],
  ]);
  // On to the side, which has no photo before it.
  expect(await layer().findByRole('button', { name: 'Take side photo' })).toBeInTheDocument();
  expect(layer().queryByRole('img', { name: /^Your last side photo/ })).not.toBeInTheDocument();
});

it('a set within a week of the last is kept, and gently noted', async () => {
  await kept('front', today.addDays(-3));
  render();
  await openPhotos();
  await userEvent.click(await layer().findByRole('button', { name: 'Take photos' }));
  await userEvent.click(await layer().findByRole('button', { name: 'Take front photo' }));
  expect(await screen.findByText(/Less than a week since the last set: every two to four weeks shows more\./)).toBeInTheDocument();
  expect(await first(repos.progressPhotos.watchPhotos())).toHaveLength(2);
});

it('with no camera allowed, nothing can be taken and the screen says how to allow it', async () => {
  camera.available = false;
  render();
  await openPhotos();
  await userEvent.click(await layer().findByRole('button', { name: 'Take photos' }));
  expect(await layer().findByText('The camera could not be opened')).toBeInTheDocument();
  expect(layer().getByRole('button', { name: 'Take front photo' })).toBeDisabled();
});

it('the camera is off once its screen is left', async () => {
  render();
  await openPhotos();
  await userEvent.click(await layer().findByRole('button', { name: 'Take photos' }));
  await layer().findByRole('button', { name: 'Take front photo' });
  await waitFor(() => expect(camera.running).toBe(1));
  await userEvent.click(layer().getByRole('button', { name: 'Back' }));
  await waitFor(() => expect(camera.running).toBe(0));
});

it('Comparing: the same pose from two days side by side, each with its day, trend weight and waist', async () => {
  await kept('front', today.addDays(-28));
  await kept('front', today);
  await kept('side', today);
  await repos.waist.saveWaist(today.addDays(-28), 90);
  render();
  await openPhotos();
  await userEvent.click(await layer().findByRole('button', { name: 'Compare two days' }));
  expect(await layer().findByRole('img', { name: 'Front photo, September 21, 2026' })).toBeInTheDocument();
  expect(layer().getByRole('img', { name: 'Front photo, October 19, 2026' })).toBeInTheDocument();
  expect(layer().getByText('September 21, 2026')).toBeInTheDocument();
  expect(layer().getByText('October 19, 2026')).toBeInTheDocument();
  expect(layer().getByText(/^Waist /)).toBeInTheDocument();
  // A pose with one day only cannot be compared.
  await userEvent.click(layer().getByRole('button', { name: 'Side' }));
  expect(await layer().findByText('Two days with a side photo are needed to compare.')).toBeInTheDocument();
});

it('a set is deleted after asking', async () => {
  await kept('front', today);
  render();
  await openPhotos();
  await userEvent.click(await layer().findByRole('button', { name: 'Delete the photos of October 19, 2026' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
  await waitFor(async () => expect(await first(repos.progressPhotos.watchPhotos())).toEqual([]));
});

describe('Eating-disorder history', () => {
  beforeEach(async () => {
    await repos.setup.saveSetup(
      typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today, screening: new ScreeningAnswers({ eatingDisorderHistory: true }) }),
    );
  });

  it('the photos are not offered anywhere until turned on in Settings', async () => {
    render();
    await openTab('Progress');
    await screen.findAllByText(/Waist/);
    expect(screen.queryByRole('button', { name: /^Progress photos/ })).not.toBeInTheDocument();
    const settings = await openSettings();
    const offered = settings.getByRole('switch', { name: /^Progress photos/ });
    expect(offered).not.toBeChecked();
    await userEvent.click(offered);
    await waitFor(async () => expect((await first(repos.progressPhotos.watchPhotoSettings())).offered).toBe(true));
  });

  it('turned on, they are offered on Progress', async () => {
    await repos.progressPhotos.savePhotoSettings({ offered: true, backUp: false });
    render();
    await openTab('Progress');
    expect(await screen.findByRole('button', { name: /^Progress photos/ })).toBeInTheDocument();
  });
});

it('Erased: erasing all data leaves no photo', async () => {
  await kept('front', today);
  await repos.progressPhotos.savePhotoSettings({ offered: true, backUp: true });
  await repos.eraser.eraseAll();
  expect(await first(repos.progressPhotos.watchPhotos())).toEqual([]);
  expect(await repos.progressPhotos.totalBytes()).toBe(0);

  // On the phone the photos are a database of their own, erased after the rest.
  const order: string[] = [];
  await new EraserWithPhotos({
    eraser: { eraseAll: async () => void order.push('records') },
    photos: { eraseAll: async () => void order.push('photos') },
  }).eraseAll();
  expect(order).toEqual(['records', 'photos']);
});

it('Never analyzed: no code of the photos sends anything anywhere or reads what a picture shows', () => {
  const files = [
    ...readdirSync('src/domain/photos').map((name) => join('src/domain/photos', name)),
    ...readdirSync('src/progress').filter((name) => /Photo/.test(name)).map((name) => join('src/progress', name)),
    'src/data/SqlProgressPhotoRepository.ts',
    'src/fixtures/InMemoryProgressPhotoRepository.ts',
    'src/platform/MediaDevicesPhotoCamera.ts',
    'src/ui/MmPhoto.tsx',
    'src/ui/MmCameraPreview.tsx',
  ];
  expect(files.length).toBeGreaterThan(10);
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    expect(text, file).not.toMatch(/\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon|JsonHttp|https?:\/\//);
    // Nothing reads a picture's pixels: it is drawn, reduced and kept, never looked into.
    expect(text, file).not.toMatch(/getImageData|readPixels|faceDetect|BarcodeDetector|ml-kit|tensorflow/i);
  }
});
