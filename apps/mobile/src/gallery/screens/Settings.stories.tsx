import type { Meta } from '@storybook/react-vite';
import { HowThisWorksScreen } from '../../about/HowThisWorksScreen';
import type { StoryStage } from './StoryStage';
import { storyPackHost } from './storyPackHost';
import { reveal } from './reveal';
import { failingWrite } from './failingWrite';
import { demoWith } from './demoWith';
import { SettingsScreen } from '../../settings/SettingsScreen';
import type { SettingsSectionId } from '../../settings/SettingsSectionId';
import { FoodDatabaseScreen } from '../../foodPacks/FoodDatabaseScreen';
import { FoodSourcesScreen } from '../../foodPacks/FoodSourcesScreen';
import { onlineFoods } from './onlineFoods';
import { DemoSeed } from '../../fixtures/DemoSeed';
import { ReminderSetting } from '../../domain/ReminderSetting';
import { screen, userEvent, within } from 'storybook/test';
import { EvidenceQuestionScreen } from '../../about/EvidenceQuestionScreen';
import { CalendarDate } from '../../domain/CalendarDate';
import { EvidenceRegister } from '../../domain/evidence/EvidenceRegister';
import { Profile } from '../../domain/Profile';
import { EditHeightSheet } from '../../settings/EditHeightSheet';
import { HealthCheckScreen } from '../../settings/HealthCheckScreen';
import { TermsScreen } from '../../terms/TermsScreen';
import { healthPlatform } from './healthPlatform';
import { onIos } from './onIos';
import { measuredBodyFatScenario } from './measuredBodyFatScenario';
import { BackupFile } from '../../backup/BackupFile';
import { SodiumBackupCipher } from '../../backup/SodiumBackupCipher';
import { FakeBackupPlatform } from '../../backup/FakeBackupPlatform';
import { FakeDataRestorer } from '../../fixtures/FakeDataRestorer';
import { SqlRepositories } from '../../data/SqlRepositories';
import { WasmSqlDatabase } from '../../sql/wasm/WasmSqlDatabase';
import { typicalSetup } from '../../fixtures/typicalSetup';
import { storyToday } from './storyToday';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';

/**
 * Everything the person set up and can change, and what the app says about
 * itself. Before MM-259 (main at 9fb8c79, 2026-10-13) twelve groups mixing
 * chips, segments, sliders and rows; after, sections of rows in the order
 * of use, every row with its icon, erase last.
 */
const meta = { title: 'Screens/Settings', ...screensMeta } satisfies Meta;
export default meta;

export const Settings = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Today’s setup',
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen />),
});

/** MM-396: Today's setup opened: the Net carbs switch, on, under Nutrition detail. */
export const NetCarbsSwitch = screenStory({
  covers: ['SettingsScreen'],
  shows: /^Carbs less fiber and sugar alcohols, against the same carb target./,
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="todaysSetup" />),
});

/** MM-396: switched off, the row says what is shown instead. */
export const NetCarbsSwitchedOff = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Total carbs, as on the label.',
  scenario: demoWith({ then: async (repos) => repos.preferences.saveNetCarbs(false) }),
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="todaysSetup" />),
});

/** MM-240: both sliders, each in a row at the row's inset. */
export const MeasuredBodyFat = screenStory({
  covers: ['SettingsScreen'],
  shows: /About 22%/,
  scenario: measuredBodyFatScenario,
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="todaysSetup" />),
});

export const EditHeight = screenStory({
  covers: ['EditHeightSheet'],
  shows: 'Height',
  open: ({ navigator, overlays }) => {
    void navigator.push(() => <SettingsScreen open="profile" />);
    void overlays.sheet<void>('Height', (close) => (
      <EditHeightSheet initialCm={180} imperial onSave={() => close()} />
    ));
  },
});

/** MM-268: a choice in Settings is the options dialog, with the value in force marked Chosen. */
export const ChangeDailyActivity = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Chosen',
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="todaysSetup" />),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: 'Change daily activity' }));
  },
});

/** MM-263: the design system's own calendar inside a dialog, with the day said back in words. */
export const DateOfBirth = screenStory({
  covers: ['SettingsScreen'],
  shows: 'January 1, 1996',
  open: ({ navigator, overlays }) => {
    void navigator.push(() => <SettingsScreen open="profile" />);
    void overlays.date({
      helpText: 'Date of birth',
      initial: CalendarDate.of(1996, 1, 1),
      first: CalendarDate.of(1926, 1, 1),
      last: CalendarDate.of(2008, 10, 12),
      today: CalendarDate.of(2008, 10, 12),
    });
  },
});

