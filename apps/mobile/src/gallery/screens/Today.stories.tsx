import type { Meta } from '@storybook/react-vite';
import { FoodEntry } from '../../domain/FoodEntry';
import { DemoSeed } from '../../fixtures/DemoSeed';
import { typicalSetup } from '../../fixtures/typicalSetup';
import { userEvent, within } from 'storybook/test';
import { analysisFatWeekScenario } from './analysisFatWeekScenario';
import { cardioWearable } from './cardioWearable';
import { OpeningFailed } from '../../app/OpeningFailed';
import { CrashOnDraw } from './CrashOnDraw';
import { demoWith } from './demoWith';
import { failingRead } from './failingRead';
import { fiberLowScenario } from './fiberLowScenario';
import { firstDayScenario } from './firstDayScenario';
import { maintenanceScenario } from './maintenanceScenario';
import { notWeighedTodayScenario } from './notWeighedTodayScenario';
import { pausedScenario } from './pausedScenario';
import { reliefScenario } from './reliefScenario';
import { screensMeta } from './screensMeta';
import { reveal } from './reveal';
import { frequentWeighingScenario } from './frequentWeighingScenario';
import { weightDisplayScenario } from './weightDisplayScenario';
import { screenStory } from './screenStory';
import { writingCoach } from './writingCoach';
import { waistDownScenario } from './waistDownScenario';
import { waistDueScenario } from './waistDueScenario';
import { waitingRead } from './waitingRead';
import { weekShapeScenario } from './weekShapeScenario';
import { weightJumpScenario } from './weightJumpScenario';
import { weightLossMedicationScenario } from './weightLossMedicationScenario';

/**
 * The dashboard: where the app opens. Before MM-254 (main at 9fb8c79,
 * 2026-10-13) it was a column of eleven same-weight cards with the macro
 * picture drawn twice; after, one hero with the macro switch, the rhythm
 * strip, rows that open their destinations, and the history one tap down.
 */
const meta = { title: 'Screens/Today', ...screensMeta } satisfies Meta;
export default meta;

export const Dashboard = screenStory({ covers: ['DashboardScreen'], shows: 'History' });

/** MM-91: the Dashboard on a 360 px phone: the hero, its macro rows and the strip inside the width. */
export const DashboardSmallPhone = screenStory({ covers: ['DashboardScreen'], shows: 'History', viewport: 'smallPhone' });

/** MM-679: a screen that throws while drawing is said in words, in the app's notice, never a blank screen. */
export const CrashWhileDrawing = screenStory({
  covers: [],
  shows: 'Something went wrong while drawing this',
  open: ({ navigator }) => void navigator.push(() => <CrashOnDraw />),
});

/** MM-694: the data could not be opened when the app started: a failed read in the app's words, with Try again, before any theme. */
export const OpeningFailedAtStart = screenStory({
  covers: [],
  shows: /^Could not open your data/,
  open: ({ navigator }) => void navigator.push(() => <OpeningFailed onRetry={() => Promise.resolve()} />),
});

/** MM-677 (the owner): today's steps and the week's cardio from the wearable against their floors, a row that opens Train. */
export const DashboardCardio = screenStory({ covers: ['DashboardScreen'], shows: /steps today · .* of cardio this week/, device: cardioWearable() });

/** MM-677: the same row at phone width, with the floors under it. */
export const DashboardCardioSmallPhone = screenStory({
  covers: ['DashboardScreen'],
  shows: /steps today · .* of cardio this week/,
  viewport: 'smallPhone',
  device: cardioWearable({ stepsPerDay: 12350 }),
});

/** MM-91: the Dashboard at 200% text: every row wraps, nothing clips, the title and Settings share the width. */
export const DashboardLargeText = screenStory({ covers: ['DashboardScreen'], shows: 'History', textScale: 2 });

