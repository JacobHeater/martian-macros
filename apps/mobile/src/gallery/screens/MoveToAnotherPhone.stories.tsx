import type { Meta } from '@storybook/react-vite';
import { screen, userEvent, within } from 'storybook/test';
import type { BackupContents } from '../../domain/backup/BackupContents';
import { encodePhotoArchive } from '../../domain/photos/encodePhotoArchive';
import { FakeDataRestorer } from '../../fixtures/FakeDataRestorer';
import { SettingsScreen } from '../../settings/SettingsScreen';
import type { AppServices } from '../../state/AppServices';
import { FakeMoveReceiver } from '../../transfer/FakeMoveReceiver';
import { FakeMoveSender } from '../../transfer/FakeMoveSender';
import { MoveCode } from '../../transfer/MoveCode';
import { MoveProblem } from '../../transfer/MoveProblem';
import { demoWith } from './demoWith';
import { newInstallScenario } from './newInstallScenario';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';
import type { StoryStage } from './StoryStage';
import { storyToday } from './storyToday';

/**
 * Moving to another phone on the same Wi-Fi (MM-698): which way, the backup nudge, the code to scan, receiving, the
 * confirmation before anything is replaced, sending, and every way a move does not happen, on both phones.
 */
const meta = { title: 'Screens/Move to another phone', ...screensMeta } satisfies Meta;
export default meta;

const openBackup = ({ navigator }: StoryStage) => void navigator.push(() => <SettingsScreen open="backup" />);

/** This phone as a long-used one holds it: what a move would replace. */
const usedPhone: BackupContents = {
  weighIns: 71,
  foodDays: 58,
  workouts: 12,
  customFoods: 3,
  from: storyToday.addDays(-70),
  to: storyToday,
  hasSetup: true,
};

const withReceiver = (receiver: FakeMoveReceiver, here: BackupContents = usedPhone) => async (services: AppServices): Promise<AppServices> => {
  const restorer = new FakeDataRestorer();
  restorer.here = here;
  return { ...services, restorer, moveReceiver: receiver };
};

/** A code the other phone shows, as this phone's camera reads it. */
const scannedCode = new MoveCode({ host: '192.168.1.24', port: 47_310 }, new Uint8Array(32).fill(7)).toText();

const withSender = (sender: FakeMoveSender, scanned = scannedCode) => async (services: AppServices): Promise<AppServices> => ({
  ...services,
  moveSender: sender,
  codeScanner: { scanCode: async () => scanned },
});

/** Presses "Move to another phone", then the way named `side`. */
const choose = (side: 'Send from this phone' | 'Receive on this phone') => async (canvas: HTMLElement) => {
  await userEvent.click(await within(canvas).findByRole('button', { name: /^Move to another phone/ }, { timeout: 10000 }));
  const sheet = await screen.findByRole('dialog', { name: 'Move to another phone' }, { timeout: 10000 });
  await userEvent.click(within(sheet).getByRole('button', { name: new RegExp(`^${side}`) }));
};

export const MoveChoice = screenStory({
  covers: ['SettingsScreen', 'MoveChoiceSheet'],
  shows: 'Send from this phone',
  viewport: 'smallPhone',
  open: openBackup,
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Move to another phone/ }, { timeout: 10000 }));
  },
});

/** Records on this phone that were never backed up: the nudge comes before the code. */
export const MoveNudgeNeverBackedUp = screenStory({
  covers: ['ReceiveMoveSheet'],
  shows: 'Back up this phone first?',
  viewport: 'smallPhone',
  device: withReceiver(new FakeMoveReceiver()),
  open: openBackup,
  walk: choose('Receive on this phone'),
});

/** Records logged since the last backup, three days ago. */
export const MoveNudgeSinceBackup = screenStory({
  covers: ['ReceiveMoveSheet'],
  shows: /logged since its last backup/,
  scenario: demoWith({ then: async (repos, today) => repos.preferences.saveLastBackupOn(today.addDays(-3)) }),
  device: withReceiver(new FakeMoveReceiver()),
  open: openBackup,
  walk: choose('Receive on this phone'),
});