export const HealthCheck = screenStory({
  covers: ['HealthCheckScreen'],
  shows: 'Health check',
  open: ({ navigator }) => void navigator.push(() => <HealthCheckScreen />),
});

export const FoodDatabase = screenStory({
  covers: ['FoodDatabaseScreen'],
  shows: 'Food database',
  open: ({ navigator }) => void navigator.push(() => <FoodDatabaseScreen />),
});

/** MM-57, MM-58: where the food data comes from, its licences, and what the app sends online, on a phone that can ask Open Food Facts with a pack installed. */
export const FoodSources = screenStory({
  covers: ['FoodSourcesScreen'],
  shows: 'Food data sources',
  device: async (services) => onlineFoods()(await storyPackHost({ installed: '2026-10-09' })(services)),
  open: ({ navigator }) => void navigator.push(() => <FoodSourcesScreen />),
});

/** MM-58: the same screen in a build with no online source and nothing downloaded: nothing is ever sent. */
export const FoodSourcesNoneOnline = screenStory({
  covers: ['FoodSourcesScreen'],
  shows: /no online source, so nothing is ever sent/,
  open: ({ navigator }) => void navigator.push(() => <FoodSourcesScreen />),
});

/** MM-242: the terms, to read again, with the day they were agreed to. */
export const TermsOfUse = screenStory({
  covers: ['TermsScreen'],
  shows: 'Before you start',
  open: ({ navigator }) => void navigator.push(() => <TermsScreen />),
});

export const HowThisWorks = screenStory({
  covers: ['HowThisWorksScreen'],
  shows: 'How this works',
  open: ({ navigator }) => void navigator.push(() => <HowThisWorksScreen />),
});

/** Waits for the question's own screen (MM-321: `/./` matched before it was pushed, so it was drawn or not by chance). */
export const EvidenceQuestion = screenStory({
  covers: ['EvidenceQuestionScreen'],
  shows: 'The rules behind this',
  open: async ({ services, navigator }) => {
    const [question] = EvidenceRegister.parse(await services.evidence()).questions;
    if (question !== undefined) void navigator.push(() => <EvidenceQuestionScreen question={question} />);
  },
});

/** MM-311, MM-313: both goals switched on, each with its amount in the row below. */
export const NutritionGoals = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Daily sodium limit',
  scenario: demoWith({ sodiumLimitMg: 2300, waterGoalMl: 2000 }),
  about: ['waterGoal'],
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="nutritionGoals" />),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Daily water goal'));
  },
});

/** MM-311, MM-358: the section as a new installation has it: no sodium limit, the water goal on and suggested. */
export const NutritionGoalsSuggested = screenStory({
  covers: ['SettingsScreen'],
  shows: /^Suggested from your protein target and training./,
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="nutritionGoals" />),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Daily water goal'));
  },
});

/** MM-311: a limit under 1,500 mg, refused with the range (the panel's UX-4). */
export const SodiumLimitRefused = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Daily sodium limit',
  scenario: demoWith({ sodiumLimitMg: 2300 }),
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="nutritionGoals" />),
  walk: async (canvas) => {
    const field = await within(canvas).findByRole('textbox', { name: 'Daily sodium limit, milligrams' });
    await userEvent.clear(field);
    await userEvent.type(field, '800');
    await userEvent.click(within(canvas).getByRole('button', { name: 'Save sodium limit' }));
    reveal(field);
  },
});

/** MM-311, MM-313: with kidney disease, both switches say a care team may set these (the panel's SA-5). */
export const NutritionGoalsKidney = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Daily water goal',
  scenario: demoWith({ screening: { chronicKidneyDisease: true } }),
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="nutritionGoals" />),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Daily water goal'));
  },
});

/** MM-358, MM-359: a clinician limits what the person drinks: nothing is suggested, and the reason is said. */
export const WaterGoalCareTeam = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Your clinician limits your fluids.',
  scenario: demoWith({ screening: { fluidLimitedByClinician: true } }),
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="nutritionGoals" />),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Daily water goal'));
  },
});

/** MM-358: switched on with a clinician's limit: the amount their care team gave them is asked for. */
export const WaterGoalCareTeamAmount = screenStory({
  covers: ['SettingsScreen'],
  shows: /^Only if your clinician gave you an amount of water to drink./,
  scenario: demoWith({ screening: { fluidLimitedByClinician: true } }),
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="nutritionGoals" />),
  walk: async (canvas) => {
    const toggle = await within(canvas).findByRole('switch', { name: /^Daily water goal/ });
    reveal(toggle);
    await userEvent.click(toggle);
  },
});

