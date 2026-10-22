import type { Meta } from '@storybook/react-vite';
import { storyWorkout } from './storyWorkout';
import { userEvent, within } from 'storybook/test';
import { DemoSeed } from '../../fixtures/DemoSeed';
import { typicalSetup } from '../../fixtures/typicalSetup';
import { FixturePhotoCamera } from '../../fixtures/FixturePhotoCamera';
import { fixturePhotoJpeg } from '../../fixtures/fixturePhotoJpeg';
import { InMemoryDeviceLock } from '../../fixtures/InMemoryDeviceLock';
import { PhotoCameraScreen } from '../../progress/PhotoCameraScreen';
import { PhotoCompareScreen } from '../../progress/PhotoCompareScreen';
import { ProgressPhotosScreen } from '../../progress/ProgressPhotosScreen';
import { MeasurementSessionScreen } from '../../progress/MeasurementSessionScreen';
import { MeasurementSitesScreen } from '../../progress/MeasurementSitesScreen';
import { SiteHistoryScreen } from '../../progress/SiteHistoryScreen';
import { StrengthHistoryScreen } from '../../progress/StrengthHistoryScreen';
import { StrengthLiftsScreen } from '../../progress/StrengthLiftsScreen';
import { WeightEventEntrySheet } from '../../progress/WeightEventEntrySheet';
import { failingRead } from './failingRead';
import { firstDayScenario } from './firstDayScenario';
import { healthPlatform } from './healthPlatform';
import { measurementSitesScenario } from './measurementSitesScenario';
import { oldLiftsScenario } from './oldLiftsScenario';
import { oldWaistScenario } from './oldWaistScenario';
import { reveal } from './reveal';
import { screensMeta } from './screensMeta';
import { weightDisplayScenario } from './weightDisplayScenario';
import { screenStory } from './screenStory';
import type { StoryScenario } from './StoryScenario';
import type { StoryStage } from './StoryStage';
import { waistDownScenario } from './waistDownScenario';
import { waistDueScenario } from './waistDueScenario';
import { waistYearScenario } from './waistYearScenario';
import { waitingRead } from './waitingRead';
import { weightJumpScenario } from './weightJumpScenario';

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

/** MM-91: Progress on a 360 px phone: the weigh-in, the figure and the chart inside the width, the range switch beside its heading. */
export const ProgressSmallPhone = screenStory({
  covers: ['ProgressScreen'],
  shows: 'Weight trend',
  open: ({ state }) => state.homeTab.put('progress'),
  viewport: 'smallPhone',
});

