import type { Meta } from '@storybook/react-vite';
import { screen, userEvent, within } from 'storybook/test';
import type { BackupContents } from '../../domain/backup/BackupContents';
import { CustomFood } from '../../domain/food/custom/CustomFood';
import { NutritionTotals } from '../../domain/food/portion/NutritionTotals';
import { FoodEntry } from '../../domain/FoodEntry';
import { CoachAiConfig } from '../../domain/integration/CoachAiConfig';
import { encodePhotoArchive } from '../../domain/photos/encodePhotoArchive';
import { WaterEntry } from '../../domain/water/WaterEntry';
import { FakeDataRestorer } from '../../fixtures/FakeDataRestorer';
import { SettingsScreen } from '../../settings/SettingsScreen';
import type { AppServices } from '../../state/AppServices';
import { FakeMoveReceiver } from '../../transfer/FakeMoveReceiver';
import { FakeMoveSender } from '../../transfer/FakeMoveSender';
import { foodCopyBytes } from '../../transfer/foodCopyBytes';
import { MoveCode } from '../../transfer/MoveCode';
import type { MoveParcel } from '../../transfer/MoveParcel';
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
      parcel: {
        kind: 'everything',
        payload: { snapshot: new Uint8Array([1, 2, 3]), photos: encodePhotoArchive([photo(60), photo(30), photo(1)]), coachAi: CoachAiConfig.off },
      },
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

/** A phone with nothing on it yet: no backup to offer before the code. */
const emptyPhone: BackupContents = { ...usedPhone, hasSetup: false, weighIns: 0, foodDays: 0, workouts: 0, customFoods: 0 };

/** The longest names a lunch holds in the demo, as a copy of foods from the other phone (MM-715), one of them from its Library. */
const foodsParcel = (): MoveParcel => {
  const day = storyToday;
  const library = new CustomFood({
    id: 12,
    name: 'HARRIS TEETER, FOUR CHEESE MEXICAN BLEND, SHREDDED (Harris Teeter)',
    kind: 'food',
    servingDescription: '1/4 cup',
    servingGrams: 28,
    perServing: new NutritionTotals({ kcal: 100, proteinG: 6, carbsG: 1, fatG: 9 }),
    group: 'dairyAndYogurt',
  });
  const entries = [
    new FoodEntry({ id: 0, date: day, meal: 'lunch', name: '80/20 Ground Beef (Aldi)', kcal: 375, proteinG: 25, carbsG: 0, fatG: 29, source: 'weighed' }),
    new FoodEntry({
      id: 0,
      date: day,
      meal: 'lunch',
      name: library.name,
      kcal: 54,
      proteinG: 3,
      carbsG: 0,
      fatG: 5,
      source: 'weighed',
      portion: { method: 'weighed', basis: 'calculated', quantity: 15, unit: 'gram', origin: { packId: 'custom', foodId: 12, source: 'user' } },
    }),
    new FoodEntry({ id: 0, date: day, meal: 'lunch', name: '"Frizzle" High Heat Cooking Oil (Graza)', kcal: 118, proteinG: 0, carbsG: 0, fatG: 14, source: 'householdMeasure' }),
  ];
  return { kind: 'foods', foods: foodCopyBytes({ day, entries, water: [], foods: [library] }) };
};

/** Two drinks of the demo's day, as a copy of water from the other phone (MM-718). */
const waterParcel = (): MoveParcel => {
  const day = storyToday;
  const at = (hour: number) => new Date(day.year, day.month - 1, day.day, hour);
  const water = [new WaterEntry({ id: 0, date: day, ml: 500, at: at(7) }), new WaterEntry({ id: 0, date: day, ml: 250, at: at(10) })];
  return { kind: 'foods', foods: foodCopyBytes({ day, entries: [], water, foods: [] }) };
};

/** MM-718: a copy of water arrived: how much, in how many drinks, for which day, asked before it is added, at phone width. */
export const CopyWaterConfirm = screenStory({
  covers: ['ReceiveMoveSheet'],
  shows: 'Add water from your other phone?',
  viewport: 'smallPhone',
  device: withReceiver(new FakeMoveReceiver({ kind: 'receives', parcel: waterParcel() }), emptyPhone),
  open: openBackup,
  walk: choose('Receive on this phone'),
});

