import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryPackHttp } from '../../src/foodCatalog/download/InMemoryPackHttp';
import type { InMemoryPackStore } from '../../src/foodCatalog/download/InMemoryPackStore';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { fixtureDownload, memoryPackStore, packUrl, sha256Hex } from '../support/fixtureDownload';
import { openSettings } from '../support/openSettings';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { topLayer } from '../support/topLayer';

/**
 * MM-56: the food database screen and the download strip. The network is a
 * fake; the download is the real one, over a file of the size the host
 * serves. Carried over from food_database_test.dart.
 */
const today = CalendarDate.of(2026, 10, 9);
const manifestUrl = 'https://packs.example.test/manifest.json';
const megabyte = 1000000;
/** A file as large as the pack the host serves. It is no pack, so it never installs. */
const file = new Uint8Array(46 * megabyte);
let fileSha: string;
let repos: InMemoryRepositories;
let http: InMemoryPackHttp;
let store: InMemoryPackStore;

const manifest = (sha: string, bytes = file.length) =>
  new TextEncoder().encode(
    '{"packs":[{"id":"barcode_us","title":"Barcode foods, United States","version":"2026-10-09",' +
      `"formatVersion":1,"url":"${packUrl}","bytes":${bytes},"sha256":"${sha}"}]}`,
  );

beforeEach(async () => {
  fileSha ??= await sha256Hex(file);
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }));
  http = new InMemoryPackHttp(
    [
      [manifestUrl, manifest(fileSha)],
      [packUrl, file],
    ],
    { chunkSize: megabyte },
  );
  store = memoryPackStore();
});

function open(url = '') {
  return renderApp(repos, today, {
    change: (services) => ({ ...services, packHttp: http, packStore: store, packManifestUrl: url }),
  });
}

async function openScreen(url = '') {
  open(url);
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('button', { name: /^Food database/ }));
  await within(topLayer()).findByRole('heading', { name: 'Food database' });
  return within(topLayer());
}

/** The screen with the list read and the download started, stalled once `megabytes` have arrived. */
async function downloadingTo(megabytes: number) {
  const packs = await openScreen(manifestUrl);
  await userEvent.click(packs.getByRole('button', { name: 'See what is available' }));
  const download = await packs.findByRole('button', { name: 'Download' });
  // Applies to the next answer, which is now the file and not the list.
  http.stallAfterBytes = megabytes * megabyte;
  await userEvent.click(download);
  await packs.findByText(`${megabytes} MB of 46 MB`);
  return packs;
}

it('a build with no download address says so and fetches nothing', async () => {
  const packs = await openScreen();
  expect(packs.getByText(/not set up in this version/)).toBeInTheDocument();
  expect(packs.queryByRole('button', { name: 'See what is available' })).not.toBeInTheDocument();
  expect(packs.getByText('Nothing downloaded yet')).toBeInTheDocument();
  expect(http.requests).toEqual([]);
});

it('the sources are credited on the screen', async () => {
  const packs = await openScreen();
  expect(packs.getByText(/Open Food Facts/)).toHaveTextContent('Open Database License');
  expect(packs.getByText(/USDA FoodData Central/)).toBeInTheDocument();
});

it('opening the screen fetches nothing; the list is read when asked, and the download waits for its own button', async () => {
  http.files.set(manifestUrl, manifest('b'.repeat(64), 46739747));
  const packs = await openScreen(manifestUrl);
  // Opening is not a request.
  expect(http.requests).toEqual([]);
  expect(packs.getByText(/packs\.example\.test once/)).toHaveTextContent('IP address and nothing else');

  await userEvent.click(packs.getByRole('button', { name: 'See what is available' }));
  expect(await packs.findByRole('heading', { name: 'Barcode foods, United States' })).toBeInTheDocument();
  expect(http.requests.map((request) => request.url)).toEqual([manifestUrl]);
  expect(packs.getByText(/47 MB to download/)).toBeInTheDocument();
  expect(packs.getByText(/tells the host your IP address/)).toHaveTextContent('cancel at any time');

  // Nothing starts by itself.
  http.stallAfterBytes = megabyte;
  await userEvent.click(packs.getByRole('button', { name: 'Download' }));
  await expect.poll(() => http.requests.map((request) => request.url)).toEqual([manifestUrl, packUrl]);
});

