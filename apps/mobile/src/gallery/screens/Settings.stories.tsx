import type { Meta } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import { EvidenceQuestionScreen } from '../../about/EvidenceQuestionScreen';
import { HowThisWorksScreen } from '../../about/HowThisWorksScreen';
import { CalendarDate } from '../../domain/CalendarDate';
import { EvidenceRegister } from '../../domain/evidence/EvidenceRegister';
import { Profile } from '../../domain/Profile';
import { FoodDatabaseScreen } from '../../foodPacks/FoodDatabaseScreen';
import { EditHeightSheet } from '../../settings/EditHeightSheet';
import { HealthCheckScreen } from '../../settings/HealthCheckScreen';
import { SettingsScreen } from '../../settings/SettingsScreen';
import { TermsScreen } from '../../terms/TermsScreen';
import { demoWith } from './demoWith';
import { healthPlatform } from './healthPlatform';
import { measuredBodyFatScenario } from './measuredBodyFatScenario';
import { screensMeta } from './screensMeta';
import { reveal } from './reveal';
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

/** MM-240: both sliders, each in a row at the row's inset. */
export const MeasuredBodyFat = screenStory({
  covers: ['SettingsScreen'],
  shows: /About 22%/,
  scenario: measuredBodyFatScenario,
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen />),
});

export const EditHeight = screenStory({
  covers: ['EditHeightSheet'],
  shows: 'Height',
  open: ({ navigator, overlays }) => {
    void navigator.push(() => <SettingsScreen />);
    void overlays.sheet<void>('Height', (close) => (
      <EditHeightSheet initialCm={180} imperial onSave={() => close()} />
    ));
  },
});

/** MM-268: a choice in Settings is the options dialog, with the value in force marked Chosen. */
export const ChangeDailyActivity = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Chosen',
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen />),
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: 'Change daily activity' }));
  },
});

/** MM-263: the design system's own calendar inside a dialog, with the day said back in words. */
export const DateOfBirth = screenStory({
  covers: ['SettingsScreen'],
  shows: 'January 1, 1996',
  open: ({ navigator, overlays }) => {
    void navigator.push(() => <SettingsScreen />);
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
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen />),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Daily water goal'));
  },
});

/** MM-311: the section as a new installation has it: both off. */
export const NutritionGoalsOff = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Daily water goal',
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen />),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Daily water goal'));
  },
});

/** MM-311: a limit under 1,500 mg, refused with the range (the panel's UX-4). */
export const SodiumLimitRefused = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Daily sodium limit',
  scenario: demoWith({ sodiumLimitMg: 2300 }),
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen />),
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
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen />),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Daily water goal'));
  },
});

/** MM-313: a goal above 4 L carries a plain note (owner, 2026-10-14; the panel's SA-5). */
export const WaterGoalHigh = screenStory({
  covers: ['SettingsScreen'],
  shows: /More than most people need/,
  scenario: demoWith({ units: 'metric', waterGoalMl: 5000 }),
  open: ({ navigator }) => void navigator.push(() => <SettingsScreen />),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText(/More than most people need/));
  },
});

const settings = ({ navigator }: Parameters<NonNullable<Parameters<typeof screenStory>[0]['open']>>[0]) =>
  void navigator.push(() => <SettingsScreen />);

/** MM-320: a phone without Health Connect: one row says so. */
export const HealthConnectAbsent = screenStory({
  covers: ['SettingsScreen'],
  shows: /Health Connect is not on this phone/,
  open: settings,
  walk: async (canvas) => {
    reveal(await within(canvas).findByText(/Health Connect is not on this phone/));
  },
});

/** MM-320: Health Connect on the phone and nothing allowed yet: a row for each kind, and the note. */
export const HealthConnectNoneAllowed = screenStory({
  covers: ['SettingsScreen'],
  shows: /The app only reads/,
  device: healthPlatform(),
  open: settings,
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Exercise sessions'));
  },
});

/** MM-320: weight and steps allowed and read; the rest offered; "Read from Health Connect now". */
export const HealthConnectSomeAllowed = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Read from Health Connect now',
  device: healthPlatform({ allowed: ['weight', 'steps'] }),
  open: settings,
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
  open: settings,
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Menstruation'));
  },
});

/** MM-320: a kind turned down when asked: the row stays offered and a snack says where to allow it. */
export const HealthConnectRefused = screenStory({
  covers: ['SettingsScreen'],
  shows: /Weight was not allowed/,
  device: healthPlatform({ refuses: ['weight'] }),
  open: settings,
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
  open: settings,
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
  open: settings,
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Exercise sessions'));
  },
});

/** MM-320 (the panel's UX-8): every kind allowed; nothing left to offer. */
export const HealthConnectAllAllowed = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Read from Health Connect now',
  device: healthPlatform({ allowed: ['weight', 'bodyFat', 'leanMass', 'height', 'workout', 'steps'] }),
  open: settings,
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Exercise sessions'));
  },
});

/** MM-320 (the panel's UX-3): a kind allowed; its row stops being a button, so a snack says so. */
export const HealthConnectAllowing = screenStory({
  covers: ['SettingsScreen'],
  shows: 'Weight allowed.',
  device: healthPlatform(),
  open: settings,
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
  open: settings,
  walk: async (canvas) => {
    const read = await within(canvas).findByRole('button', { name: 'Read from Health Connect now' });
    reveal(read);
    await userEvent.click(read);
  },
});