/** MM-358: their own amount, with the way back to the suggestion. */
export const WaterGoalOwnAmount = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Use the suggested amount',
  scenario: demoWith({ waterGoalMl: 3000 }),
  about: ['waterGoal'],
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="nutritionGoals" />),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Use the suggested amount'));
  },
});

/** MM-358: back from their own amount to the suggestion: the field holds it, with focus on it. */
export const WaterGoalBackToSuggested = screenStory({
  covers: ['SettingsScreen'],
  shows: /^Suggested from your protein target and training./,
  scenario: demoWith({ waterGoalMl: 3000 }),
  about: ['waterGoal'],
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="nutritionGoals" />),
  walk: async (canvas) => {
    const back = await within(canvas).findByRole('button', { name: /^Use the suggested amount/ });
    reveal(back);
    await userEvent.click(back);
    await within(canvas).findByText(/^Suggested from your protein target/);
  },
});

/** MM-313: a goal above 4 L (169 fl oz) carries a plain note (owner, 2026-10-14; the panel's SA-5). Only the goal differs (MM-357). */
export const WaterGoalHigh = screenStory({
  covers: ['SettingsScreen'],
  shows: /More than most people need/,
  scenario: demoWith({ waterGoalMl: 5000 }),
  about: ['waterGoal'],
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="nutritionGoals" />),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText(/More than most people need/));
  },
});

/** Settings with one section open (MM-398): the stories about a row open the section it is in. */
const settingsAt =
  (open: SettingsSectionId) =>
  ({ navigator }: Parameters<NonNullable<Parameters<typeof screenStory>[0]['open']>>[0]) =>
    void navigator.push(() => <SettingsScreen open={open} />);

/** MM-320: a phone without Health Connect: one row says so. */
export const HealthConnectAbsent = screenStory({
  covers: ['SettingsScreen'],
  shows: /Health Connect is not on this phone/,
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText(/Health Connect is not on this phone/));
  },
});

/** MM-320: Health Connect on the phone and nothing allowed yet: a row for each kind, and the note. */
export const HealthConnectNoneAllowed = screenStory({
  covers: ['SettingsScreen'],
  shows: /The app only reads/,
  device: healthPlatform(),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Exercise sessions'));
  },
});

/** MM-320: weight and steps allowed and read; the rest offered; "Read from Health Connect now". */
export const HealthConnectSomeAllowed = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Read from Health Connect now',
  device: healthPlatform({ allowed: ['weight', 'steps'] }),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Exercise sessions'));
  },
});

/** MM-320: for a woman, menstruation is offered too (MM-68). */
export const HealthConnectWoman = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Menstruation',
  scenario: demoWith({
    then: async (repos) => {
      const setup = (await repos.setup.loadSetup())!;
      const { birthDate, heightCm } = setup.profile;
      await repos.setup.saveSetup(setup.copyWith({ profile: new Profile({ sex: 'female', birthDate, heightCm }) }));
    },
  }),
  device: healthPlatform(),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Menstruation'));
  },
});

/** MM-320: a kind turned down when asked: the row stays offered and a snack says where to allow it. */
export const HealthConnectRefused = screenStory({
  covers: ['SettingsScreen'],
  shows: /Weight was not allowed/,
  device: healthPlatform({ refuses: ['weight'] }),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    const weight = await within(canvas).findByRole('button', { name: /^Weight/ });
    reveal(weight);
    await userEvent.click(weight);
  },
});

/** MM-320: Health Connect could not be read: a snack says so, and nothing kept changes. */
export const HealthConnectReadFailed = screenStory({
  covers: ['SettingsScreen'],
  shows: /could not be read just now/,
  device: healthPlatform({ allowed: ['weight'], unreadable: true }),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    const read = await within(canvas).findByRole('button', { name: 'Read from Health Connect now' });
    reveal(read);
    await userEvent.click(read);
  },
});

/** MM-320 (the panel's UX-8): weight allowed with nothing in it yet. */
export const HealthConnectNothingYet = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Allowed. Nothing to read yet.',
  device: healthPlatform({ allowed: ['weight'], empty: ['weight'] }),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Exercise sessions'));
  },
});

/** MM-395: steps the phone counted itself come with no app name: the row says how many, never the package. */
export const HealthConnectUnnamedSource = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Allowed. 3 readings.',
  device: healthPlatform({ allowed: ['steps'], stepsUnnamed: true }),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Steps'));
  },
});

