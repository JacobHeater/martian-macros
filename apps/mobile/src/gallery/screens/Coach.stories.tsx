import type { Meta } from '@storybook/react-vite';
import { PauseScreen } from '../../pause/PauseScreen';
import { DemoSeed } from '../../fixtures/DemoSeed';
import { Pause as PauseRecord } from '../../domain/Pause';
import { ScreeningAnswers } from '../../domain/ScreeningAnswers';
import { pausedScenario } from './pausedScenario';
import { userEvent, within } from 'storybook/test';
import { RecoveryCheckIn as RecoveryAnswers } from '../../domain/RecoveryCheckIn';
import { ExplanationLine } from '../../engine/ExplanationLine';
import { TargetsExplanation } from '../../engine/TargetsExplanation';
import { typicalSetup } from '../../fixtures/typicalSetup';
import { creatineScenario } from './creatineScenario';
import { failingRead } from './failingRead';
import { waitingRead } from './waitingRead';
import { demoWith } from './demoWith';
import { firstDayScenario } from './firstDayScenario';
import { recompScenario } from './recompScenario';
import { reliefScenario } from './reliefScenario';
import { reveal } from './reveal';
import { stalledScenario } from './stalledScenario';
import type { StoryScenario } from './StoryScenario';
import type { StoryStage } from './StoryStage';
import { storyTargets } from './storyTargets';
import { MonthlyReportScreen } from '../../coach/MonthlyReportScreen';
import { RecoveryCheckInScreen } from '../../coach/RecoveryCheckInScreen';
import { showTargetChangeSheet } from '../../coach/showTargetChangeSheet';
import { TargetsHistoryScreen } from '../../coach/TargetsHistoryScreen';
import { checkInDueScenario } from './checkInDueScenario';
import { screensMeta } from './screensMeta';
import { screenStory } from './screenStory';
import { valueOf } from './valueOf';

/**
 * What the coach believes, why, and what it will do next. Before MM-256
 * (main at 9fb8c79, 2026-10-13) eleven cards of equal weight; after, the
 * safeguards, the hero with the confidence word, one thing to do, and
 * sections with icons, folded to a line when quiet. Since MM-299 the goal
 * comes first under the hero and its warnings, then the one thing to do.
 */
const meta = { title: 'Screens/Coach', ...screensMeta } satisfies Meta;
export default meta;

export const Coach = screenStory({
  covers: ['CoachScreen'],
  shows: 'Your metabolism',
  open: ({ state }) => state.homeTab.put('coach'),
});

/** The one thing to do under the goal: this week's recovery check-in is due (MM-299). */
export const CheckInDue = screenStory({
  covers: ['CoachScreen'],
  shows: 'Answer this week’s five questions',
  scenario: checkInDueScenario,
  open: ({ state }) => state.homeTab.put('coach'),
});

export const WhyYourTargets = screenStory({
  covers: ['TargetChangeSheet'],
  shows: 'Why your targets are what they are',
  open: async ({ state, services, overlays }) => {
    state.homeTab.put('coach');
    const history = await valueOf(services.targets.watchTargetsHistory());
    void showTargetChangeSheet(overlays, services.targets, history);
  },
});

export const TargetHistory = screenStory({
  covers: ['TargetsHistoryScreen'],
  shows: 'Target history',
  open: ({ navigator }) => void navigator.push(() => <TargetsHistoryScreen />),
});

export const MonthlyReport = screenStory({
  covers: ['MonthlyReportScreen'],
  shows: 'What you did',
  open: ({ navigator }) => void navigator.push(() => <MonthlyReportScreen index={0} />),
});

export const RecoveryCheckIn = screenStory({
  covers: ['RecoveryCheckInScreen'],
  shows: 'This week',
  open: ({ navigator }) => void navigator.push(() => <RecoveryCheckInScreen />),
});

/** Two sliders under their labels, at the screen's inset (MM-240). */
export const Pause = screenStory({
  covers: ['PauseScreen'],
  shows: 'Reason',
  open: ({ navigator }) => void navigator.push(() => <PauseScreen />),
});