/** The code, with the app's icon in it, while this phone waits for the other to scan it. */
export const MoveCodeWaiting = screenStory({
  covers: ['ReceiveMoveSheet'],
  shows: 'Waiting for your other phone…',
  viewport: 'smallPhone',
  device: withReceiver(new FakeMoveReceiver(), { ...usedPhone, weighIns: 0, foodDays: 0, workouts: 0, customFoods: 0, hasSetup: false, from: undefined, to: undefined }),
  open: openBackup,
  walk: choose('Receive on this phone'),
});

export const MoveGettingCodeReady = screenStory({
  covers: ['ReceiveMoveSheet'],
  shows: 'Getting a code ready…',
  device: async (services) => {
    const receiver = new FakeMoveReceiver();
    receiver.holdsOpening = true;
    return withReceiver(receiver, { ...usedPhone, hasSetup: false, weighIns: 0, foodDays: 0, workouts: 0, customFoods: 0 })(services);
  },
  open: openBackup,
  walk: choose('Receive on this phone'),
});

export const MoveReceiving = screenStory({
  covers: ['ReceiveMoveSheet'],
  shows: '42% received',
  device: withReceiver(new FakeMoveReceiver({ kind: 'receiving', done: 42, total: 100 }), { ...usedPhone, hasSetup: false, weighIns: 0, foodDays: 0, workouts: 0, customFoods: 0 }),
  open: openBackup,
  walk: choose('Receive on this phone'),
});

const failingReceive = (problem: MoveProblem) => {
  const receiver = new FakeMoveReceiver({ kind: 'fails', problem });
  return withReceiver(receiver, { ...usedPhone, hasSetup: false, weighIns: 0, foodDays: 0, workouts: 0, customFoods: 0 });
};

export const MoveReceiveNoWifi = screenStory({
  covers: ['ReceiveMoveSheet'],
  shows: /not on Wi-Fi/,
  device: async (services) => {
    const receiver = new FakeMoveReceiver();
    receiver.noWifi = true;
    return withReceiver(receiver, { ...usedPhone, hasSetup: false, weighIns: 0, foodDays: 0, workouts: 0, customFoods: 0 })(services);
  },
  open: openBackup,
  walk: choose('Receive on this phone'),
});

/** The other phone runs a newer version: this one is the one to update. */
export const MoveReceiveOtherVersion = screenStory({
  covers: ['ReceiveMoveSheet'],
  shows: /Update Martian Macros on this phone/,
  viewport: 'smallPhone',
  device: failingReceive(new MoveProblem('versionMismatch', { app: '1.1 (4)', schema: 1 })),
  open: openBackup,
  walk: choose('Receive on this phone'),
});

export const MoveCodeExpired = screenStory({
  covers: ['ReceiveMoveSheet'],
  shows: /The code expired/,
  device: failingReceive(new MoveProblem('stopped')),
  open: openBackup,
  walk: choose('Receive on this phone'),
});

export const MoveReceiveBroken = screenStory({
  covers: ['ReceiveMoveSheet'],
  shows: /stopped before it finished/,
  device: failingReceive(new MoveProblem('broken')),
  open: openBackup,
  walk: choose('Receive on this phone'),
});

/** A progress photo of the person, as the fixtures hold one: its bytes do not matter here. */
const photo = (daysAgo: number) => ({
  date: storyToday.addDays(-daysAgo),
  pose: 'front' as const,
  takenAt: new Date(2026, 9, 12 - daysAgo, 7, 30),
  width: 3,
  height: 4,
  jpeg: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
});

/**
 * What arrived, and what it replaces, asked before anything changes: at phone width, with the most a long-used
 * phone holds on both sides and photos arriving while this phone has its own.
 */