/** MM-91: the morning before the weigh-in at 200% text: the field, its Save and the hint inside the row. */
export const NotWeighedTodayLargeText = screenStory({
  covers: ['DashboardScreen'],
  shows: 'First thing in the morning, after the bathroom.',
  scenario: notWeighedTodayScenario,
  textScale: 2,
});

export const FirstDay = screenStory({
  covers: ['DashboardScreen'],
  shows: /^left of [\d,]+/,
  scenario: firstDayScenario,
});

/** Most mornings: no weigh-in yet today, so the Dashboard asks for one in place. */
export const NotWeighedToday = screenStory({
  covers: ['DashboardScreen'],
  shows: 'First thing in the morning, after the bathroom.',
  scenario: notWeighedTodayScenario,
});

/**
 * MM-117: two hard weeks on a cut, on the Dashboard: the offer to ease the deficit above the day's own action, both
 * choices secondary so the screen keeps one primary (checked by the hierarchy rules).
 */
export const DashboardReliefOffer = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Two hard weeks in a row',
  scenario: reliefScenario,
});

/** MM-127: a glass of wine today, at Standard detail: the alcohol's energy as a row of the hero, said as part of the total. */
export const TodayWithAlcohol = screenStory({
  covers: ['DashboardScreen'],
  shows: '109 kcal, in the total',
  scenario: async (repos, today) => {
    await new DemoSeed(today).replace(repos);
    await repos.food.addFood(
      new FoodEntry({ id: 0, date: today, meal: 'dinner', name: 'Red wine', kcal: 125, proteinG: 0, carbsG: 4, fatG: 0, source: 'weighed', alcoholG: 15.6 }),
    );
  },
});

/** Weighed today, the waist last measured over a week ago: the Dashboard asks for it in place (MM-301). */
export const WaistDue = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Morning, after the bathroom, before eating. Tape level with the navel, snug, breathe out normally, the same tape each time.',
  scenario: waistDueScenario,
});

/** Types into a field of the screen, once it is there. */
const type = (name: string, text: string) => async (canvas: HTMLElement) =>
  userEvent.type(await within(canvas).findByRole('textbox', { name }), text);

/** A waist typed and not yet saved: Save is on, and secondary (MM-301). */
export const WaistTyped = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Morning, after the bathroom, before eating. Tape level with the navel, snug, breathe out normally, the same tape each time.',
  scenario: waistDueScenario,
  walk: type('Today’s waist, inches', '36'),
});

/** A waist no tape could measure, refused under the field (MM-301). */
export const WaistRefused = screenStory({
  covers: ['DashboardScreen'],
  shows: 'That value looks off. Check it.',
  scenario: waistDueScenario,
  walk: type('Today’s waist, inches', '3{Enter}'),
});

/** Both asking and both typed: one primary Save, the waist's secondary (MM-301, PD-1). */
export const BothTyped = screenStory({
  covers: ['DashboardScreen'],
  shows: 'First thing in the morning, after the bathroom.',
  scenario: notWeighedTodayScenario,
  walk: async (canvas) => {
    await type('Today’s weigh-in', '184.2')(canvas);
    await type('Today’s waist, inches', '36')(canvas);
  },
});

/** The weigh-in saved: the snack above the safe area offers Progress (MM-294, MM-301, MM-302). */
export const WeighInSaved = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Open Progress',
  scenario: notWeighedTodayScenario,
  walk: type('Today’s weigh-in', '184.2{Enter}'),
});

/** The waist saved on the Dashboard: the snack confirms it above the safe area and offers Progress (MM-301, MM-302). */
export const WaistSaved = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Open Progress',
  scenario: waistDueScenario,
  walk: type('Today’s waist, inches', '36{Enter}'),
});

/** MM-313: today's water in the Dashboard's group, a glass in one tap; no goal. */
export const Water = screenStory({
  covers: ['DashboardScreen'],
  shows: /fl oz today/,
  walk: async (canvas) => {
    reveal(await within(canvas).findByRole('button', { name: 'Add a glass of water' }));
  },
});

