import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { BackupFile } from '../../src/backup/BackupFile';
import { SodiumBackupCipher } from '../../src/backup/SodiumBackupCipher';
import { SqlRepositories } from '../../src/data/SqlRepositories';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { currentSchemaVersion } from '../../src/data/currentSchemaVersion';
import { FakeBackupPlatform } from '../../src/backup/FakeBackupPlatform';
import { FakeDataRestorer } from '../../src/fixtures/FakeDataRestorer';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';
import { openSettings } from '../support/openSettings';
import { renderApp } from '../support/renderApp';
import { topLayer } from '../support/topLayer';

/**
 * MM-63: Settings > Backup. Back up now asks for a passphrase twice, seals a
 * snapshot and hands the file to the phone; the last backup's day is shown;
 * restore picks a file, asks for the passphrase (again, after a wrong one),
 * says what the backup holds and what it replaces, and restores only once
 * confirmed. A covered run on the owner's Mac is slow, so every wait is long.
 */
const slowly = { timeout: 15000 };
const today = CalendarDate.of(2026, 10, 19);
let repos: InMemoryRepositories;
let backup: FakeBackupPlatform;
let restorer: FakeDataRestorer;

/** A real database with one weigh-in, as the phone's snapshot. */
async function snapshotWithOneWeighIn(): Promise<Uint8Array> {
  const db = await WasmSqlDatabase.open();
  const sql = await SqlRepositories.open(db);
  await sql.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await sql.weights.saveWeight(today.addDays(-1), 82.4);
  return db.exportBytes();
}

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  backup = new FakeBackupPlatform(snapshotWithOneWeighIn);
  restorer = new FakeDataRestorer();
  restorer.toDescribe = { weighIns: 1, foodDays: 0, workouts: 0, customFoods: 0, from: today.addDays(-1), to: today.addDays(-1), hasSetup: true };
  restorer.here = { weighIns: 1, foodDays: 0, workouts: 0, customFoods: 0, from: today, to: today, hasSetup: true };
});

const render = () => renderApp(repos, today, { change: (services) => ({ ...services, backup, restorer }) });

const typePassphrase = async (sheet: ReturnType<typeof within>, passphrase: string, again?: string) => {
  await userEvent.type(await sheet.findByLabelText('Passphrase', {}, slowly), passphrase);
  if (again !== undefined) await userEvent.type(sheet.getByLabelText('Passphrase again'), again);
};

it('backs up: a passphrase typed twice, a sealed file handed to the phone, and the day recorded', async () => {
  render();
  const settings = await openSettings();
  expect(settings.getByText('Never')).toBeInTheDocument();
  // The section says the one thing a tester must know (MM-65): the phone's own cloud backup does not carry the records.
  expect(settings.getByText(/not in your phone’s own cloud backup/)).toBeInTheDocument();
  await userEvent.click(settings.getByRole('button', { name: /^Back up now/ }));
  const sheet = within(await screen.findByRole('dialog', { name: 'A passphrase for this backup' }, slowly));
  expect(sheet.getByText(/If you lose it, nobody can open this backup/)).toBeInTheDocument();
  // Too short is said by the helper, and Back up waits.
  await typePassphrase(sheet, 'short one');
  expect(sheet.getByRole('button', { name: 'Back up' })).toBeDisabled();
  await userEvent.clear(sheet.getByLabelText('Passphrase'));
  // The mismatch is not said while the second is still a correct beginning of the first.
  await typePassphrase(sheet, 'correct horse battery', 'correct horse');
  expect(sheet.queryByText('The two do not match.')).not.toBeInTheDocument();
  await userEvent.type(sheet.getByLabelText('Passphrase again'), ' batterx');
  expect(sheet.getByText('The two do not match.')).toBeInTheDocument();
  await userEvent.clear(sheet.getByLabelText('Passphrase again'));
  await userEvent.type(sheet.getByLabelText('Passphrase again'), 'correct horse battery');
  // Show reveals what was typed.
  await userEvent.click(sheet.getByRole('button', { name: 'Show passphrase' }));
  expect(sheet.getByLabelText('Passphrase')).toHaveAttribute('type', 'text');
  await userEvent.click(sheet.getByRole('button', { name: 'Back up' }));
  // While it works the row stays a button and says so.
  expect(settings.getByRole('button', { name: /^Back up now/ })).toBeInTheDocument();
  await waitFor(() => expect(backup.saved).toHaveLength(1), slowly);
  expect(backup.saved[0]?.name).toBe('martian-macros-2026-10-19.mmbackup');
  const header = BackupFile.header(backup.saved[0]!.file);
  expect(header.schemaVersion).toBe(currentSchemaVersion);
  expect(await screen.findByText('Backup saved.', {}, slowly)).toBeInTheDocument();
  await waitFor(() => expect(within(topLayer()).getByText('October 19, 2026')).toBeInTheDocument(), slowly);
}, 60000);

it('restores: a wrong passphrase is said and asked again; the right one shows what the backup holds and what it replaces', async () => {
  backup.toPick = await BackupFile.write(await snapshotWithOneWeighIn(), 'correct horse battery', { schemaVersion: currentSchemaVersion, createdOn: '2026-10-12' }, new SodiumBackupCipher());
  render();
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('button', { name: /^Restore from a backup/ }));
  let sheet = within(await screen.findByRole('dialog', { name: 'The backup’s passphrase' }, slowly));
  await typePassphrase(sheet, 'incorrect horse battery');
  await userEvent.click(sheet.getByRole('button', { name: 'Open' }));
  sheet = within(await screen.findByRole('dialog', { name: 'The backup’s passphrase' }, slowly));
  expect(await sheet.findByText('That passphrase does not open this backup.', {}, slowly)).toBeInTheDocument();
  expect(restorer.restoredFrom).toHaveLength(0);
  await typePassphrase(sheet, 'correct horse battery');
  await userEvent.click(sheet.getByRole('button', { name: 'Open' }));
  const asks = await screen.findByRole('dialog', { name: 'Restore this backup?' }, slowly);
  // The loss first, then what the backup holds, as two paragraphs a reader hears as the dialog's description.
  const paragraphs = [...asks.querySelectorAll('p')].map((p) => p.textContent);
  expect(paragraphs[0]).toMatch(/^Restoring replaces everything on this phone: 1 weigh-in, your profile and your settings\. It cannot be undone\.$/);
  expect(paragraphs[1]).toMatch(/^The backup, made on October 12, 2026, holds 1 weigh-in, October 18, 2026 to October 18, 2026\.$/);
  expect(asks.getAttribute('aria-describedby')).toBe(asks.querySelector('.mm-dialog-body')?.id);
  await userEvent.click(within(asks).getByRole('button', { name: 'Restore' }));
  await waitFor(() => expect(restorer.restoredFrom).toHaveLength(1), slowly);
  expect(await screen.findByText(/^Restored\./, {}, slowly)).toBeInTheDocument();
}, 90000);

it('a cancelled pick and a file that is no backup do nothing to the phone', async () => {
  render();
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('button', { name: /^Restore from a backup/ }));
  expect(screen.queryByRole('dialog', { name: 'Passphrase' })).not.toBeInTheDocument();
  backup.toPick = new TextEncoder().encode('%PDF-1.7 not a backup');
  await userEvent.click(settings.getByRole('button', { name: /^Restore from a backup/ }));
  expect(await screen.findByText('This file is not a Martian Macros backup.', {}, slowly)).toBeInTheDocument();
  expect(restorer.restoredFrom).toHaveLength(0);
}, 60000);