// ---- MM-321: the Coach screen's states no story drew ----

const onCoach = ({ state }: StoryStage) => state.homeTab.put('coach');

/** Presses the button named `name` on the Coach screen, once it is there. */
const pressOnCoach = (name: string | RegExp) => async (canvas: HTMLElement) => {
  const button = await within(canvas).findByRole('button', { name }, { timeout: 5000 });
  reveal(button);
  await userEvent.click(button);
};

/** MM-321: the first day: the coach still learning, its estimate a starting one. */
export const CoachFirstDay = screenStory({
  covers: ['CoachScreen'],
  shows: 'Targets are held while the coach learns.',
  scenario: firstDayScenario,
  open: onCoach,
});

/** MM-321: no weigh-in kept (each one deleted): nothing for the coach to work from. */
export const CoachNoWeighIn = screenStory({
  covers: ['CoachScreen'],
  shows: 'The coach starts from your first weigh-in.',
  scenario: async (repos, today) => {
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-3), healthCheckConfirmedOn: today }));
  },
  open: onCoach,
});

/** MM-340: weighed in, and the pauses could not be read: the coach says so, never a spinner for good. */
export const CoachRecordsFailed = screenStory({
  covers: ['CoachScreen'],
  shows: 'Could not read what your coach works from',
  stores: failingRead('pauses', 'watchPauses'),
  open: onCoach,
});

/** MM-340: the weigh-ins still being read: Coach waits on its spinner. */
export const CoachLoading = screenStory({
  covers: ['CoachScreen'],
  stores: waitingRead('weights', 'watchWeights'),
  open: onCoach,
  walk: async (canvas) => {
    // The Dashboard waits on the weigh-ins too: Coach's own spinner, once Coach is the screen.
    await within(canvas).findByRole('heading', { level: 1, name: 'Coach' });
    await within(canvas).findByRole('progressbar', { name: 'Loading' });
  },
});

/** MM-340: the health check rules targets out: the empty history says where to read why. */
export const TargetHistoryNotSet = screenStory({
  covers: ['TargetsHistoryScreen'],
  shows: 'Coach explains why targets are not set for you.',
  scenario: async (repos, today) => {
    const setup = typicalSetup({ onboardedOn: today, healthCheckConfirmedOn: today });
    await repos.setup.saveSetup(setup.copyWith({ screening: new ScreeningAnswers({ ...setup.screening, bariatricSurgery: true }) }));
  },
  open: ({ navigator }) => void navigator.push(() => <TargetsHistoryScreen />),
});

/** MM-321: two health-check answers that bring the coach's cautions, above everything. */
export const CoachCautions = screenStory({
  covers: ['CoachScreen'],
  shows: 'Your metabolism',
  scenario: demoWith({ screening: { thyroidCondition: true, insulinOrSulfonylurea: true } }),
  open: onCoach,
});

/** MM-321: "Change goal": the goals the coach allows, the recommended one marked. */
export const ChooseGoal = screenStory({
  covers: ['CoachScreen'],
  shows: 'Choose a goal',
  open: onCoach,
  walk: pressOnCoach('Change goal'),
});

/** MM-321: a new goal with a deficit is confirmed against the health check first. */
export const ChooseGoalRecheck = screenStory({
  covers: ['CoachScreen', 'HealthRecheckScreen'],
  shows: 'Health check',
  open: onCoach,
  walk: async (canvas) => {
    await pressOnCoach('Change goal')(canvas);
    await userEvent.click(await within(canvas.ownerDocument.body).findByRole('button', { name: /^Recomp/ }));
  },
});

/** MM-321: the hero's line opens the target history. */
export const CoachOpensTargetHistory = screenStory({
  covers: ['CoachScreen', 'TargetsHistoryScreen'],
  shows: 'Target history',
  open: onCoach,
  walk: pressOnCoach(/^Next check-in/),
});

/** MM-321: "History" beside the last change opens the target history. */
export const LastChangeHistory = screenStory({
  covers: ['CoachScreen', 'TargetsHistoryScreen'],
  shows: 'Target history',
  open: onCoach,
  walk: pressOnCoach('History'),
});

