import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { BackupFile } from '../../src/backup/BackupFile';
import { FakeBackupPlatform } from '../../src/backup/FakeBackupPlatform';
import { SodiumBackupCipher } from '../../src/backup/SodiumBackupCipher';
import { currentSchemaVersion } from '../../src/data/currentSchemaVersion';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { decodePhotoArchive } from '../../src/domain/photos/decodePhotoArchive';
import { encodePhotoArchive } from '../../src/domain/photos/encodePhotoArchive';
import { FakeDataRestorer } from '../../src/fixtures/FakeDataRestorer';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { openSettings } from '../support/openSettings';
import { renderApp } from '../support/renderApp';

/**
 * MM-157 with MM-63: the progress photos join the app's own encrypted backup
 * only when Back up photos is on, with what that adds to its size; a backup
 * that carries them brings them back, one without leaves the phone's as
 * they are.
 */
const slowly = { timeout: 15000 };
const today = CalendarDate.of(2026, 10, 19);
const cipher = new SodiumBackupCipher();
let repos: InMemoryRepositories;
let backup: FakeBackupPlatform;
let restorer: FakeDataRestorer;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.progressPhotos.savePhoto({
    date: today,
    pose: 'front',
    takenAt: new Date(2026, 9, 19, 7),
    width: 1200,
    height: 1600,
    jpeg: new Uint8Array(2_400_000).fill(7),
  });
  backup = new FakeBackupPlatform(async () => new TextEncoder().encode('SQLite format 3\0 the records'));
  restorer = new FakeDataRestorer();
  restorer.toDescribe = { weighIns: 0, foodDays: 0, workouts: 0, customFoods: 0, from: undefined, to: undefined, hasSetup: true };
  restorer.here = restorer.toDescribe;
});

const render = () => renderApp(repos, today, { change: (services) => ({ ...services, backup, restorer }) });

async function backUp(settings: Awaited<ReturnType<typeof openSettings>>): Promise<Uint8Array> {
  await userEvent.click(settings.getByRole('button', { name: /^Back up now/ }));
  const sheet = within(await screen.findByRole('dialog', { name: 'A passphrase for this backup' }, slowly));
  await userEvent.type(await sheet.findByLabelText('Passphrase', {}, slowly), 'correct horse battery');
  await userEvent.type(sheet.getByLabelText('Passphrase again'), 'correct horse battery');
  await userEvent.click(sheet.getByRole('button', { name: 'Back up' }));
  await waitFor(() => expect(backup.saved.length).toBeGreaterThan(0), slowly);
  return backup.saved.at(-1)!.file;
}

it('Backup: with photo backup off, a backup contains no photos', async () => {
  render();
  const settings = await openSettings();
  const backUpPhotos = settings.getByRole('switch', { name: /^Back up photos/ });
  expect(backUpPhotos).not.toBeChecked();
  const file = await backUp(settings);
  expect(BackupFile.header(file).format).toBe(1);
  expect((await BackupFile.read(file, 'correct horse battery', cipher)).photos).toBeUndefined();
}, 90000);

it('turned on, the photos go into the backup, and the switch says what they add to it', async () => {
  render();
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('switch', { name: /^Back up photos/ }));
  expect(await settings.findByText(/^Your photos \(2 MB\) go into each backup/, {}, slowly)).toBeInTheDocument();
  const file = await backUp(settings);
  const opened = await BackupFile.read(file, 'correct horse battery', cipher);
  expect(opened.photos).toBeDefined();
  const [photo] = decodePhotoArchive(opened.photos!);
  expect(photo?.pose).toBe('front');
  expect(photo?.jpeg.length).toBe(2_400_000);
}, 90000);

it('a backup that carries photos brings them back; one without leaves this phone’s as they are', async () => {
  const records = new TextEncoder().encode('SQLite format 3\0 the records');
  const archive = encodePhotoArchive([
    { date: today.addDays(-30), pose: 'side', takenAt: new Date(2026, 8, 19, 7), width: 900, height: 1200, jpeg: new Uint8Array([1, 2]) },
  ]);
  for (const [photos, expected] of [
    [undefined, ['front']],
    [archive, ['side']],
  ] as const) {
    backup.toPick = await BackupFile.write(records, 'correct horse battery', { schemaVersion: currentSchemaVersion, createdOn: '2026-10-12', photos }, cipher);
    const view = render();
    const settings = await openSettings();
    await userEvent.click(settings.getByRole('button', { name: /^Restore from a backup/ }));
    const sheet = within(await screen.findByRole('dialog', { name: 'The backup’s passphrase' }, slowly));
    await userEvent.type(await sheet.findByLabelText('Passphrase', {}, slowly), 'correct horse battery');
    await userEvent.click(sheet.getByRole('button', { name: 'Open' }));
    const asks = await screen.findByRole('dialog', { name: 'Restore this backup?' }, slowly);
    await userEvent.click(within(asks).getByRole('button', { name: 'Restore' }));
    expect(await screen.findByText(/^Restored\./, {}, slowly)).toBeInTheDocument();
    await waitFor(async () => expect((await first(repos.progressPhotos.watchPhotos())).map((p) => p.pose)).toEqual(expected), slowly);
    view.unmount();
  }
}, 120000);