/** MM-320 (the panel's UX-8): every kind allowed; nothing left to offer. */
export const HealthConnectAllAllowed = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Read from Health Connect now',
  device: healthPlatform({ allowed: ['weight', 'bodyFat', 'leanMass', 'height', 'workout', 'steps'] }),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Exercise sessions'));
  },
});

/** MM-320 (the panel's UX-3): a kind allowed; its row stops being a button, so a snack says so. */
export const HealthConnectAllowing = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Weight allowed.',
  device: healthPlatform(),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    const weight = await within(canvas).findByRole('button', { name: /^Weight/ });
    reveal(weight);
    await userEvent.click(weight);
  },
});

/** MM-320 (the panel's UX-6): "Read from Health Connect now" says when it is done. */
export const HealthConnectReadDone = screenStory({
  covers: ['SettingsScreen'],
  shows: /Everything allowed is up to date/,
  device: healthPlatform({ allowed: ['weight'] }),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    const read = await within(canvas).findByRole('button', { name: 'Read from Health Connect now' });
    reveal(read);
    await userEvent.click(read);
  },
});

/** MM-71: weigh-ins from two scales: the primary scale row, chosen automatically as the one used most. */
export const HealthConnectTwoScales = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Automatic: Bathroom scale, with the most weigh-ins in 30 days.',
  device: healthPlatform({ allowed: ['weight'], secondScale: true }),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Primary scale'));
  },
});

/** MM-71: the gym's scale chosen as primary in Settings: its weigh-ins count first from now on. */
export const HealthConnectPrimaryScaleChosen = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Gym scale. Its weigh-ins count before any other source’s.',
  device: healthPlatform({ allowed: ['weight'], secondScale: true }),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    const change = await within(canvas).findByRole('button', { name: 'Change primary scale' });
    reveal(change);
    await userEvent.click(change);
    await userEvent.click(await within(canvas.ownerDocument.body).findByRole('option', { name: 'Gym scale' }));
  },
});

/** MM-71: choosing a primary scale and the save failing: it says so and keeps the one in force. */
export const HealthConnectPrimaryScaleFails = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Your primary scale could not be saved. Nothing was changed.',
  device: healthPlatform({ allowed: ['weight'], secondScale: true }),
  stores: failingWrite('preferences', 'savePrimaryScale'),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    const change = await within(canvas).findByRole('button', { name: 'Change primary scale' });
    reveal(change);
    await userEvent.click(change);
    await userEvent.click(await within(canvas.ownerDocument.body).findByRole('option', { name: 'Gym scale' }));
  },
});

// ---- MM-321: Settings and the food packs, in the states no story drew ----

const openFoodDatabase = ({ navigator }: StoryStage) => void navigator.push(() => <FoodDatabaseScreen />);

/** Presses the button named `name` anywhere on the page (sheets sit outside the canvas), once it is there. */
const pressAnywhere = (name: string | RegExp) => async (canvas: HTMLElement) => {
  const button = await within(canvas.ownerDocument.body).findByRole('button', { name }, { timeout: 8000 });
  reveal(button);
  await userEvent.click(button);
};

/** MM-321: each row of Settings that opens a screen, opened. */
export const SettingsOpensFoodDatabase = screenStory({
  covers: ['SettingsScreen', 'FoodDatabaseScreen'],
  shows: 'See what is available',
  device: storyPackHost(),
  open: settingsAt('data'),
  walk: pressAnywhere(/^Food database/),
});

export const SettingsOpensHowThisWorks = screenStory({
  covers: ['SettingsScreen', 'HowThisWorksScreen'],
  shows: 'How this works',
  open: settingsAt('about'),
  walk: pressAnywhere(/^How this works/),
});

/** MM-63: Settings > Backup before any backup was made. */
export const SettingsBackupNever = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Back up now',
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="backup" />),
});

/** MM-63: a backup was made; its day is shown. */
export const SettingsBackedUp = screenStory({
  covers: ['SettingsScreen'],
  shows: /^Last backup/,
  scenario: demoWith({ then: async (repos, today) => repos.preferences.saveLastBackupOn(today.addDays(-3)) }),
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="backup" />),
});

/** MM-63: the passphrase asked for a new backup, twice, with its warning. */
export const SettingsBackupPassphrase = screenStory({
  covers: ['SettingsScreen', 'PassphraseSheet'],
  shows: /If you lose it/,
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="backup" />),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Back up now/ }, { timeout: 10000 }));
  },
});

