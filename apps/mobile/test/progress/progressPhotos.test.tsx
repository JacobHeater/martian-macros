import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

let visibility: DocumentVisibilityState = 'visible';

/** The app goes to the background, as the web view tells it. */
function goAway(): void {
  visibility = 'hidden';
  document.dispatchEvent(new Event('visibilitychange'));
}

/** The app comes back to the front. */
function comeBack(): void {
  visibility = 'visible';
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  visibility = 'visible';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
});

afterEach(() => {
  // The document's own again.
  delete (document as { visibilityState?: unknown }).visibilityState;
});

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
  // The first sets: what makes two photos comparable, folded after the very first, so the picture and the shutter come first.
  const checklist = layer().getByRole('button', { name: 'Each time, the same way' });
  expect(checklist).toHaveAttribute('aria-expanded', 'false');
  await userEvent.click(checklist);
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

it('with no camera allowed, nothing can be taken, the screen says how to allow it, and Try again opens it', async () => {
  camera.available = false;
  render();
  await openPhotos();
  await userEvent.click(await layer().findByRole('button', { name: 'Take photos' }));
  expect(await layer().findByText('The camera could not be opened')).toBeInTheDocument();
  // No shutter and no camera switch that cannot do anything.
  expect(layer().queryByRole('button', { name: 'Take front photo' })).not.toBeInTheDocument();
  expect(layer().queryByRole('button', { name: /^Use the (front|back) camera$/ })).not.toBeInTheDocument();
  camera.available = true;
  await userEvent.click(layer().getByRole('button', { name: 'Try again' }));
  expect(await layer().findByRole('button', { name: 'Take front photo' })).toBeEnabled();
});

it('a camera allowed in the phone’s settings meanwhile opens on coming back to the app', async () => {
  camera.available = false;
  render();
  await openPhotos();
  await userEvent.click(await layer().findByRole('button', { name: 'Take photos' }));
  await layer().findByText('The camera could not be opened');
  camera.available = true;
  goAway();
  comeBack();
  expect(await layer().findByRole('button', { name: 'Take front photo' })).toBeEnabled();
});

it('the very first set starts on the front camera; later ones on the back', async () => {
  render();
  await openPhotos();
  await userEvent.click(await layer().findByRole('button', { name: 'Take photos' }));
  await layer().findByRole('button', { name: 'Use the back camera' });
  await waitFor(() => expect(camera.facings).toEqual(['user']));
  // The checklist is open on the very first set.
  expect(layer().getByRole('button', { name: 'Each time, the same way' })).toHaveAttribute('aria-expanded', 'true');
  // Switching stops the one camera and starts the other: never two at once.
  await userEvent.click(layer().getByRole('button', { name: 'Use the back camera' }));
  await waitFor(() => expect(camera.facings).toEqual(['user', 'environment']));
  expect(camera.running).toBe(1);
});

it('later sets start on the back camera', async () => {
  await kept('front', today.addDays(-21));
  render();
  await openPhotos();
  await userEvent.click(await layer().findByRole('button', { name: 'Take photos' }));
  await layer().findByRole('button', { name: 'Use the front camera' });
  await waitFor(() => expect(camera.facings).toEqual(['environment']));
});

describe('the self-timer', () => {
  it('counts down aloud and can be cancelled: nothing is taken', async () => {
    render();
    await openPhotos();
    await userEvent.click(await layer().findByRole('button', { name: 'Take photos' }));
    await userEvent.click(await layer().findByRole('button', { name: '5 s timer' }));
    await userEvent.click(layer().getByRole('button', { name: 'Take front photo' }));
    expect(await layer().findByText('Photo in 5 seconds.')).toBeInTheDocument();
    expect(await layer().findByText('Photo in 4 seconds.', {}, { timeout: 3000 })).toBeInTheDocument();
    await userEvent.click(layer().getByRole('button', { name: 'Cancel timer' }));
    expect(layer().queryByText(/^Photo in /)).not.toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(await first(repos.progressPhotos.watchPhotos())).toEqual([]);
    expect(layer().getByRole('button', { name: 'Take front photo' })).toBeEnabled();
  });

  it('takes the photo when it reaches none', async () => {
    render();
    await openPhotos();
    await userEvent.click(await layer().findByRole('button', { name: 'Take photos' }));
    await userEvent.click(await layer().findByRole('button', { name: '5 s timer' }));
    await userEvent.click(layer().getByRole('button', { name: 'Take front photo' }));
    expect(await screen.findByText('Front photo kept.', {}, { timeout: 9000 })).toBeInTheDocument();
    expect((await first(repos.progressPhotos.watchPhotos())).map((p) => p.pose)).toEqual(['front']);
  }, 20000);
});