it('an unreachable host is reported and says nothing changed', async () => {
  http.files.delete(manifestUrl);
  const packs = await openScreen(manifestUrl);
  await userEvent.click(packs.getByRole('button', { name: 'See what is available' }));
  expect(await packs.findByText(/Nothing was changed/)).toBeInTheDocument();
  expect(packs.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
});

it('a running download shows how far along it is, and Cancel works', async () => {
  const packs = await downloadingTo(12);
  expect(packs.getByRole('heading', { name: 'Downloading' })).toBeInTheDocument();
  await userEvent.click(packs.getByRole('button', { name: 'Cancel' }));
  expect(await packs.findByRole('heading', { name: 'Paused' })).toBeInTheDocument();
});

it('a paused download can be resumed or discarded', async () => {
  const packs = await downloadingTo(20);
  await userEvent.click(packs.getByRole('button', { name: 'Cancel' }));
  expect(await packs.findByText(/20 MB of 46 MB is kept/)).toBeInTheDocument();

  http.stallAfterBytes = 3 * megabyte;
  await userEvent.click(packs.getByRole('button', { name: 'Resume' }));
  expect(await packs.findByText('23 MB of 46 MB')).toBeInTheDocument();
  // It asked for the rest, from where it stopped.
  expect(http.requests[http.requests.length - 1]?.rangeStart).toBe(20 * megabyte);

  await userEvent.click(packs.getByRole('button', { name: 'Cancel' }));
  await userEvent.click(await packs.findByRole('button', { name: 'Discard' }));
  await expect.poll(() => store.partialBytes('barcode_us', '2026-10-09')).toBe(0);
  expect(await packs.findByRole('button', { name: 'Download' })).toBeInTheDocument();
});

it('a failure says what happened to the old pack', async () => {
  http.files.set(manifestUrl, manifest('c'.repeat(64)));
  const packs = await openScreen(manifestUrl);
  await userEvent.click(packs.getByRole('button', { name: 'See what is available' }));
  await userEvent.click(await packs.findByRole('button', { name: 'Download' }));
  expect(await packs.findByText(/thrown away/, undefined, { timeout: 10000 })).toHaveTextContent(
    'Nothing on your phone changed',
  );
  expect(packs.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
});

it('while a download runs, every screen shows a strip with Cancel', async () => {
  const packs = await downloadingTo(23);
  const strip = () => document.querySelector<HTMLElement>('.mm-download-strip [role="status"]');
  expect(strip()).toHaveTextContent('Downloading Barcode foods, United States, 50 percent');

  // Back out to the Dashboard, with the download going on underneath it.
  await userEvent.click(packs.getByRole('button', { name: 'Back' }));
  await userEvent.click(within(topLayer()).getByRole('button', { name: 'Back' }));
  await screen.findByRole('navigation', { name: 'Destinations' });
  expect(strip()).toHaveTextContent('Downloading Barcode foods, United States');
  await openTab('Food');
  // The strip stays on the next screen.
  expect(strip()).toHaveTextContent('Downloading Barcode foods, United States');

  await userEvent.click(within(strip()?.closest('.mm-download-strip') as HTMLElement).getByRole('button', { name: 'Cancel' }));
  await expect.poll(strip).toBeNull();
  expect(await store.partialBytes('barcode_us', '2026-10-09')).toBe(23 * megabyte);
});

it('no strip when nothing is downloading', async () => {
  open();
  await screen.findByRole('navigation', { name: 'Destinations' });
  expect(screen.queryByText(/Downloading/)).not.toBeInTheDocument();
});

it('a downloaded pack is listed, searched, and can be removed', async () => {
  const d = await fixtureDownload();
  http = new InMemoryPackHttp([[packUrl, d.gz]]);
  http.files.set(manifestUrl, manifest(d.listing.sha256, d.gz.length));
  open(manifestUrl);
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('button', { name: /^Food database/ }));
  const packs = within(topLayer());
  await userEvent.click(await packs.findByRole('button', { name: 'See what is available' }));
  await userEvent.click(await packs.findByRole('button', { name: 'Download' }));
  expect(await packs.findByText('Barcode foods, United States is on your phone.')).toBeInTheDocument();
  expect(await packs.findByText(/^Version 2026-10-09 · /)).toBeInTheDocument();
  expect(await packs.findByRole('button', { name: 'Up to date' })).toBeDisabled();

  await userEvent.click(packs.getByRole('button', { name: 'Remove' }));
  const sure = await screen.findByRole('dialog', { name: 'Remove this food database?' });
  await userEvent.click(within(sure).getByRole('button', { name: 'Remove' }));
  expect(await packs.findByText('Nothing downloaded yet')).toBeInTheDocument();
  expect(await store.installed()).toEqual([]);
});