/** MM-63: the passphrase of a backup being restored, after a wrong one. */
export const SettingsRestorePassphraseWrong = screenStory({
  covers: ['SettingsScreen', 'PassphraseSheet'],
  shows: 'That passphrase does not open this backup.',
  device: async (services) => {
    const backup = new FakeBackupPlatform();
    backup.toPick = await BackupFile.write(new Uint8Array([1, 2, 3]), 'the right one', { schemaVersion: 10, createdOn: '2026-10-12' }, new SodiumBackupCipher());
    return { ...services, backup };
  },
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="backup" />),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Restore from a backup/ }, { timeout: 10000 }));
    const sheet = await screen.findByRole('dialog', { name: 'The backup’s passphrase' }, { timeout: 10000 });
    await userEvent.type(within(sheet).getByLabelText('Passphrase'), 'the wrong one');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Open' }));
  },
});

/** MM-63: the two passphrases differ once the second is long enough to be wrong. */
export const SettingsBackupMismatch = screenStory({
  covers: ['SettingsScreen', 'PassphraseSheet'],
  shows: 'The two do not match.',
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="backup" />),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Back up now/ }, { timeout: 10000 }));
    const sheet = await screen.findByRole('dialog', { name: 'A passphrase for this backup' }, { timeout: 10000 });
    await userEvent.type(within(sheet).getByLabelText('Passphrase'), 'correct horse battery');
    await userEvent.type(within(sheet).getByLabelText('Passphrase again'), 'correct horse batterx');
  },
});

/** MM-63: sealing the backup, which takes about a second: the row says so and stays a button. */
export const SettingsBackingUp = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Backing up…',
  device: async (services) => ({ ...services, backup: new FakeBackupPlatform(() => new Promise<Uint8Array>(() => undefined)) }),
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="backup" />),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Back up now/ }, { timeout: 10000 }));
    const sheet = await screen.findByRole('dialog', { name: 'A passphrase for this backup' }, { timeout: 10000 });
    await userEvent.type(within(sheet).getByLabelText('Passphrase'), 'correct horse battery');
    await userEvent.type(within(sheet).getByLabelText('Passphrase again'), 'correct horse battery');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Back up' }));
  },
});

/** MM-63: the right passphrase; what the backup holds and what a restore replaces, asked before anything changes. */
export const SettingsRestoreAsks = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Restore this backup?',
  device: async (services) => {
    const backup = new FakeBackupPlatform();
    const db = await WasmSqlDatabase.open();
    const sql = await SqlRepositories.open(db);
    await sql.setup.saveSetup(typicalSetup({ onboardedOn: storyToday.addDays(-40), healthCheckConfirmedOn: storyToday }));
    await sql.weights.saveWeight(storyToday.addDays(-9), 82.4);
    await sql.weights.saveWeight(storyToday.addDays(-8), 82.1);
    backup.toPick = await BackupFile.write(await db.exportBytes(), 'correct horse battery', { schemaVersion: 10, createdOn: storyToday.addDays(-8).toString() }, new SodiumBackupCipher());
    const restorer = new FakeDataRestorer();
    restorer.toDescribe = { weighIns: 2, foodDays: 0, workouts: 0, customFoods: 0, from: storyToday.addDays(-9), to: storyToday.addDays(-8), hasSetup: true };
    restorer.here = { weighIns: 71, foodDays: 58, workouts: 12, customFoods: 3, from: storyToday.addDays(-70), to: storyToday, hasSetup: true };
    return { ...services, backup, restorer };
  },
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen open="backup" />),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Restore from a backup/ }, { timeout: 10000 }));
    const sheet = await screen.findByRole('dialog', { name: 'The backup’s passphrase' }, { timeout: 10000 });
    await userEvent.type(within(sheet).getByLabelText('Passphrase'), 'correct horse battery');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Open' }));
  },
});

export const SettingsOpensPause = screenStory({
  covers: ['SettingsScreen', 'PauseScreen'],
  shows: 'Reason',
  open: settingsAt('todaysSetup'),
  walk: pressAnywhere(/^Pause/),
});

export const SettingsOpensTerms = screenStory({
  covers: ['SettingsScreen', 'TermsScreen'],
  shows: 'Terms of use',
  open: settingsAt('about'),
  walk: pressAnywhere(/^Terms of use/),
});

export const SettingsOpensHealthCheck = screenStory({
  covers: ['SettingsScreen', 'HealthCheckScreen'],
  shows: 'Health check',
  open: settingsAt('profile'),
  walk: pressAnywhere(/^Health check/),
});

/** MM-321: the experience, nutrition detail and units pickers. */
export const ChangeExperience = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Experience',
  open: settingsAt('todaysSetup'),
  walk: pressAnywhere('Change experience'),
});

export const ChangeNutritionDetail = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Nutrition detail',
  open: settingsAt('todaysSetup'),
  walk: pressAnywhere('Change nutrition detail'),
});

