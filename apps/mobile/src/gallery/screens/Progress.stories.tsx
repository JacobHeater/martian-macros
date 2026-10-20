import type { Meta } from '@storybook/react-vite';
import { storyWorkout } from './storyWorkout';
import { userEvent, within } from 'storybook/test';
import { DemoSeed } from '../../fixtures/DemoSeed';
import { typicalSetup } from '../../fixtures/typicalSetup';
import { StrengthHistoryScreen } from '../../progress/StrengthHistoryScreen';
import { StrengthLiftsScreen } from '../../progress/StrengthLiftsScreen';
import { WeightEventEntrySheet } from '../../progress/WeightEventEntrySheet';
import { failingRead } from './failingRead';
import { firstDayScenario } from './firstDayScenario';
import { healthPlatform } from './healthPlatform';
import { oldLiftsScenario } from './oldLiftsScenario';
import { reveal } from './reveal';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';
import type { StoryScenario } from './StoryScenario';
import type { StoryStage } from './StoryStage';
import { waitingRead } from './waitingRead';

/**
 * Weight, waist and strength over time. Before MM-257 (main at 9fb8c79,
 * 2026-10-13) an entry card, a chart card with a four-line caption and up
 * to seven more cards; after, one hero holding the weigh-in and the trend,
 * events as rows with icons, and waist and strength folded to a line.
 */
const meta = { title: 'Screens/Progress', ...screensMeta } satisfies Meta;
export default meta;

export const Progress = screenStory({
  covers: ['ProgressScreen'],
  shows: 'Weight trend',
  open: ({ state }) => state.homeTab.put('progress'),
});

/** MM-20: a female profile's period days, the last two weeks as chips, a period marked and the chart shaded around its start. */
export const PeriodDays = screenStory({
  covers: ['ProgressScreen'],
  shows: 'Period days',
  scenario: async (repos, today) => {
    await repos.setup.saveSetup(typicalSetup({ sex: 'female', onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }));
    for (let i = 0; i <= 45; i++) {
      const premenstrual = i >= 11 && i <= 13;
      await repos.weights.saveWeight(today.addDays(-i), 64 - i * 0.02 + (premenstrual ? 0.9 : 0) + (i % 3) * 0.1);
    }
    for (let i = 10; i >= 6; i--) await repos.flowDays.markFlowDay(today.addDays(-i));
  },
  open: ({ state }) => state.homeTab.put('progress'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByRole('heading', { name: 'Period days' }));
  },
});

export const AddWeightEvent = screenStory({
  covers: ['WeightEventEntrySheet'],
  shows: 'Add a weight event',
  open: ({ state, overlays, today }) => {
    state.homeTab.put('progress');
    void overlays.sheet<void>('Add a weight event', (close) => (
      <WeightEventEntrySheet today={today} onDone={() => close()} />
    ));
  },
});

export const LiftHistories = screenStory({
  covers: ['StrengthLiftsScreen'],
  shows: 'Every logged lift',
  open: ({ navigator }) => void navigator.push(() => <StrengthLiftsScreen />),
});

export const LiftHistory = screenStory({
  covers: ['StrengthHistoryScreen'],
  shows: 'Qualifying sessions',
  open: ({ navigator }) => void navigator.push(() => <StrengthHistoryScreen exerciseId="back-squat" />),
});

// ---- MM-321: the Progress screen's states no story drew ----

const onProgress = ({ state }: StoryStage) => state.homeTab.put('progress');

/** Presses the button named `name`, once it is there. */
const pressNamed = (name: string | RegExp) => async (canvas: HTMLElement) => {
  const button = await within(canvas).findByRole('button', { name }, { timeout: 5000 });
  reveal(button);
  await userEvent.click(button);
};

/** Set up, not yet weighed. */
const setUpOnly: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today, healthCheckConfirmedOn: today }));
};

/** MM-321: no weigh-in yet: the trend waits for one. */
export const ProgressNoWeighIn = screenStory({
  covers: ['ProgressScreen'],
  shows: 'No trend yet.',
  scenario: setUpOnly,
  open: onProgress,
});

/** MM-321: one weigh-in: a trend needs more. */
export const ProgressFirstDay = screenStory({
  covers: ['ProgressScreen'],
  shows: 'A trend needs more weigh-ins.',
  scenario: firstDayScenario,
  open: onProgress,
});

/** MM-321: the strength trends could not be read. */
export const ProgressStrengthFailed = screenStory({
  covers: ['ProgressScreen'],
  shows: 'Could not read your strength history',
  stores: failingRead('workouts', 'watchWorkouts'),
  open: onProgress,
});

/** MM-321: a lift's trend opens its session history. */
export const ProgressOpensSessionHistory = screenStory({
  covers: ['ProgressScreen', 'StrengthHistoryScreen'],
  shows: 'Qualifying sessions',
  open: onProgress,
  walk: async (canvas) => {
    // A lift's row opens its history (MM-344).
    const [first] = await within(canvas).findAllByRole('button', { name: /^Back squat/ }, { timeout: 5000 });
    if (first !== undefined) await userEvent.click(first);
  },
});

