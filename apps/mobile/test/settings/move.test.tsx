import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { BackupFile } from '../../src/backup/BackupFile';
import { FakeBackupPlatform } from '../../src/backup/FakeBackupPlatform';
import { SodiumBackupCipher } from '../../src/backup/SodiumBackupCipher';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { CoachAiConfig } from '../../src/domain/integration/CoachAiConfig';
import { encodePhotoArchive } from '../../src/domain/photos/encodePhotoArchive';
import { FakeDataRestorer } from '../../src/fixtures/FakeDataRestorer';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { AppServices } from '../../src/state/AppServices';
import { FakeMoveReceiver } from '../../src/transfer/FakeMoveReceiver';
import { FakeMoveSender } from '../../src/transfer/FakeMoveSender';
import { MoveCode } from '../../src/transfer/MoveCode';
import { MoveProblem } from '../../src/transfer/MoveProblem';
import { openSettings } from '../support/openSettings';
import { renderApp } from '../support/renderApp';

/**
 * MM-698: Settings > Backup > Move to another phone, and the first-run welcome's way in. The receiving phone offers
 * a backup when it holds records none has, shows its code, and replaces nothing until the person confirms what
 * arrived; the sending phone scans the code and sends its records and photos, and keeps them.
 */
const slowly = { timeout: 15000 };
const today = CalendarDate.of(2026, 10, 19);
const snapshot = new Uint8Array([4, 5, 6]);
const used = { weighIns: 30, foodDays: 20, workouts: 4, customFoods: 1, from: today.addDays(-30), to: today, hasSetup: true };
let repos: InMemoryRepositories;
let restorer: FakeDataRestorer;
let receiver: FakeMoveReceiver;
let sender: FakeMoveSender;
let scanned: string | undefined;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  restorer = new FakeDataRestorer();
  restorer.here = used;
  restorer.toDescribe = { ...used, weighIns: 45 };
  receiver = new FakeMoveReceiver({ kind: 'receives', parcel: { kind: 'everything', payload: { snapshot, photos: encodePhotoArchive([]), coachAi: CoachAiConfig.off } } });
  sender = new FakeMoveSender();
  scanned = new MoveCode({ host: '192.168.1.24', port: 47_310 }, new Uint8Array(32).fill(3)).toText();
});

const render = (base = repos) =>
  renderApp(base, today, {
    change: (services: AppServices) => ({
      ...services,
      restorer,
      backup: new FakeBackupPlatform(async () => snapshot),
      moveReceiver: receiver,
      moveSender: sender,
      codeScanner: { scanCode: async () => scanned },
    }),
  });

const startMove = async (side: 'Send from this phone' | 'Receive on this phone') => {
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('button', { name: /^Move to another phone/ }));
  const choice = within(await screen.findByRole('dialog', { name: 'Move to another phone' }, slowly));
  await userEvent.click(choice.getByRole('button', { name: new RegExp(`^${side}`) }));
};

it('offers a backup first when this phone was never backed up, and replaces its data only once confirmed', async () => {
  render();
  await startMove('Receive on this phone');
  const nudge = within(await screen.findByRole('dialog', { name: 'Move to this phone' }, slowly));
  expect(nudge.getByText(/never been backed up/)).toBeInTheDocument();
  expect(restorer.restoredFrom).toHaveLength(0);
  await userEvent.click(nudge.getByRole('button', { name: 'Skip the backup' }));
  const asks = await screen.findByRole('dialog', { name: 'Replace this phone’s data?' }, slowly);
  expect(within(asks).getByText(/Moving replaces everything on this phone: 30 weigh-ins/)).toBeInTheDocument();
  expect(within(asks).getByText(/Your other phone sent 45 weigh-ins/)).toBeInTheDocument();
  expect(within(asks).getByRole('button', { name: 'Cancel' })).toHaveFocus();
  await userEvent.click(within(asks).getByRole('button', { name: 'Replace' }));
  await waitFor(() => expect(restorer.restoredFrom).toEqual([snapshot]), slowly);
  expect(await screen.findByText(/^Moved\./, {}, slowly)).toBeInTheDocument();
});