/** MM-718: "Copy to another phone" from a drink's menu: the water sent, with the copy's words for water. */
export const CopyWaterSent = screenStory({
  covers: ['SendMoveSheet'],
  shows: 'Your other phone has the water. Confirm there to add it; this phone keeps its own.',
  device: withSender(new FakeMoveSender({ kind: 'sends' })),
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const [more] = await within(canvas).findAllByRole('button', { name: /^More actions for .* of water/ });
    if (more !== undefined) await userEvent.click(more);
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Copy to another phone' }));
  },
});

/** MM-715: a copy of foods arrived: what came, for which meal and day, asked before it is added, at phone width with the longest names. */
export const CopyFoodsConfirm = screenStory({
  covers: ['ReceiveMoveSheet'],
  shows: 'Add foods from your other phone?',
  viewport: 'smallPhone',
  device: withReceiver(new FakeMoveReceiver({ kind: 'receives', parcel: foodsParcel() }), emptyPhone),
  open: openBackup,
  walk: choose('Receive on this phone'),
});

/** MM-715: the foods confirmed, the Library food that came with them is the person's call. */
export const CopyFoodsLibraryAsk = screenStory({
  covers: ['ReceiveMoveSheet'],
  shows: 'Save it to your Library?',
  viewport: 'smallPhone',
  device: withReceiver(new FakeMoveReceiver({ kind: 'receives', parcel: foodsParcel() }), emptyPhone),
  open: openBackup,
  walk: async (canvas) => {
    await choose('Receive on this phone')(canvas);
    const asks = await screen.findByRole('dialog', { name: 'Add foods from your other phone?' }, { timeout: 10000 });
    await userEvent.click(within(asks).getByRole('button', { name: 'Add' }));
  },
});

/** MM-715: "Copy to another phone" from a food's menu: the other phone's code scanned, the foods sent, with the copy's words. */
export const CopyFoodsSent = screenStory({
  covers: ['SendMoveSheet'],
  shows: 'Your other phone has the foods. Confirm there to add them; this phone keeps its own.',
  device: withSender(new FakeMoveSender({ kind: 'sends' })),
  open: ({ state }) => state.homeTab.put('food'),
  walk: async (canvas) => {
    const [more] = await within(canvas).findAllByRole('button', { name: /^More actions for/ });
    if (more !== undefined) await userEvent.click(more);
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Copy to another phone' }));
  },
});

/** MM-716: from My QR Code the code came first; a whole move arriving on a never-backed-up phone offers the backup now, at phone width. */
export const MyQrCodeBackUpOnMove = screenStory({
  covers: ['ReceiveMoveSheet'],
  shows: 'Back up this phone first?',
  viewport: 'smallPhone',
  device: withReceiver(
    new FakeMoveReceiver({
      kind: 'receives',
      parcel: { kind: 'everything', payload: { snapshot: new Uint8Array([1, 2, 3]), photos: encodePhotoArchive([]), coachAi: CoachAiConfig.off } },
    }),
  ),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: 'Menu' }, { timeout: 10000 }));
    const drawer = await screen.findByRole('dialog', { name: 'Menu' });
    await userEvent.click(within(drawer).getByRole('button', { name: 'My QR Code' }));
  },
});

/** MM-700, MM-702: confirmed, while what arrived replaces this phone's records: a bar that fills, which cannot be closed half-way. */
export const MoveApplying = screenStory({
  covers: ['MoveApplyingSheet'],
  shows: '42% in place',
  viewport: 'smallPhone',
  device: async (services) => {
    const receiver = new FakeMoveReceiver({
      kind: 'receives',
      parcel: { kind: 'everything', payload: { snapshot: new Uint8Array([1, 2, 3]), photos: encodePhotoArchive([]), coachAi: CoachAiConfig.off } },
    });
    const restorer = new FakeDataRestorer();
    restorer.toDescribe = usedPhone;
    // MM-702: part-way, as the bar fills while the rows are written.
    restorer.progressSteps = [[0, 18_400], [7_728, 18_400]];
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