export const ChangeUnits = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Units',
  open: settingsAt('appearance'),
  walk: pressAnywhere('Change units'),
});

/** MM-321: the height pressed in metric: centimetres, and Cancel. */
export const ChangeHeightMetric = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Centimetres',
  scenario: demoWith({ units: 'metric' }),
  about: ['units'],
  open: settingsAt('profile'),
  walk: pressAnywhere(/^Height/),
});

/** MM-321: a reminder switched on shows the time it comes at. */
export const ReminderOn = screenStory({
  covers: ['SettingsScreen'],
  shows: /^At /,
  scenario: async (repos, today) => {
    await new DemoSeed(today).replace(repos);
    await repos.reminders.saveReminder(new ReminderSetting({ kind: 'weighIn', minuteOfDay: 7 * 60, enabled: true }));
  },
  open: settingsAt('reminders'),
});

/** MM-321: a new look chosen, and the save failing: it says so and keeps the old one. */
export const ChangeAppearanceFails = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Your appearance could not be saved. Nothing was changed.',
  stores: failingWrite('preferences', 'saveThemePreference'),
  open: settingsAt('appearance'),
  walk: async (canvas) => {
    await pressAnywhere('Change appearance')(canvas);
    // An option by its role: in Light the row's own subtitle also says "Light".
    await userEvent.click(await within(canvas.ownerDocument.body).findByRole('option', { name: 'Dark' }));
  },
});

/** MM-321: the list of packs being fetched. */
export const FoodDatabaseChecking = screenStory({
  covers: ['FoodDatabaseScreen'],
  shows: 'Food database',
  device: storyPackHost({ checking: true }),
  open: openFoodDatabase,
  walk: pressAnywhere('See what is available'),
});

/** MM-321: the pack the host offers, with its size. */
export const FoodDatabaseAvailable = screenStory({
  covers: ['FoodDatabaseScreen'],
  shows: 'Barcode foods, United States',
  device: storyPackHost(),
  open: openFoodDatabase,
  walk: pressAnywhere('See what is available'),
});

const download = async (canvas: HTMLElement) => {
  await pressAnywhere('See what is available')(canvas);
  await pressAnywhere(/^Download Barcode foods/)(canvas);
};

/** MM-321: halfway down a slow connection, with Cancel. */
export const FoodDatabaseDownloading = screenStory({
  covers: ['FoodDatabaseScreen'],
  shows: /^Downloading ·/,
  device: storyPackHost({ stall: true }),
  open: openFoodDatabase,
  walk: download,
});

/** MM-321: a download cancelled halfway: kept, to resume or discard. */
export const FoodDatabasePaused = screenStory({
  covers: ['FoodDatabaseScreen'],
  shows: /^Paused ·/,
  device: storyPackHost({ stall: true }),
  open: openFoodDatabase,
  walk: async (canvas) => {
    await download(canvas);
    await within(canvas.ownerDocument.body).findByText(/^Downloading ·/, undefined, { timeout: 8000 });
    // The card's Cancel, not the strip's.
    const [cancel] = within(canvas.ownerDocument.body).getAllByRole('button', { name: /^Cancel downloading/ });
    if (cancel !== undefined) await userEvent.click(cancel);
  },
});

/** MM-321: a download that does not check out: thrown away, nothing changed. */
export const FoodDatabaseFailed = screenStory({
  covers: ['FoodDatabaseScreen'],
  shows: /thrown away/,
  device: storyPackHost({ corrupt: true }),
  open: openFoodDatabase,
  walk: download,
});

/** MM-321: the pack downloaded and installed, listed with its foods. */
export const FoodDatabaseInstalled = screenStory({
  covers: ['FoodDatabaseScreen'],
  shows: 'Remove',
  device: storyPackHost(),
  open: openFoodDatabase,
  walk: download,
});

/** MM-346: back with the pack at the listed version: it is said once, and nothing is offered again. */
export const FoodDatabaseUpToDate = screenStory({
  covers: ['FoodDatabaseScreen'],
  shows: 'Nothing new to download',
  device: storyPackHost({ installed: '2026-10-09', only: 'barcode_us' }),
  open: openFoodDatabase,
  walk: pressAnywhere('See what is available'),
});

/** MM-346: a newer version listed than the one on the phone: it is offered as an update. */
export const FoodDatabaseUpdate = screenStory({
  covers: ['FoodDatabaseScreen'],
  shows: /version 2026-10-16/,
  device: storyPackHost({ installed: '2026-10-09', listed: '2026-10-16', only: 'barcode_us' }),
  open: openFoodDatabase,
  walk: pressAnywhere('See what is available'),
});