it('leaves this phone exactly as it was when the confirmation is cancelled', async () => {
  restorer.here = { ...used, to: today.addDays(-1) };
  await repos.preferences.saveLastBackupOn(today);
  render();
  await startMove('Receive on this phone');
  const asks = await screen.findByRole('dialog', { name: 'Replace this phone’s data?' }, slowly);
  await userEvent.click(within(asks).getByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Replace this phone’s data?' })).not.toBeInTheDocument(), slowly);
  expect(restorer.restoredFrom).toHaveLength(0);
});

it('warns of records logged since the last backup, and runs the backup when asked, then shows the code', async () => {
  receiver.outcome = { kind: 'waits' };
  await repos.preferences.saveLastBackupOn(today.addDays(-3));
  render();
  await startMove('Receive on this phone');
  const nudge = within(await screen.findByRole('dialog', { name: 'Move to this phone' }, slowly));
  expect(nudge.getByText(/logged since its last backup/)).toBeInTheDocument();
  await userEvent.click(nudge.getByRole('button', { name: 'Back up first' }));
  const passphrase = within(await screen.findByRole('dialog', { name: 'A passphrase for this backup' }, slowly));
  await userEvent.type(passphrase.getByLabelText('Passphrase'), 'correct horse battery');
  await userEvent.type(passphrase.getByLabelText('Passphrase again'), 'correct horse battery');
  await userEvent.click(passphrase.getByRole('button', { name: 'Back up' }));
  const code = within(await screen.findByRole('dialog', { name: 'Move to this phone' }, slowly));
  expect(await code.findByText('Waiting for your other phone…', {}, slowly)).toBeInTheDocument();
  expect(code.queryByText(/since its last backup/)).not.toBeInTheDocument();
  expect(code.getByRole('img', { name: 'QR code for your other phone to scan' })).toBeInTheDocument();
});

it('shows the code at once when nothing was logged since the last backup', async () => {
  receiver.outcome = { kind: 'waits' };
  // Only the backup's day is kept, so a record on that day counts as unbacked: the last one is the day before.
  restorer.here = { ...used, to: today.addDays(-1) };
  await repos.preferences.saveLastBackupOn(today);
  render();
  await startMove('Receive on this phone');
  const code = within(await screen.findByRole('dialog', { name: 'Move to this phone' }, slowly));
  expect(await code.findByText('Waiting for your other phone…', {}, slowly)).toBeInTheDocument();
  expect(code.queryByText('Back up this phone first?')).not.toBeInTheDocument();
});

it('stops listening when the sheet is closed', async () => {
  receiver.outcome = { kind: 'waits' };
  restorer.here = { ...used, hasSetup: false, weighIns: 0, foodDays: 0, workouts: 0, customFoods: 0 };
  render();
  await startMove('Receive on this phone');
  const code = within(await screen.findByRole('dialog', { name: 'Move to this phone' }, slowly));
  await code.findByText('Waiting for your other phone…', {}, slowly);
  expect(receiver.listening).toBe(true);
  await userEvent.click(code.getByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(receiver.listening).toBe(false), slowly);
});

it('names the phone to update when the versions differ, and changes nothing', async () => {
  receiver.outcome = { kind: 'fails', problem: new MoveProblem('versionMismatch', { app: '0.9 (1)', schema: 1 }) };
  restorer.here = { ...used, hasSetup: false, weighIns: 0, foodDays: 0, workouts: 0, customFoods: 0 };
  render();
  await startMove('Receive on this phone');
  const failed = within(await screen.findByRole('dialog', { name: 'Move to this phone' }, slowly));
  expect(await failed.findByText(/Update Martian Macros on the other phone/, { selector: 'p' }, slowly)).toBeInTheDocument();
  expect(restorer.restoredFrom).toHaveLength(0);
});

it('sends this phone’s records and photos to the phone whose code it scanned, and keeps them', async () => {
  render();
  await startMove('Send from this phone');
  const sheet = within(await screen.findByRole('dialog', { name: 'Sending to your other phone' }, slowly));
  expect(await sheet.findByRole('heading', { name: 'Sent' }, slowly)).toBeInTheDocument();
  expect(sender.sent).toHaveLength(1);
  expect(sender.sent[0]?.parcel).toMatchObject({ kind: 'everything', payload: { snapshot } });
  expect(sender.sent[0]?.code.address).toEqual({ host: '192.168.1.24', port: 47_310 });
  expect(restorer.restoredFrom).toHaveLength(0);
});

it('says the phones must share a Wi-Fi when the other cannot be reached, and offers to scan again', async () => {
  sender.outcome = { kind: 'fails', problem: new MoveProblem('unreachable') };
  render();
  await startMove('Send from this phone');
  const sheet = within(await screen.findByRole('dialog', { name: 'Sending to your other phone' }, slowly));
  expect(await sheet.findByText(/Both phones need the same Wi-Fi/, { selector: 'p' }, slowly)).toBeInTheDocument();
  expect(sheet.getByRole('button', { name: 'Scan again' })).toBeInTheDocument();
});

it('sends nothing for a code that is not a move code, and offers to scan again', async () => {
  scanned = '0123456789012';
  render();
  await startMove('Send from this phone');
  const sheet = within(await screen.findByRole('dialog', { name: 'Sending to your other phone' }, slowly));
  expect(await sheet.findByText(/not a Martian Macros move code/, { selector: 'p' }, slowly)).toBeInTheDocument();
  expect(sheet.getByRole('button', { name: 'Scan again' })).toBeInTheDocument();
  expect(sheet.getByRole('heading', { name: 'The move did not happen' })).toHaveFocus();
  expect(sender.sent).toHaveLength(0);
});

it('moves onto a fresh install from the welcome, with no backup to offer and no question asked', async () => {
  const fresh = new InMemoryRepositories();
  await fresh.preferences.saveThemePreference('martian');
  restorer.here = { weighIns: 0, foodDays: 0, workouts: 0, customFoods: 0, from: undefined, to: undefined, hasSetup: false };
  // The fake restorer only records; here it puts the moved profile in place, as the real one would.
  restorer.onRestore = async () => fresh.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  render(fresh);
  await userEvent.click(await screen.findByRole('button', { name: 'I have Martian Macros on another phone' }, slowly));
  const asks = await screen.findByRole('dialog', { name: 'Replace this phone’s data?' }, slowly);
  expect(within(asks).getByText(/This phone holds nothing yet/)).toBeInTheDocument();
  await userEvent.click(within(asks).getByRole('button', { name: 'Replace' }));
  expect(await screen.findByRole('button', { name: 'Menu' }, slowly)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Begin' })).not.toBeInTheDocument();
});

it('returns to the welcome with nothing stored when a move from it is cancelled', async () => {
  const fresh = new InMemoryRepositories();
  await fresh.preferences.saveThemePreference('martian');
  restorer.here = { weighIns: 0, foodDays: 0, workouts: 0, customFoods: 0, from: undefined, to: undefined, hasSetup: false };
  render(fresh);
  await userEvent.click(await screen.findByRole('button', { name: 'I have Martian Macros on another phone' }, slowly));
  const asks = await screen.findByRole('dialog', { name: 'Replace this phone’s data?' }, slowly);
  await userEvent.click(within(asks).getByRole('button', { name: 'Cancel' }));
  expect(await screen.findByRole('button', { name: 'Begin' }, slowly)).toBeInTheDocument();
  expect(restorer.restoredFrom).toHaveLength(0);
  expect(await fresh.setup.loadSetup()).toBeUndefined();
});

// MM-700: on the owner's Pixel the confirmation closed onto the welcome while the records were still being written,
// minutes long, with nothing said; a failure there would have been silent too.
it('shows the wait while the records are put in place, and it cannot be closed half-way', async () => {
  const fresh = new InMemoryRepositories();
  await fresh.preferences.saveThemePreference('martian');
  restorer.here = { weighIns: 0, foodDays: 0, workouts: 0, customFoods: 0, from: undefined, to: undefined, hasSetup: false };
  restorer.progressSteps = [[0, 10], [3, 10]];
  restorer.onRestore = () => new Promise<void>(() => undefined);
  render(fresh);
  await userEvent.click(await screen.findByRole('button', { name: 'I have Martian Macros on another phone' }, slowly));
  const asks = await screen.findByRole('dialog', { name: 'Replace this phone’s data?' }, slowly);
  await userEvent.click(within(asks).getByRole('button', { name: 'Replace' }));
  const wait = await screen.findByRole('dialog', { name: 'Moving your records' }, slowly);
  // MM-702: a bar that fills, with the share in words, not a spinner.
  expect(await within(wait).findByText('30% in place', {}, slowly)).toBeInTheDocument();
  await userEvent.keyboard('{Escape}');
  expect(screen.getByRole('dialog', { name: 'Moving your records' })).toBeInTheDocument();
});

it('says when the records could not be moved, instead of nothing', async () => {
  const fresh = new InMemoryRepositories();
  await fresh.preferences.saveThemePreference('martian');
  restorer.here = { weighIns: 0, foodDays: 0, workouts: 0, customFoods: 0, from: undefined, to: undefined, hasSetup: false };
  restorer.onRestore = async () => {
    throw new Error('disk full');
  };
  render(fresh);
  await userEvent.click(await screen.findByRole('button', { name: 'I have Martian Macros on another phone' }, slowly));
  const asks = await screen.findByRole('dialog', { name: 'Replace this phone’s data?' }, slowly);
  await userEvent.click(within(asks).getByRole('button', { name: 'Replace' }));
  expect(await screen.findByText('Your records could not be moved. Nothing on this phone was changed.', {}, slowly)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Begin' })).toBeInTheDocument();
});

// MM-701: the coach's provider and key come with a move, put in place with the records; never with a backup.
const key: CoachAiConfig = { provider: 'anthropic', apiKey: 'sk-ant-api03-MOVEDKEY' };

const moveOntoFresh = async (coachAi: CoachAiConfig = key, before?: CoachAiConfig) => {
  const fresh = new InMemoryRepositories();
  await fresh.preferences.saveThemePreference('martian');
  restorer.here = { weighIns: 0, foodDays: 0, workouts: 0, customFoods: 0, from: undefined, to: undefined, hasSetup: false };
  receiver = new FakeMoveReceiver({ kind: 'receives', parcel: { kind: 'everything', payload: { snapshot, photos: encodePhotoArchive([]), coachAi } } });
  let services: AppServices | undefined;
  renderApp(fresh, today, {
    change: (base: AppServices) => {
      services = { ...base, restorer, moveReceiver: receiver, moveSender: sender, codeScanner: { scanCode: async () => scanned } };
      return services;
    },
  });
  if (before !== undefined) await services?.coachAi.saveConfig(before);
  await userEvent.click(await screen.findByRole('button', { name: 'I have Martian Macros on another phone' }, slowly));
  return { asks: await screen.findByRole('dialog', { name: 'Replace this phone’s data?' }, slowly), coach: () => services!.coachAi.loadConfig() };
};

it('brings the coach’s provider and key with the move, once confirmed', async () => {
  const { asks, coach } = await moveOntoFresh();
  expect(await coach()).toEqual(CoachAiConfig.off);
  await userEvent.click(within(asks).getByRole('button', { name: 'Replace' }));
  await waitFor(async () => expect(await coach()).toEqual(key), slowly);
});

it('keeps this phone’s own key when the other phone had none', async () => {
  const mine: CoachAiConfig = { provider: 'openai', apiKey: 'sk-proj-MINE' };
  const { asks, coach } = await moveOntoFresh(CoachAiConfig.off, mine);
  await userEvent.click(within(asks).getByRole('button', { name: 'Replace' }));
  await waitFor(() => expect(restorer.restoredFrom).toHaveLength(1), slowly);
  expect(await coach()).toEqual(mine);
});

it('changes no key when the move is cancelled', async () => {
  const { asks, coach } = await moveOntoFresh();
  await userEvent.click(within(asks).getByRole('button', { name: 'Cancel' }));
  await screen.findByRole('button', { name: 'Begin' }, slowly);
  expect(await coach()).toEqual(CoachAiConfig.off);
});

it('sends this phone’s coach key with the move', async () => {
  let services: AppServices | undefined;
  renderApp(repos, today, {
    change: (base: AppServices) => {
      services = { ...base, restorer, backup: new FakeBackupPlatform(async () => snapshot), moveSender: sender, codeScanner: { scanCode: async () => scanned } };
      return services;
    },
  });
  await services?.coachAi.saveConfig(key);
  await startMove('Send from this phone');
  await (within(await screen.findByRole('dialog', { name: 'Sending to your other phone' }, slowly))).findByRole('heading', { name: 'Sent' }, slowly);
  expect(sender.sent[0]?.parcel).toMatchObject({ kind: 'everything', payload: { coachAi: key } });
});

it('never puts the coach key in a backup file', async () => {
  const backup = new FakeBackupPlatform(async () => snapshot);
  let services: AppServices | undefined;
  renderApp(repos, today, {
    change: (base: AppServices) => {
      services = { ...base, restorer, backup };
      return services;
    },
  });
  await services?.coachAi.saveConfig(key);
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('button', { name: /^Back up now/ }));
  const sheet = within(await screen.findByRole('dialog', { name: 'A passphrase for this backup' }, slowly));
  await userEvent.type(sheet.getByLabelText('Passphrase'), 'correct horse battery');
  await userEvent.type(sheet.getByLabelText('Passphrase again'), 'correct horse battery');
  await userEvent.click(sheet.getByRole('button', { name: 'Back up' }));
  await waitFor(() => expect(backup.saved).toHaveLength(1), slowly);
  const opened = await BackupFile.read(backup.saved[0]!.file, 'correct horse battery', new SodiumBackupCipher());
  const text = new TextDecoder('latin1').decode(new Uint8Array([...backup.saved[0]!.file, ...opened.snapshot, ...(opened.photos ?? [])]));
  expect(text).not.toContain('MOVEDKEY');
});