/** MM-321: "All lift histories" opens every logged lift, and one of them its history. */
export const ProgressOpensLiftHistories = screenStory({
  covers: ['ProgressScreen', 'StrengthLiftsScreen', 'StrengthHistoryScreen'],
  shows: 'Qualifying sessions',
  open: onProgress,
  walk: async (canvas) => {
    await pressNamed(/^All lift histories/)(canvas);
    const [lift] = await within(canvas).findAllByRole('button', { name: /logged sessions/ });
    if (lift !== undefined) await userEvent.click(lift);
  },
});

/** MM-321: lift histories before any workout is finished. */
export const LiftHistoriesEmpty = screenStory({
  covers: ['StrengthLiftsScreen'],
  shows: 'No finished workouts yet',
  scenario: firstDayScenario,
  open: ({ navigator }) => void navigator.push(() => <StrengthLiftsScreen />),
});

/** MM-321: a lift never logged: no sessions. */
export const LiftHistoryNoSessions = screenStory({
  covers: ['StrengthHistoryScreen'],
  shows: 'No sessions',
  scenario: firstDayScenario,
  open: ({ navigator }) => void navigator.push(() => <StrengthHistoryScreen exerciseId="back-squat" />),
});

/** Weighed, with creatine started at onboarding and two events of the person's own (MM-136). */
const withWeightEvents: StoryScenario = async (repos, today) => {
  await new DemoSeed(today).replace(repos);
  const setup = await repos.setup.loadSetup();
  if (setup !== undefined) await repos.setup.saveSetup(setup.copyWith({ creatineStartedOn: today.addDays(-40) }));
  await repos.weightEvents.saveWeightEvent({ date: today.addDays(-9), type: 'illness' });
  await repos.weightEvents.saveWeightEvent({ date: today.addDays(-3), type: 'largeOrSaltyMeal' });
};

/** MM-321: weight events listed, the one from onboarding marked, the others deletable. */
export const ProgressWeightEvents = screenStory({
  covers: ['ProgressScreen'],
  shows: 'Onboarding',
  scenario: withWeightEvents,
  open: onProgress,
});

/** MM-321: "Add a weight event" opens its sheet from Progress. */
export const ProgressAddsWeightEvent = screenStory({
  covers: ['ProgressScreen', 'WeightEventEntrySheet'],
  shows: 'Add a weight event',
  open: onProgress,
  walk: pressNamed('Add a weight event'),
});

/** MM-321: the weight events still being read. */
export const ProgressWeightEventsLoading = screenStory({
  covers: ['ProgressScreen'],
  shows: /^Loading weight events/,
  stores: waitingRead('weightEvents', 'watchWeightEvents'),
  open: onProgress,
});

/** MM-321: the weight events could not be read. */
export const ProgressWeightEventsFailed = screenStory({
  covers: ['ProgressScreen'],
  shows: 'Could not load weight events.',
  stores: failingRead('weightEvents', 'watchWeightEvents'),
  open: onProgress,
});

/** MM-321: lifts logged, none of them in the last 90 days. */
export const ProgressNoRecentLifts = screenStory({
  covers: ['ProgressScreen'],
  shows: /^No qualifying sessions in the last 90 days/,
  scenario: oldLiftsScenario,
  open: onProgress,
});

/** MM-321: a lift whose sets never qualify for a strength estimate (25 reps). */
export const LiftHistoryNoneQualify = screenStory({
  covers: ['StrengthHistoryScreen'],
  shows: 'No qualifying sessions yet.',
  scenario: oldLiftsScenario,
  open: ({ navigator }) => void navigator.push(() => <StrengthHistoryScreen exerciseId="barbell-bench-press" />),
});

/** One qualifying squat this week, beside sets of an exercise of the person's own since deleted. */
const oneSession: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 84);
  await repos.workouts.saveWorkout(storyWorkout(today.addDays(-3), [['back-squat', 5, 100], ['custom-deleted-row', 8, 40]]));
};

/** MM-321, MM-344: one qualifying session: the lift's row says a change needs more history. */
export const ProgressOneSession = screenStory({
  covers: ['ProgressScreen'],
  shows: / · 4-week change not ready yet$/,
  scenario: oneSession,
  open: onProgress,
});

/** MM-321, MM-344: the lift's own history, where its chart lives: one session is no trend yet. */
export const LiftHistoryOneSession = screenStory({
  covers: ['StrengthHistoryScreen'],
  shows: 'One qualifying session. More sessions are needed for a trend.',
  scenario: oneSession,
  open: ({ navigator }) => void navigator.push(() => <StrengthHistoryScreen exerciseId="back-squat" />),
});

/** MM-321: the history of an exercise since deleted: its sets are kept, its estimate cannot be worked out. */
export const LiftHistoryDeletedExercise = screenStory({
  covers: ['StrengthHistoryScreen'],
  shows: 'Qualifying sessions',
  scenario: oneSession,
  open: ({ navigator }) => void navigator.push(() => <StrengthHistoryScreen exerciseId="custom-deleted-row" />),
});