/** MM-321: the target history before there are any targets (set up, not yet weighed). */
export const TargetHistoryEmpty = screenStory({
  covers: ['TargetsHistoryScreen'],
  shows: 'Your first targets are worked out from your first weigh-in.',
  scenario: async (repos, today) => {
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today, healthCheckConfirmedOn: today }));
  },
  open: ({ navigator }) => void navigator.push(() => <TargetsHistoryScreen />),
});

/** MM-321: a flat month on target: progress has slowed, with the trend and the pace intended. */
export const CoachStalled = screenStory({
  covers: ['CoachScreen'],
  shows: 'Progress has slowed',
  scenario: stalledScenario(),
  open: onCoach,
});

/** MM-321: a measured estimate that left two partial days out. */
export const CoachMeasuredWithPartialDays = screenStory({
  covers: ['CoachScreen'],
  shows: 'Partial days left out',
  scenario: stalledScenario(),
  open: onCoach,
  walk: pressOnCoach(/^Your metabolism estimate/),
});

/** MM-321: creatine started six days ago: the estimate waits for the water to settle, and reductions pause. */
export const CoachSettling = screenStory({
  covers: ['CoachScreen'],
  shows: /^Calorie reductions are paused while your creatine change settles/,
  scenario: creatineScenario,
  open: onCoach,
  walk: pressOnCoach(/^Your metabolism estimate/),
});

/** MM-321: two hard weeks on a cut: the offer to ease the deficit. */
export const CoachReliefOffer = screenStory({
  covers: ['CoachScreen'],
  shows: 'Two hard weeks in a row',
  scenario: reliefScenario,
  open: onCoach,
});

/** MM-321: twelve weeks of recomposition: the review is due on Coach. */
export const CoachRecompReview = screenStory({
  covers: ['CoachScreen'],
  shows: /^Recomp review, week/,
  scenario: recompScenario,
  open: onCoach,
});

/** MM-321: a monthly report holding a recomp review and the month's target changes. */
export const MonthlyReportWithRecomp = screenStory({
  covers: ['CoachScreen', 'MonthlyReportScreen'],
  shows: /^Recomp review, week/,
  scenario: recompScenario,
  open: onCoach,
  walk: async (canvas) => {
    await pressOnCoach(/^Monthly reports/)(canvas);
    const rows = await within(canvas).findAllByRole('button', { name: /^[A-Z][a-z]{2} \d+ – / });
    // The oldest report holds the week 8 review.
    const oldest = rows[0];
    if (oldest !== undefined) await userEvent.click(oldest);
  },
});

/** A month since onboarding, a weigh-in every few days, this week's check-in answered: the first report is the one thing. */
const monthInScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-31), healthCheckConfirmedOn: today }));
  for (let day = 31; day >= 0; day -= 3) await repos.weights.saveWeight(today.addDays(-day), 88 - (31 - day) * 0.05);
  await repos.recovery.saveRecoveryCheckIn(
    new RecoveryAnswers({ date: today.addDays(-1), hunger: 3, energy: 4, sleep: 3, training: 4, mood: 4, sleepHours: 7.5 }),
  );
};

/** MM-321: the one thing to do is the new monthly report, and it opens. */
export const OneThingReport = screenStory({
  covers: ['CoachScreen', 'MonthlyReportScreen'],
  shows: 'What you did',
  scenario: monthInScenario,
  open: onCoach,
  walk: pressOnCoach(/^Open your monthly report/),
});

/** MM-321: the one thing to do is this week's check-in, and it opens. */
export const OneThingCheckIn = screenStory({
  covers: ['CoachScreen', 'RecoveryCheckInScreen'],
  shows: 'This week',
  scenario: checkInDueScenario,
  open: onCoach,
  walk: pressOnCoach(/^Answer this week’s five questions/),
});

/** MM-321: "How you are holding up" opens the check-in. */
export const RecoveryOpens = screenStory({
  covers: ['CoachScreen', 'RecoveryCheckInScreen'],
  shows: 'This week',
  scenario: checkInDueScenario,
  open: onCoach,
  walk: pressOnCoach('Answer this week'),
});

