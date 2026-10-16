import type { Meta } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import { DemoSeed } from '../../fixtures/DemoSeed';
import { typicalSetup } from '../../fixtures/typicalSetup';
import { StrengthHistoryScreen } from '../../progress/StrengthHistoryScreen';
import { StrengthLiftsScreen } from '../../progress/StrengthLiftsScreen';
import { WeightEventEntrySheet } from '../../progress/WeightEventEntrySheet';
import { failingRead } from './failingRead';
import { firstDayScenario } from './firstDayScenario';
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
  shows: 'Log a weigh-in to start your trend.',
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
  shows: /^Could not load strength history/,
  stores: failingRead('workouts', 'watchWorkouts'),
  open: onProgress,
});

/** MM-321: a lift's trend opens its session history. */
export const ProgressOpensSessionHistory = screenStory({
  covers: ['ProgressScreen', 'StrengthHistoryScreen'],
  shows: 'Qualifying sessions',
  open: onProgress,
  walk: async (canvas) => {
    const [first] = await within(canvas).findAllByRole('button', { name: 'Session history' }, { timeout: 5000 });
    if (first !== undefined) await userEvent.click(first);
  },
});

/** MM-321: "All lift histories" opens every logged lift, and one of them its history. */
export const ProgressOpensLiftHistories = screenStory({
  covers: ['ProgressScreen', 'StrengthLiftsScreen', 'StrengthHistoryScreen'],
  shows: 'Qualifying sessions',
  open: onProgress,
  walk: async (canvas) => {
    await pressNamed('All lift histories')(canvas);
    const [lift] = await within(canvas).findAllByRole('button', { name: /logged sessions/ });
    if (lift !== undefined) await userEvent.click(lift);
  },
});

/** MM-321: lift histories before any workout is finished. */
export const LiftHistoriesEmpty = screenStory({
  covers: ['StrengthLiftsScreen'],
  shows: 'No finished workouts yet.',
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