/** MM-313: the snack after one tap, with Undo. */
export const WaterGlassAdded = screenStory({
  covers: ['DashboardScreen'],
  shows: /Added a glass/,
  walk: async (canvas) => {
    const add = await within(canvas).findByRole('button', { name: 'Add a glass of water' });
    reveal(add);
    await userEvent.click(add);
  },
});

/** MM-313: the first day, no water yet. */
export const WaterNone = screenStory({
  covers: ['DashboardScreen'],
  shows: 'No water yet today',
  scenario: firstDayScenario,
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('No water yet today'));
  },
});

/** MM-310 (owner, 2026-10-14): Micros lives on Food; remembered, the Dashboard shows the grams. */
export const MicrosRemembered = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Grams',
  scenario: demoWith({ detail: 'full', picture: 'micros' }),
});

/** Opens the history ("History", named for 7 or 30 days since MM-176), once the Dashboard is there. */
const openHistory = async (canvas: HTMLElement) => {
  const more = await within(canvas).findByRole('button', { name: /^History/ });
  await userEvent.click(more);
  reveal(more);
};

/** MM-321, MM-335: the history one tap down, over the demo's ten weeks, in sections. */
export const History = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Coach and expenditure',
  walk: openHistory,
});

/** MM-321: the history on the first day, with nothing recorded yet. */
export const HistoryFirstDay = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Nothing logged in these days yet',
  scenario: firstDayScenario,
  walk: openHistory,
});

/** MM-321: the history while the recovery check-ins are still being read. */
export const HistoryLoading = screenStory({
  covers: ['DashboardScreen'],
  stores: waitingRead('recovery', 'watchRecoveryCheckIns'),
  walk: async (canvas) => {
    await openHistory(canvas);
    await within(canvas).findByRole('progressbar', { name: 'Loading' });
  },
});

/** MM-321: the history when the waist measurements could not be read. */
export const HistoryFailed = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Could not read your history',
  stores: failingRead('waist', 'watchWaist'),
  walk: openHistory,
});

/** MM-321: the Dashboard while the pauses are still being read. */
export const LoadingPauses = screenStory({
  covers: ['DashboardScreen'],
  stores: waitingRead('pauses', 'watchPauses'),
  walk: async (canvas) => {
    await within(canvas).findByRole('progressbar', { name: 'Loading' });
  },
});

/** MM-321: the Dashboard while the target history is still being read. */
export const Loading = screenStory({
  covers: ['DashboardScreen'],
  stores: waitingRead('targets', 'watchTargetsHistory'),
  walk: async (canvas) => {
    await within(canvas).findByRole('progressbar', { name: 'Loading' });
  },
});

/** MM-321, MM-334: the pauses could not be read: the day stays, its targets withheld (MM-183). */
export const PausesFailed = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Could not check whether today is paused',
  stores: failingRead('pauses', 'watchPauses'),
});

/** MM-321: the profile could not be read: the app says so before any screen. */
export const ProfileFailed = screenStory({
  covers: ['DashboardScreen'],
  shows: /^Could not open your data/,
  stores: failingRead('setup', 'watchSetup'),
});

/** MM-321: the day's food or the target history could not be read. */
export const RecordsFailed = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Could not read today’s food, targets or weigh-ins',
  stores: failingRead('targets', 'watchTargetsHistory'),
});

/** MM-321: paused for travel; the hero's line says so and opens the pause. */
export const Paused = screenStory({
  covers: ['DashboardScreen', 'PauseScreen'],
  shows: /^Paused until/,
  scenario: pausedScenario,
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: /^Paused until/ }));
  },
});

/** MM-321: the history while paused: paused days stay as observations. */
export const HistoryPaused = screenStory({
  covers: ['DashboardScreen'],
  shows: /Paused days are shown; targets, coverage and the averages leave them out.$/,
  scenario: pausedScenario,
  walk: openHistory,
});