/** MM-91: Progress at 200% text: the one figure and its line, the chart's caption and the sections' lines wrap, nothing clips. */
export const ProgressLargeText = screenStory({
  covers: ['ProgressScreen'],
  shows: 'Weight trend',
  open: ({ state }) => state.homeTab.put('progress'),
  textScale: 2,
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

// ---- MM-304: what the waist panel left ----

/** MM-304: the demo measured the waist this morning: the Waist section, open, says so and that saving again replaces it. */
export const WaistRecordedToday = screenStory({
  covers: ['ProgressScreen'],
  shows: /^Today’s waist is recorded: /,
  open: onProgress,
  walk: async (canvas) => {
    await pressNamed(/^Waist/)(canvas);
    reveal(await within(canvas).findByText(/^Today’s waist is recorded: /));
  },
});

/** MM-304: the waist saved on the Dashboard, then "Open Progress" on its confirmation: the Waist section, open, its header in hand. */
export const ProgressAtWaist = screenStory({
  covers: ['DashboardScreen', 'ProgressScreen'],
  shows: /^Today’s waist is recorded: /,
  scenario: waistDueScenario,
  walk: async (canvas) => {
    const field = await within(canvas).findByRole('textbox', { name: 'Today’s waist, inches' });
    reveal(field);
    await userEvent.type(field, '36{Enter}');
    await pressNamed('Open Progress')(canvas.ownerDocument.body);
    reveal(await within(canvas).findByText(/^Today’s waist is recorded: /));
  },
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

// ---- MM-142: a weigh-in's explanation at the point on the chart ----

/** MM-142: today's reading far above the trend: explained under the chart without a tap, the latest reading being the one in view. */
export const ProgressWeightJump = screenStory({
  covers: ['ProgressScreen'],
  shows: /above your trend\./,
  scenario: weightJumpScenario({ yesterdaysCarbsG: 340, workoutYesterday: true }),
  open: onProgress,
});

/** Taps the weigh-in dot drawn on day `day` of the chart's range. */
const pickDot = (day: number) => async (canvas: HTMLElement) => {
  const chart = await within(canvas).findByRole('img', { name: /^Weight trend over the last 30 days\./ }, { timeout: 5000 });
  reveal(chart);
  const dot = chart.querySelector(`[data-day="${day}"]`);
  if (dot !== null) await userEvent.click(dot);
};

/** MM-142: an ordinary dot tapped: that reading, its distance from the trend, and that it is inside the noise. */
export const ProgressPickedWeighIn = screenStory({
  covers: ['ProgressScreen'],
  shows: /inside the day-to-day noise\.$/,
  scenario: weightJumpScenario({ yesterdaysCarbsG: 340, workoutYesterday: true }),
  open: onProgress,
  walk: pickDot(0),
});

/** MM-142: today's dot tapped: the reading said once in the caption, the distance and its explanation in the line. */
export const ProgressPickedJump = screenStory({
  covers: ['ProgressScreen'],
  shows: /^Today: [\d.]+ (lb|kg)\.$/,
  scenario: weightJumpScenario({ yesterdaysCarbsG: 340, workoutYesterday: true }),
  open: onProgress,
  walk: pickDot(29),
});

// ---- MM-155: how to measure, drawn; the waist over time ----

/** Opens the Waist section, folded to its line until pressed (MM-257). */
const openWaist = async (canvas: HTMLElement) => {
  const header = await within(canvas).findByRole('button', { name: /^Waist/ }, { timeout: 5000 });
  reveal(header);
  await userEvent.click(header);
};

/** MM-155: two measurements so far: the protocol drawn in full beside its steps, and the chart of the two. */
export const ProgressWaistFirstMeasurements = screenStory({
  covers: ['ProgressScreen'],
  shows: 'Tape level with the navel, snug and not pressing in.',
  scenario: waistDueScenario,
  open: onProgress,
  walk: openWaist,
});

/** MM-155: six weekly measurements: the protocol one tap down, the chart with dots, the smoothed line and the noise band. */
export const ProgressWaistChart = screenStory({
  covers: ['ProgressScreen'],
  shows: 'Waist over time',
  scenario: waistDownScenario,
  open: onProgress,
  walk: openWaist,
});

/** MM-155: "How to measure" opened from the card after the first three measurements. */
export const ProgressWaistHowToMeasure = screenStory({
  covers: ['ProgressScreen'],
  shows: 'First thing in the morning, after the bathroom, before eating.',
  scenario: waistDownScenario,
  open: onProgress,
  walk: async (canvas) => {
    await openWaist(canvas);
    await pressNamed(/^How to measure/)(canvas);
  },
});

/** MM-155: thirty weekly measurements over a year, one a quick entry where the band widens. */
export const ProgressWaistYear = screenStory({
  covers: ['ProgressScreen'],
  shows: /^Dots are measurements\./,
  scenario: waistYearScenario,
  open: onProgress,
  walk: async (canvas) => {
    await openWaist(canvas);
    await pressNamed('1y')(canvas);
  },
});

/** MM-155: the one measurement is older than the range: the chart says so. */
export const ProgressWaistNoneInRange = screenStory({
  covers: ['ProgressScreen'],
  shows: 'No waist measurements in this range.',
  scenario: oldWaistScenario,
  open: onProgress,
  walk: openWaist,
});

/** MM-250: a night typed and saved: the snack says it, and focus is on the night's chip. */
export const SleepSaved = screenStory({
  covers: ['ProgressScreen'],
  shows: /^Saved: Last night, 7 h 20 m\./,
  scenario: noNights,
  open: onProgress,
  walk: async (canvas) => {
    const hours = await within(canvas).findByRole('textbox', { name: 'Last night, Hours' }, { timeout: 5000 });
    reveal(hours);
    await userEvent.type(hours, '7');
    await userEvent.type(within(canvas).getByRole('textbox', { name: 'Last night, Minutes' }), '20');
    await userEvent.click(within(canvas).getByRole('button', { name: 'Save night' }));
  },
});

// ---- MM-157: progress photos, private to the phone ----

/** The demo, with a set of photos a month ago and front and side ones today. */
const photosScenario: StoryScenario = async (repos, today) => {
  await new DemoSeed(today).replace(repos);
  const kept = (pose: 'front' | 'side' | 'back', daysAgo: number) =>
    repos.progressPhotos.savePhoto({
      date: today.addDays(-daysAgo),
      pose,
      takenAt: new Date(Date.UTC(2026, 9, 1, 7)),
      width: 1200,
      height: 1600,
      jpeg: fixturePhotoJpeg,
    });
  for (const pose of ['front', 'side', 'back'] as const) await kept(pose, 28);
  await kept('front', 0);
  await kept('side', 0);
};

/** Opens the photos from Progress. */
const openPhotos = ({ navigator }: StoryStage) => void navigator.push(() => <ProgressPhotosScreen />);

/** MM-157: Progress with the photos' line, saying when the last set was taken. */
export const ProgressWithPhotos = screenStory({
  covers: ['ProgressScreen'],
  shows: /^Last set /,
  scenario: photosScenario,
  open: ({ state }) => state.homeTab.put('progress'),
});

/** MM-157: no photos yet: what a set is, and how often is enough. */
export const ProgressPhotosNone = screenStory({
  covers: ['ProgressPhotosScreen'],
  shows: 'No photos yet. Each pose is optional; take what you are comfortable with.',
  open: openPhotos,
});

/** MM-157: two sets, newest first, each to delete; Take photos and Compare. */
export const ProgressPhotosSets = screenStory({
  covers: ['ProgressPhotosScreen'],
  shows: 'Compare two days',
  scenario: photosScenario,
  open: openPhotos,
});

/** MM-157: the phone's lock was not passed: nothing shows until it is. */
export const ProgressPhotosLocked = screenStory({
  covers: ['ProgressPhotosScreen'],
  shows: 'Locked',
  scenario: photosScenario,
  device: async (services) => ({ ...services, deviceLock: new InMemoryDeviceLock('refused') }),
  open: openPhotos,
});

/** MM-157: the camera on a first set: the checklist, and no earlier photo to line up with. */
export const PhotoCameraFirstTime = screenStory({
  covers: ['PhotoCameraScreen'],
  shows: 'Each time, the same way',
  open: ({ navigator }) => void navigator.push(() => <PhotoCameraScreen />),
});

/** MM-157: the camera with the last front photo laid over it faintly. */
export const PhotoCameraOverlay = screenStory({
  covers: ['PhotoCameraScreen'],
  shows: 'Line yourself up with the faint photo: the same distance and the same framing.',
  scenario: photosScenario,
  open: ({ navigator }) => void navigator.push(() => <PhotoCameraScreen />),
});

/** MM-157: no camera allowed: how to allow it. */
export const PhotoCameraUnavailable = screenStory({
  covers: ['PhotoCameraScreen'],
  shows: 'The camera could not be opened',
  device: async (services) => ({ ...services, photoCamera: new FixturePhotoCamera({ available: false }) }),
  open: ({ navigator }) => void navigator.push(() => <PhotoCameraScreen />),
});

/** MM-157: two days side by side, the same pose, with each day's trend weight and waist. */
export const PhotoCompare = screenStory({
  covers: ['PhotoCompareScreen'],
  shows: /Trend|Waist/,
  scenario: photosScenario,
  open: ({ navigator }) => void navigator.push(() => <PhotoCompareScreen />),
});

/** MM-157: a pose with one day only: two are needed to compare. */
export const PhotoCompareOneDay = screenStory({
  covers: ['PhotoCompareScreen'],
  shows: 'Two days with a back photo are needed to compare.',
  scenario: photosScenario,
  open: ({ navigator }) => void navigator.push(() => <PhotoCompareScreen />),
  walk: async (canvas) => {
    const back = await within(canvas.ownerDocument.body).findByRole('button', { name: 'Back', pressed: false }, { timeout: 5000 });
    await userEvent.click(back);
  },
});

// ---- MM-156: measuring more than the waist ----

const openMeasurements = async (canvas: HTMLElement) => {
  const header = await within(canvas).findByRole('button', { name: /^More measurements/ }, { timeout: 5000 });
  reveal(header);
  await userEvent.click(header);
};

/** The demo as a woman on recomp who measures only her waist (MM-156). */
const suggestionScenario: StoryScenario = async (repos, today) => {
  await new DemoSeed(today).replace(repos);
  const setup = await repos.setup.loadSetup();
  if (setup !== undefined) {
    await repos.setup.saveSetup(
      setup.copyWith({ goalMode: 'recomp', profile: typicalSetup({ sex: 'female' }).profile }),
    );
  }
};

/** MM-156: a woman on recomp who has only waist: hips, upper arm and thigh suggested once. */
export const ProgressMeasurementsSuggested = screenStory({
  covers: ['ProgressScreen'],
  shows: /^Suggested for your goal: hips, upper arm and thigh/,
  scenario: suggestionScenario,
  open: onProgress,
  walk: openMeasurements,
});

/** MM-156: the demo's waist only, no suggestion for a man cutting: the section's way to add sites and measure. */
export const ProgressMeasurementsWaistOnly = screenStory({
  covers: ['ProgressScreen'],
  shows: 'Choose sites',
  open: onProgress,
  walk: openMeasurements,
});

/** MM-156: upper arm and thigh measured in a lean gain: each site's line, the arm's change beside the waist's as two facts, and the pair. */
export const ProgressMeasurementsLimbs = screenStory({
  covers: ['ProgressScreen'],
  shows: 'Upper arm (left) up 1.0 cm in 12 weeks while waist held.',
  scenario: measurementSitesScenario,
  // A tape is read in centimetres here, so this person is metric.
  about: ['units'],
  open: onProgress,
  walk: openMeasurements,
});

/** MM-156: the first measuring session: the waist alone, drawn in full. */
export const MeasurementSessionFirst = screenStory({
  covers: ['MeasurementSessionScreen'],
  shows: 'Save measurements',
  scenario: firstDayScenario,
  open: ({ navigator }) => void navigator.push(() => <MeasurementSessionScreen />),
});

/** MM-156: a session of waist, upper arm and thigh in their fixed order, each drawing one tap down after three measurements. */
export const MeasurementSessionSites = screenStory({
  covers: ['MeasurementSessionScreen'],
  shows: 'Thigh (left)',
  scenario: measurementSitesScenario,
  // A tape is read in centimetres here, so this person is metric.
  about: ['units'],
  open: ({ navigator }) => void navigator.push(() => <MeasurementSessionScreen />),
});

/** MM-156: choosing sites, none added yet. */
export const MeasurementSites = screenStory({
  covers: ['MeasurementSitesScreen'],
  shows: 'Measurement sites',
  open: ({ navigator }) => void navigator.push(() => <MeasurementSitesScreen />),
});

/** MM-156: sites chosen, limbs on the left side. */
export const MeasurementSitesChosen = screenStory({
  covers: ['MeasurementSitesScreen'],
  shows: 'Limbs are measured on the left side.',
  scenario: measurementSitesScenario,
  // A tape is read in centimetres here, so this person is metric.
  about: ['units'],
  open: ({ navigator }) => void navigator.push(() => <MeasurementSitesScreen />),
});

/** MM-156: one site over time: the upper arm's chart with its own noise band. */
export const SiteHistory = screenStory({
  covers: ['SiteHistoryScreen'],
  shows: 'Upper arm (left) over time',
  scenario: measurementSitesScenario,
  // A tape is read in centimetres here, so this person is metric.
  about: ['units'],
  open: ({ navigator }) => void navigator.push(() => <SiteHistoryScreen site="upperArm" />),
});

/** MM-156: a site added and not measured yet. */
export const SiteHistoryEmpty = screenStory({
  covers: ['SiteHistoryScreen'],
  shows: 'Not measured yet.',
  scenario: measurementSitesScenario,
  // A tape is read in centimetres here, so this person is metric.
  about: ['units'],
  open: ({ navigator }) => void navigator.push(() => <SiteHistoryScreen site="calf" />),
});

// ---- MM-118: the weight display ----

/** MM-118: Trend only: the chart's line and band with no dots, and no reading under it or in the field. */
export const ProgressWeightTrendOnly = screenStory({
  covers: ['ProgressScreen'],
  shows: /single weigh-ins are not shown/,
  scenario: weightDisplayScenario('trendOnly'),
  open: ({ state }) => state.homeTab.put('progress'),
  // The words are under the chart's "How to read this", folded until opened.
  walk: async (canvas) => {
    const [header] = await within(canvas).findAllByRole('button', { name: /^How to read this/ }, { timeout: 5000 });
    if (header === undefined) return;
    reveal(header);
    await userEvent.click(header);
  },
});

/** MM-118: Hidden: no figure and no chart; the pace in words against the plan's. */
export const ProgressWeightHidden = screenStory({
  covers: ['ProgressScreen'],
  shows: /Your weight is hidden; the coach still uses every weigh-in/,
  scenario: weightDisplayScenario('hidden'),
  open: ({ state }) => state.homeTab.put('progress'),
});