/** Targets changed yesterday, with the reasons the coach recorded (MM-121). */
const explainedScenario = (explanation: TargetsExplanation): StoryScenario => async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
  for (let d = 30; d >= 0; d -= 2) await repos.weights.saveWeight(today.addDays(-d), 86 - (30 - d) * 0.04);
  await repos.targets.saveTargets(storyTargets(today.addDays(-30), { kcal: 2400 }));
  await repos.targets.saveTargets(storyTargets(today.addDays(-1), { kcal: explanation.newKcal, explanation }));
};

const openWhy = async ({ state, services, overlays }: StoryStage) => {
  state.homeTab.put('coach');
  const history = await valueOf(services.targets.watchTargetsHistory());
  void showTargetChangeSheet(overlays, services.targets, history);
};

/** MM-321: why the targets changed, line by line, with what rounding and limits took. */
export const WhyYourTargetsExplained = screenStory({
  covers: ['TargetChangeSheet'],
  shows: /from rounding and limits/,
  scenario: explainedScenario(
    new TargetsExplanation({
      lines: [new ExplanationLine('expenditureEstimate', -80, { from: 2700, to: 2620 }), new ExplanationLine('paceAndWeight', -15)],
      newKcal: 2300,
      previousKcal: 2400,
      estimateStatus: 'updated',
      usableIntakeDays: 24,
      excludedPartialDays: 2,
      weighIns: 16,
    }),
  ),
  open: openWhy,
});

/** MM-321: a check-in where nothing moved the calorie target. */
export const WhyYourTargetsUnchanged = screenStory({
  covers: ['TargetChangeSheet'],
  shows: 'No calculated contribution was large enough to move the calorie target.',
  scenario: explainedScenario(
    new TargetsExplanation({ lines: [], newKcal: 2400, previousKcal: 2400, estimateStatus: 'held', usableIntakeDays: 9, weighIns: 8 }),
  ),
  open: openWhy,
});

/** MM-321: eating above target while the weight holds: the stall comes with options. */
export const CoachStalledOverTarget = screenStory({
  covers: ['CoachScreen'],
  shows: 'Options',
  scenario: stalledScenario(2350),
  open: onCoach,
});

/** MM-321: logs far below what the scale says was eaten: the estimate is held at a safe limit. */
export const CoachEstimateHeld = screenStory({
  covers: ['CoachScreen'],
  shows: /^Your logs and weight trend don’t add up/,
  scenario: stalledScenario(900),
  open: onCoach,
  walk: pressOnCoach(/^Your metabolism estimate/),
});

/** MM-321: paused, Coach says so, and "Manage pause" opens it. */
export const CoachPausedManage = screenStory({
  covers: ['CoachScreen', 'PauseScreen'],
  shows: 'Resume now',
  scenario: pausedScenario,
  open: onCoach,
  walk: pressOnCoach('Manage pause'),
});

/** MM-321: a pause already extended once: no second extension, and why. */
export const PauseExtended = screenStory({
  covers: ['PauseScreen'],
  shows: /^A pause can be extended once/,
  scenario: async (repos, today) => {
    await new DemoSeed(today).replace(repos);
    await repos.pauses.savePause(new PauseRecord({ from: today.addDays(-9), to: today.addDays(4), reason: 'illness', extended: true }));
  },
  open: ({ navigator }) => void navigator.push(() => <PauseScreen />),
});

/** MM-321: sixty paused days in the last four months: a new pause asks whether maintenance would suit better. */
export const PauseHeavyUse = screenStory({
  covers: ['PauseScreen'],
  shows: /^That makes a lot of paused days lately/,
  scenario: async (repos, today) => {
    await new DemoSeed(today).replace(repos);
    for (const ends of [10, 40, 70]) {
      await repos.pauses.savePause(new PauseRecord({ from: today.addDays(-ends - 19), to: today.addDays(-ends), reason: 'travel' }));
    }
  },
  open: ({ navigator }) => void navigator.push(() => <PauseScreen />),
});