/** MM-321: the history with no weigh-in kept (each one deleted): no coaching estimate yet, and what it needs (MM-176). */
export const HistoryNoWeighIn = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Needs two weeks of logs and weigh-ins',
  scenario: async (repos, today) => {
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-3), healthCheckConfirmedOn: today }));
  },
  walk: openHistory,
});

/** MM-176: targets off for the profile (bariatric surgery): the coach section says so, not "no estimate". */
export const HistoryTargetsOff = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Targets are off for your profile',
  scenario: demoWith({ screening: { bariatricSurgery: true } }),
  walk: openHistory,
});

/** MM-183, MM-334: the pauses could not be read: the history stays, without targets or coverage, under the Dashboard's one alert. */
export const HistoryPausesFailed = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Paused days could not be checked',
  stores: failingRead('pauses', 'watchPauses'),
  walk: openHistory,
});

/** MM-321: a month since onboarding: the first report is ready, and opens from the Dashboard. */
export const ReportReady = screenStory({
  covers: ['DashboardScreen', 'MonthlyReportScreen'],
  shows: 'What you did',
  scenario: async (repos, today) => {
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-31), healthCheckConfirmedOn: today }));
    for (let day = 31; day >= 0; day -= 3) await repos.weights.saveWeight(today.addDays(-day), 88 - (31 - day) * 0.05);
  },
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: 'Open the report' }));
  },
});

/** MM-141: the weekend rule, in the person's own averages against the target, with the numbers one tap down. */
export const InsightWeekendHigher = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Weekends run higher than weekdays',
  scenario: weekShapeScenario('weekend'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Weekends run higher than weekdays'));
  },
});

/** MM-141: one weekday the highest day in both weeks: stated, no action. */
export const InsightHighestDay = screenStory({
  covers: ['DashboardScreen'],
  shows: /is your highest day$/,
  scenario: weekShapeScenario('highestDay'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText(/is your highest day$/));
  },
});

/** MM-141: one weekday unlogged in both weeks: a day the coach cannot see. */
export const InsightUnloggedDay = screenStory({
  covers: ['DashboardScreen'],
  shows: /goes unlogged$/,
  scenario: weekShapeScenario('unloggedDay'),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText(/goes unlogged$/));
  },
});

/** MM-141: the waist down beyond its noise while the trend held, at maintenance. */
export const InsightWaistAgainstWeight = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Your waist is down while the scale held',
  scenario: waistDownScenario,
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Your waist is down while the scale held'));
  },
});

/**
 * MM-126: on a cut, fiber well under the guide and hunger hard: fullness, in foods already logged, at most monthly.
 * On the card since two days ago, so it keeps its place over the analysis's own fiber line, new as of yesterday (MM-610).
 */
export const InsightFiberForFullness = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Fiber, and staying full on a deficit',
  scenario: fiberLowScenario,
  walk: async (canvas) => {
    reveal(await within(canvas).findByText('Fiber, and staying full on a deficit'));
  },
});

/**
 * MM-610: the card from the coach's analysis: the owner's fat week, announced new as of yesterday, in the Coach tab's
 * own words, with the numbers one tap down and the way to that section on Coach.
 */
export const InsightFromAnalysis = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Fat averaged 90 g against 70 g',
  scenario: analysisFatWeekScenario(),
  walk: async (canvas) => {
    reveal(await within(canvas).findByRole('button', { name: /^Open on Coach/ }));
  },
});

/** MM-673: the same insight with a BYOK coach writing: the wait where its sentence will stand, the title and numbers as ever. */
export const InsightWriting = screenStory({
  covers: ['DashboardScreen'],
  shows: 'The coach is writing…',
  scenario: analysisFatWeekScenario(),
  device: writingCoach,
});