export const MoveConfirm = screenStory({
  covers: ['ReceiveMoveSheet'],
  shows: 'Replace this phone’s data?',
  viewport: 'smallPhone',
  device: async (services) => {
    const receiver = new FakeMoveReceiver({
      kind: 'receives',
      payload: { snapshot: new Uint8Array([1, 2, 3]), photos: encodePhotoArchive([photo(60), photo(30), photo(1)]) },
    });
    const restorer = new FakeDataRestorer();
    // Backed up today, after the last record: no nudge.
    restorer.here = { weighIns: 214, foodDays: 187, workouts: 96, customFoods: 41, from: storyToday.addDays(-240), to: storyToday.addDays(-1), hasSetup: true };
    restorer.toDescribe = { weighIns: 1365, foodDays: 1102, workouts: 518, customFoods: 127, from: storyToday.addDays(-1500), to: storyToday, hasSetup: true };
    return { ...services, restorer, moveReceiver: receiver };
  },
  scenario: demoWith({
    then: async (repos, today) => {
      await repos.preferences.saveLastBackupOn(today);
      await repos.progressPhotos.savePhoto(photo(14));
    },
  }),
  open: openBackup,
  walk: choose('Receive on this phone'),
});

export const MoveReachingOtherPhone = screenStory({
  covers: ['SendMoveSheet'],
  shows: 'Reaching your other phone…',
  device: withSender(new FakeMoveSender({ kind: 'connecting' })),
  open: openBackup,
  walk: choose('Send from this phone'),
});

export const MoveSending = screenStory({
  covers: ['SendMoveSheet'],
  shows: '30% sent',
  device: withSender(new FakeMoveSender({ kind: 'sending', done: 3, total: 10 })),
  open: openBackup,
  walk: choose('Send from this phone'),
});

export const MoveSent = screenStory({
  covers: ['SendMoveSheet'],
  shows: 'Sent',
  device: withSender(new FakeMoveSender({ kind: 'sends' })),
  open: openBackup,
  walk: choose('Send from this phone'),
});

export const MoveSendUnreachable = screenStory({
  covers: ['SendMoveSheet'],
  shows: /Could not reach the other phone/,
  viewport: 'smallPhone',
  device: withSender(new FakeMoveSender({ kind: 'fails', problem: new MoveProblem('unreachable') })),
  open: openBackup,
  walk: choose('Send from this phone'),
});

/** The other phone runs an older version: it is the one to update. */
export const MoveSendOlderReceiver = screenStory({
  covers: ['SendMoveSheet'],
  shows: /Update Martian Macros on the other phone/,
  viewport: 'smallPhone',
  device: withSender(new FakeMoveSender({ kind: 'fails', problem: new MoveProblem('versionMismatch', { app: '0.9 (1)', schema: 1 }) })),
  open: openBackup,
  walk: choose('Send from this phone'),
});

/** Something other than a move code was scanned: a product's barcode, another app's code. */
export const MoveScannedNotACode = screenStory({
  covers: ['SendMoveSheet'],
  shows: /not a Martian Macros move code/,
  device: withSender(new FakeMoveSender(), 'https://example.com/menu'),
  open: openBackup,
  walk: choose('Send from this phone'),
});

/** A fresh install: the welcome's way to move here, straight to the code, with no backup to offer. */
export const MoveFromWelcome = screenStory({
  covers: ['OnboardingScreen', 'WelcomeStep', 'ReceiveMoveSheet'],
  shows: 'Scan this from your other phone',
  viewport: 'smallPhone',
  scenario: newInstallScenario,
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: 'I have Martian Macros on another phone' }, { timeout: 10000 }));
  },
});

/** MM-700: confirmed, while what arrived replaces this phone's records: a wait that cannot be closed half-way. */
export const MoveApplying = screenStory({
  covers: ['MoveApplyingSheet'],
  shows: 'Putting your records in place…',
  viewport: 'smallPhone',
  device: async (services) => {
    const receiver = new FakeMoveReceiver({ kind: 'receives', payload: { snapshot: new Uint8Array([1, 2, 3]), photos: encodePhotoArchive([]) } });
    const restorer = new FakeDataRestorer();
    restorer.toDescribe = usedPhone;
    restorer.onRestore = () => new Promise<void>(() => undefined);
    return { ...services, restorer, moveReceiver: receiver };
  },
  scenario: newInstallScenario,
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: 'I have Martian Macros on another phone' }, { timeout: 10000 }));
    const asks = await screen.findByRole('dialog', { name: 'Replace this phone’s data?' }, { timeout: 10000 });
    await userEvent.click(within(asks).getByRole('button', { name: 'Replace' }));
  },
});