/** MM-321: a download going on under the Dashboard: the strip with Cancel. */
export const DownloadUnderTheDashboard = screenStory({
  covers: ['FoodDatabaseScreen', 'DashboardScreen'],
  shows: /^Downloading Barcode foods/,
  device: storyPackHost({ stall: true }),
  open: openFoodDatabase,
  walk: async (canvas) => {
    await download(canvas);
    await within(canvas.ownerDocument.body).findByText(/^Downloading ·/, undefined, { timeout: 8000 });
    await pressAnywhere('Back')(canvas);
  },
});

/** MM-384: both packs downloading at once, each with its own card, and a strip line for each. */
export const FoodDatabaseTwoDownloading = screenStory({
  covers: ['FoodDatabaseScreen'],
  shows: /^Downloading Common foods/,
  device: storyPackHost({ stall: true }),
  open: openFoodDatabase,
  walk: async (canvas) => {
    await pressAnywhere('See what is available')(canvas);
    await pressAnywhere(/^Download Common foods/)(canvas);
    await pressAnywhere(/^Download Barcode foods/)(canvas);
    await within(canvas.ownerDocument.body).findAllByText(/^Downloading Barcode foods/, undefined, { timeout: 8000 });
  },
});

/** MM-384: one pack on the phone while the other is still coming down. */
export const FoodDatabaseOneDone = screenStory({
  covers: ['FoodDatabaseScreen'],
  shows: 'Common foods is on your phone.',
  device: storyPackHost({ stall: 'barcode_us' }),
  open: openFoodDatabase,
  walk: async (canvas) => {
    await pressAnywhere('See what is available')(canvas);
    await pressAnywhere(/^Download Barcode foods/)(canvas);
    await within(canvas.ownerDocument.body).findAllByText(/^Downloading Barcode foods/, undefined, { timeout: 8000 });
    // The host stalls only the barcode pack; the common foods come down whole.
    await pressAnywhere(/^Download Common foods/)(canvas);
    await within(canvas.ownerDocument.body).findByText('Common foods is on your phone.', undefined, { timeout: 8000 });
  },
});

/** MM-385: removing an installed pack asks first, and the finished notice goes with the pack. */
export const FoodDatabaseRemoving = screenStory({
  covers: ['FoodDatabaseScreen'],
  shows: 'Remove this food database?',
  device: storyPackHost({ only: 'barcode_us' }),
  open: openFoodDatabase,
  walk: async (canvas) => {
    await download(canvas);
    await within(canvas.ownerDocument.body).findByText('Barcode foods, United States is on your phone.', undefined, { timeout: 8000 });
    await pressAnywhere(/^Remove/)(canvas);
  },
});

/** MM-384: two downloads going on under the Dashboard: two strip lines, each with its Cancel. */
export const TwoDownloadsUnderTheDashboard = screenStory({
  covers: ['FoodDatabaseScreen', 'DashboardScreen'],
  shows: /^Downloading Common foods/,
  device: storyPackHost({ stall: true }),
  open: openFoodDatabase,
  walk: async (canvas) => {
    await pressAnywhere('See what is available')(canvas);
    await pressAnywhere(/^Download Common foods/)(canvas);
    await pressAnywhere(/^Download Barcode foods/)(canvas);
    await within(canvas.ownerDocument.body).findAllByText(/^Downloading Barcode foods/, undefined, { timeout: 8000 });
    await pressAnywhere('Back')(canvas);
  },
});

/** MM-321: the host does not answer: it says so, and that nothing changed. */
export const FoodDatabaseUnreachable = screenStory({
  covers: ['FoodDatabaseScreen'],
  shows: /Nothing was changed./,
  device: storyPackHost({ down: true }),
  open: openFoodDatabase,
  walk: pressAnywhere('See what is available'),
});

/** MM-321: the evidence register could not be read. */
export const HowThisWorksFailed = screenStory({
  covers: ['HowThisWorksScreen'],
  shows: 'This could not be loaded.',
  stores: (services) => ({ ...services, evidence: () => Promise.reject(new Error('The register failed, as the story asks')) }),
  open: ({ navigator }) => void navigator.push(() => <HowThisWorksScreen />),
});