/** MM-130: the first fortnight after a cut: under the weigh-in, why the scale rises, said before it does. */
export const WeighInAfterCut = screenStory({
  covers: ['DashboardScreen'],
  shows: /^Expect the scale to rise/,
  scenario: maintenanceScenario({ daysAgo: 4 }),
  walk: async (canvas) => {
    reveal(await within(canvas).findByText(/^Expect the scale to rise/));
  },
});

// ---- MM-142: when the scale jumps, what probably did it, under the weigh-in ----

/** MM-142: today's reading 1.3 kg above a flat trend after a 340 g carbohydrate day and a workout: both named, with their figures. */
export const WeighInJump = screenStory({
  covers: ['DashboardScreen'],
  shows: /above your trend\./,
  scenario: weightJumpScenario({ yesterdaysCarbsG: 340, workoutYesterday: true }),
});

/** MM-142: the figures behind the explanation, one tap down, and the way to its switch. */
export const WeighInJumpFigures = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Usual carbohydrate',
  scenario: weightJumpScenario({ yesterdaysCarbsG: 340, workoutYesterday: true }),
  walk: async (canvas) => {
    const line = await within(canvas).findByRole('button', { name: /^Coach: Today’s weigh-in is/ });
    reveal(line);
    await userEvent.click(line);
  },
});

/** MM-142: the same jump after two ordinary days: nothing in the log explains it, and a weight event is offered. */
export const WeighInJumpNothingInLog = screenStory({
  covers: ['DashboardScreen'],
  shows: /Nothing in your log explains this\./,
  scenario: weightJumpScenario(),
});

/** MM-142: a reading 1.3 kg below the trend the morning after an illness event: likely water, and it will probably come back. */
export const WeighInLowAfterIllness = screenStory({
  covers: ['DashboardScreen'],
  shows: /below your trend\./,
  scenario: weightJumpScenario({ todayKg: 80.7, illnessYesterday: true }),
});

/** MM-142: yesterday 2,900 kcal over target: said plainly, with the most of it that could be fat, the rest water and food. */
export const WeighInOvershoot = screenStory({
  covers: ['DashboardScreen'],
  shows: /against a [\d,]+ kcal target\./,
  scenario: weightJumpScenario({ yesterdaysKcal: 5100 }),
});

/** MM-113, MM-510: on a weight-loss medication the hero leads with protein, and calories are logged so far against the aim. */
export const DashboardOnWeightLossMedication = screenStory({
  covers: ['DashboardScreen'],
  shows: /^so far, aiming for about 2,100 kcal/,
  scenario: weightLossMedicationScenario(),
});

// ---- MM-118: the weight display ----

/** MM-118: Trend only: the weight row says the trend and its week, never today's reading. */
export const DashboardWeightTrendOnly = screenStory({
  covers: ['DashboardScreen'],
  shows: /^Trend [\d.]+ (lb|kg)$/,
  scenario: weightDisplayScenario('trendOnly'),
});

/** MM-118: Hidden: no weight figure; the weight row and the history say the pace in words. */
export const DashboardWeightHidden = screenStory({
  covers: ['DashboardScreen'],
  shows: 'Weighed in today · against your plan’s pace',
  scenario: weightDisplayScenario('hidden'),
});

/** MM-118: the weight display offered once, after several weigh-ins a day on five days in two weeks. */
export const DashboardWeightDisplayOffer = screenStory({
  covers: ['DashboardScreen'],
  shows: 'How much of your weight to show',
  scenario: frequentWeighingScenario,
});

/** MM-118: the offer declined: remembered, and where the choice lives said. */
export const DashboardWeightDisplayOfferDeclined = screenStory({
  covers: ['DashboardScreen'],
  shows: 'You can change this in Settings, Appearance.',
  scenario: frequentWeighingScenario,
  walk: async (canvas) => {
    await userEvent.click(await within(canvas).findByRole('button', { name: 'No thanks' }, { timeout: 5000 }));
  },
});