/** MM-348: the lift list with an exercise since deleted: said as such, and when it was last logged. */
export const LiftHistoriesDeletedExercise = screenStory({
  covers: ['StrengthLiftsScreen'],
  shows: /^Exercise deleted, sets kept · last logged /,
  scenario: oneSession,
  open: ({ navigator }) => void navigator.push(() => <StrengthLiftsScreen />),
});

/** MM-344: the lift list while the workouts are still being read: its own spinner. */
export const LiftHistoriesLoading = screenStory({
  covers: ['StrengthLiftsScreen'],
  stores: waitingRead('workouts', 'watchWorkouts'),
  open: ({ navigator }) => void navigator.push(() => <StrengthLiftsScreen />),
  walk: async (canvas) => {
    await within(canvas).findByRole('heading', { level: 1, name: 'Lift histories' });
    await within(canvas).findByRole('progressbar', { name: 'Loading' });
  },
});

/** MM-344: the lift list when the workouts could not be read. */
export const LiftHistoriesFailed = screenStory({
  covers: ['StrengthLiftsScreen'],
  shows: 'Could not read your strength history',
  stores: failingRead('workouts', 'watchWorkouts'),
  open: ({ navigator }) => void navigator.push(() => <StrengthLiftsScreen />),
});

/** MM-344: a bodyweight lift's own history, which says the estimate counts body weight. */
export const LiftHistoryBodyweight = screenStory({
  covers: ['StrengthHistoryScreen'],
  shows: /^Uses total bodyweight plus added or assisted weight/,
  open: ({ navigator }) => void navigator.push(() => <StrengthHistoryScreen exerciseId="pull-up" />),
});

// ---- MM-250: the nights of sleep ----

/** Set up and weighed, no night recorded yet. */
const noNights: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-20), healthCheckConfirmedOn: today }));
  for (let d = 20; d >= 0; d--) await repos.weights.saveWeight(today.addDays(-d), 86 - (20 - d) * 0.05);
};

/** MM-250: last night not recorded: the section open, the fortnight as chips, hours and minutes to type. Beside Period days (its sibling for the chips) and Waist (for the fields and Save). */
export const SleepNotRecorded = screenStory({
  covers: ['ProgressScreen'],
  shows: 'Last night not recorded yet.',
  scenario: noNights,
  open: onProgress,
  walk: async (canvas) => {
    reveal(await within(canvas).findByRole('heading', { name: 'Sleep' }));
  },
});

/** MM-250: nights typed, last night among them: folded to its line; opened, each chip carries its night's hours and last night's fill the fields. */
export const SleepRecorded = screenStory({
  covers: ['ProgressScreen'],
  shows: / of the last 14 nights recorded\.$/,
  open: onProgress,
  walk: pressNamed(/^Sleep/),
});

/** MM-250: nights read from the watch through Health Connect (MM-320), last night not among them; the night before picked, which says the watch's hours would give way to typed ones. */
export const SleepFromWatch = screenStory({
  covers: ['ProgressScreen'],
  shows: /^The night before: 6 h 52 m from Watch\. A night you type is used instead\./,
  scenario: noNights,
  device: healthPlatform({ allowed: ['sleep'] }),
  open: onProgress,
  walk: pressNamed('The night before · 6 h 52 m'),
});

/** MM-250: more than a day typed: refused under the field, and Save waits. */
export const SleepMistyped = screenStory({
  covers: ['ProgressScreen'],
  shows: 'Up to 24 hours.',
  scenario: noNights,
  open: onProgress,
  walk: async (canvas) => {
    const hours = await within(canvas).findByRole('textbox', { name: 'Last night, Hours' }, { timeout: 5000 });
    reveal(hours);
    await userEvent.type(hours, '25');
  },
});

/** MM-250: minutes mistyped: the minutes field is the one marked (MM-414). */
export const SleepMinutesMistyped = screenStory({
  covers: ['ProgressScreen'],
  shows: 'Minutes from 0 to 59.',
  scenario: noNights,
  open: onProgress,
  walk: async (canvas) => {
    const hours = await within(canvas).findByRole('textbox', { name: 'Last night, Hours' }, { timeout: 5000 });
    reveal(hours);
    await userEvent.type(hours, '6');
    await userEvent.type(within(canvas).getByRole('textbox', { name: 'Last night, Minutes' }), '75');
  },
});

/** MM-250: the nights could not be read: said in the section, with a way to try again, never shown as none. */
export const SleepReadFailed = screenStory({
  covers: ['ProgressScreen'],
  shows: 'Could not read your nights of sleep',
  stores: failingRead('sleep', 'watchSleepNights'),
  open: onProgress,
});

/** MM-250: the nights still being read: the section waits on its own spinner. */
export const SleepLoading = screenStory({
  covers: ['ProgressScreen'],
  stores: waitingRead('sleep', 'watchSleepNights'),
  open: onProgress,
  walk: async (canvas) => {
    const heading = await within(canvas).findByRole('heading', { name: 'Sleep' });
    reveal(heading);
    await within(heading.closest('.mm-section') as HTMLElement).findByRole('progressbar', { name: 'Loading' });
  },
});