/** MM-321: a question pressed opens the rules behind it, and a rule pressed opens its source. */
export const HowThisWorksOpensARule = screenStory({
  covers: ['HowThisWorksScreen', 'EvidenceQuestionScreen'],
  shows: /^Source: /,
  open: ({ navigator }) => void navigator.push(() => <HowThisWorksScreen />),
  walk: async (canvas) => {
    const body = within(canvas.ownerDocument.body);
    const [question] = await body.findAllByRole('button', { name: /\?$/ }, { timeout: 8000 });
    if (question !== undefined) await userEvent.click(question);
    await body.findByText('The rules behind this', undefined, { timeout: 8000 });
    const rule = canvas.ownerDocument.querySelector<HTMLElement>('.about-rule');
    if (rule !== null) await userEvent.click(rule);
  },
});

/** MM-321: a reminder's time pressed opens the time of day to choose. */
export const ReminderTimeOpens = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Weigh-in reminder',
  scenario: async (repos, today) => {
    await new DemoSeed(today).replace(repos);
    await repos.reminders.saveReminder(new ReminderSetting({ kind: 'weighIn', minuteOfDay: 7 * 60, enabled: true }));
  },
  open: settingsAt('reminders'),
  walk: pressAnywhere(/^At 7:00/),
});

/** MM-69: a phone whose Apple Health is off: nothing to connect, said by the platform's name. */
export const AppleHealthNotOnThisPhone = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Apple Health is not on this phone',
  device: onIos(),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Apple Health is not on this phone'));
  },
});

/** MM-69: Apple Health on an iPhone and nothing asked for yet: each kind "not asked yet", never "not allowed". */
export const AppleHealthNoneAsked = screenStory({
  covers: ['SettingsScreen'],
  shows: /Not asked yet/,
  device: onIos(healthPlatform()),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Exercise sessions'));
  },
});

/** MM-69: weight and steps asked for and read; the rest offered; "Read from Apple Health now". */
export const AppleHealthSomeAsked = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Read from Apple Health now',
  device: onIos(healthPlatform({ allowed: ['weight', 'steps'] })),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Exercise sessions'));
  },
});

/** MM-69: weight asked for with nothing found: Apple Health never says it was refused, so the row says where to check. */
export const AppleHealthNothingFound = screenStory({
  covers: ['SettingsScreen'],
  shows: /Nothing found in Apple Health yet/,
  device: onIos(healthPlatform({ allowed: ['weight'], empty: ['weight'] })),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Exercise sessions'));
  },
});

/** MM-69: Apple Health could not be read: a snack says so, and nothing kept changes. */
export const AppleHealthReadFailed = screenStory({
  covers: ['SettingsScreen'],
  shows: /could not be read just now/,
  device: onIos(healthPlatform({ allowed: ['weight'], unreadable: true })),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    const read = await within(canvas).findByRole('button', { name: 'Read from Apple Health now' });
    reveal(read);
    await userEvent.click(read);
  },
});

/** MM-69 (the panel's PD-5): a kind asked for and read; its row stops being a button, so a snack says what was read. */
export const AppleHealthAsking = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Weight read from Apple Health.',
  device: onIos(healthPlatform()),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    const weight = await within(canvas).findByRole('button', { name: /^Weight/ });
    reveal(weight);
    await userEvent.click(weight);
  },
});

/** MM-69 (the panel's F3): "Read from Apple Health now" says when it is done, of what was asked for. */
export const AppleHealthReadDone = screenStory({
  covers: ['SettingsScreen'],
  shows: /Everything asked for is up to date/,
  device: onIos(healthPlatform({ allowed: ['weight'] })),
  open: settingsAt('healthConnect'),
  walk: async (canvas) => {
    const read = await within(canvas).findByRole('button', { name: 'Read from Apple Health now' });
    reveal(read);
    await userEvent.click(read);
  },
});

/** MM-58: Settings, Data, with the online lookup row a build with a source shows, and its choice. */
export const SettingsOnlineLookup = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Look foods up online',
  device: onlineFoods(),
  open: settingsAt('data'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Look foods up online'));
    await userEvent.click(await within(canvas).findByRole('button', { name: 'Change online lookup' }));
  },
});

/** MM-57: Settings, Data, opens where the food data comes from. */
export const SettingsOpensFoodSources = screenStory({
  covers: ['SettingsScreen', 'FoodSourcesScreen'],
  shows: 'The sources',
  open: settingsAt('data'),
  walk: pressAnywhere(/^Food data sources/),
});

/** MM-57: the Food database screen cites its sources with a row that opens them. */
export const FoodDatabaseOpensSources = screenStory({
  covers: ['FoodDatabaseScreen', 'FoodSourcesScreen'],
  shows: 'The sources',
  open: ({ navigator }) => void navigator.push(() => <FoodDatabaseScreen />),
  walk: pressAnywhere(/^Food data sources/),
});