it('the camera is off once its screen is left', async () => {
  render();
  await openPhotos();
  await userEvent.click(await layer().findByRole('button', { name: 'Take photos' }));
  await layer().findByRole('button', { name: 'Take front photo' });
  await waitFor(() => expect(camera.running).toBe(1));
  // The top bar's back, the first of the screen's ways back.
  await userEvent.click(layer().getAllByRole('button', { name: 'Back' })[0] as HTMLElement);
  await waitFor(() => expect(camera.running).toBe(0));
});

it('the photos lock when the app goes to the background, and the lock is asked again on the way back', async () => {
  await kept('front', today);
  render();
  await openPhotos();
  await layer().findByRole('button', { name: 'Take photos' });
  expect(lock.asked).toBe(1);
  goAway();
  await waitFor(() => expect(layer().queryByRole('img', { name: /^Front photo/ })).not.toBeInTheDocument());
  lock.answer = 'refused';
  comeBack();
  expect(await layer().findByText('Locked')).toBeInTheDocument();
  expect(lock.asked).toBe(2);
  lock.answer = 'unlocked';
  await userEvent.click(layer().getByRole('button', { name: 'Unlock' }));
  expect(await layer().findByRole('img', { name: 'Front photo, October 19, 2026' })).toBeInTheDocument();
});

it('the camera and the comparison above the photos lock too, and ask once on the way back', async () => {
  await kept('front', today.addDays(-28));
  await kept('front', today);
  render();
  await openPhotos();
  await userEvent.click(await layer().findByRole('button', { name: 'Compare two days' }));
  await layer().findByRole('img', { name: 'Front photo, October 19, 2026' });
  expect(lock.asked).toBe(1);
  goAway();
  await waitFor(() => expect(layer().queryByRole('img', { name: /^Front photo/ })).not.toBeInTheDocument());
  comeBack();
  expect(await layer().findByRole('img', { name: 'Front photo, October 19, 2026' })).toBeInTheDocument();
  // The photos beneath and the comparison share one lock: asked once, not once a screen.
  expect(lock.asked).toBe(2);
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
  // A month to a section; each set a dated row, its delete in the row's menu.
  expect(await layer().findByRole('heading', { name: 'October 2026' })).toBeInTheDocument();
  await userEvent.click(await layer().findByRole('button', { name: 'More actions for the photos of October 19, 2026' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
  await waitFor(async () => expect(await first(repos.progressPhotos.watchPhotos())).toEqual([]));
});

it('with the weight display Everything, the trend weight is said under each compared photo', async () => {
  for (let day = -30; day <= 0; day++) await repos.weights.saveWeight(today.addDays(day), 82);
  await repos.preferences.saveWeightDisplay('everything');
  await kept('front', today.addDays(-28));
  await kept('front', today);
  render();
  await openPhotos();
  await userEvent.click(await layer().findByRole('button', { name: 'Compare two days' }));
  await layer().findByRole('img', { name: 'Front photo, October 19, 2026' });
  expect((await layer().findAllByText(/^Trend /)).length).toBeGreaterThan(0);
});

it('the days are changed by which is earlier and which later, never left and right', async () => {
  await kept('front', today.addDays(-28));
  await kept('front', today);
  render();
  await openPhotos();
  await userEvent.click(await layer().findByRole('button', { name: 'Compare two days' }));
  expect(await layer().findByRole('button', { name: 'Change earlier day' })).toBeInTheDocument();
  expect(layer().getByRole('button', { name: 'Change later day' })).toBeInTheDocument();
  expect(layer().queryByRole('button', { name: /left|right/ })).not.toBeInTheDocument();
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

  it('no weight is said under compared photos, whatever the weight display', async () => {
    for (let day = -30; day <= 0; day++) await repos.weights.saveWeight(today.addDays(day), 82);
    await repos.preferences.saveWeightDisplay('everything');
    await repos.progressPhotos.savePhotoSettings({ offered: true, backUp: false });
    await kept('front', today.addDays(-28));
    await kept('front', today);
    render();
    await openPhotos();
    await userEvent.click(await layer().findByRole('button', { name: 'Compare two days' }));
    await layer().findByRole('img', { name: 'Front photo, October 19, 2026' });
    expect(layer().queryByText(/^Trend /)).not.toBeInTheDocument();
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
