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
import { FoodEntry } from '../../domain/FoodEntry';
import { typicalSetup } from '../../fixtures/typicalSetup';
import { creatineScenario } from './creatineScenario';
import { failingRead } from './failingRead';
import { waitingRead } from './waitingRead';
import { demoWith } from './demoWith';
import { firstDayScenario } from './firstDayScenario';
import { leanGainScenario } from './leanGainScenario';
import { recompScenario } from './recompScenario';
import { reliefScenario } from './reliefScenario';
import { liftsFallingScenario } from './liftsFallingScenario';
import { missedPeriodScenario } from './missedPeriodScenario';
import { shortSleepScenario } from './shortSleepScenario';
import { breakOfferScenario } from './breakOfferScenario';
import { onBreakScenario } from './onBreakScenario';
import { reveal } from './reveal';
import { maintenanceScenario } from './maintenanceScenario';
import { stalledScenario } from './stalledScenario';
import { storyWorkout } from './storyWorkout';
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

/** MM-91: Coach on a 360 px phone: the hero, its warnings and the goal in the first viewport, the text actions beside their rows. */
export const CoachSmallPhone = screenStory({
  covers: ['CoachScreen'],
  shows: 'Your metabolism',
  open: ({ state }) => state.homeTab.put('coach'),
  viewport: 'smallPhone',
});

/**
 * The one thing to do under the goal: this week's recovery check-in is due (MM-299). It is the one way in, and
 * "How you are holding up" keeps only the sleep line and the skip (MM-391).
 */
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

/** MM-116: a previously regular cycle with no period marked for 46 days: the check-in asks once, and "not sure" on a cut brings the notice. */
export const RecoveryCheckInMissedPeriod = screenStory({
  covers: ['RecoveryCheckInScreen'],
  shows: 'No period marked for 46 days. Is that expected?',
  scenario: missedPeriodScenario,
  open: ({ navigator }) => void navigator.push(() => <RecoveryCheckInScreen />),
  walk: async (canvas) => {
    const button = await within(canvas).findByRole('button', { name: 'Not sure' }, { timeout: 5000 });
    reveal(button);
    await userEvent.click(button);
  },
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

/** MM-34: no waist yet: the rough formula range, and what would narrow it. */
export const CoachBodyFatRough = screenStory({
  covers: ['CoachScreen'],
  shows: /waist measurements within 4 weeks narrow this range\.$/,
  scenario: firstDayScenario,
  open: onCoach,
});

/** MM-34: four weekly waist entries: the range from the tape and the formula, and what it cannot say. */
export const CoachBodyFatFromWaist = screenStory({
  covers: ['CoachScreen'],
  shows: /^From your height, weight and waist\./,
  open: onCoach,
});

/** MM-34: an eating-disorder history: the rough range, and no ask to measure more. */
export const CoachBodyFatRoughEatingDisorder = screenStory({
  covers: ['CoachScreen'],
  shows: /\(rough estimate\)$/,
  scenario: async (repos, today) => {
    const setup = typicalSetup({ goalMode: 'maintenance', onboardedOn: today, healthCheckConfirmedOn: today });
    await repos.setup.saveSetup(setup.copyWith({ screening: new ScreeningAnswers({ ...setup.screening, eatingDisorderHistory: true }) }));
    await repos.weights.saveWeight(today, 86);
  },
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

/** MM-158: "What to expect", reread from the Coach tab: the plan's aims and what the scale does that is not progress. */
export const WhatToExpectReread = screenStory({
  covers: ['CoachScreen', 'WhatToExpectScreen'],
  shows: /^Your plan aims for/,
  open: onCoach,
  walk: pressOnCoach(/^What to expect/),
});

/** MM-130: four days after a twelve-week cut: what the scale will do, and how long a pause is sensible. */
export const MaintenanceAfterCut = screenStory({
  covers: ['CoachScreen'],
  shows: /^Expect the scale to rise/,
  scenario: maintenanceScenario({ daysAgo: 4 }),
  open: onCoach,
});

/** MM-130: six weeks in, the anchor read from the trend two weeks in, and the trend within its band. */
export const MaintenanceHolding = screenStory({
  covers: ['CoachScreen'],
  shows: 'Within the band: holding.',
  scenario: maintenanceScenario({ daysAgo: 42 }),
  open: onCoach,
});

/** MM-130: drifted above the band for two weeks: the coach asks, and changes nothing until answered. */
export const MaintenanceDrifted = screenStory({
  covers: ['CoachScreen'],
  shows: 'Your weight has moved',
  scenario: maintenanceScenario({ daysAgo: 60, driftKg: 2.5 }),
  open: onCoach,
});

/** MM-128: "Change pace": the three paces with what each costs this person today, the default marked. */
export const ChoosePace = screenStory({
  covers: ['CoachScreen', 'PaceSheet'],
  shows: 'Choose a pace',
  open: onCoach,
  walk: pressOnCoach('Change pace'),
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

/** MM-140: the same flat month, training started eight days ago: the stall is put down to water in new muscle, not to the plan. */
export const CoachStalledAfterStartingTraining = screenStory({
  covers: ['CoachScreen'],
  shows: /^You started training in the last 10 days/,
  scenario: async (repos, today) => {
    await stalledScenario()(repos, today);
    for (const daysAgo of [8, 5, 2]) {
      await repos.workouts.saveWorkout(storyWorkout(today.addDays(-daysAgo), [['back-squat', 5, 80], ['barbell-bench-press', 5, 60]]));
    }
  },
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

/** MM-117: nine weeks into a cut, the squat and the row down over three weeks with no check-in answered: the offer for the lifts. */
export const CoachReliefOfferLifts = screenStory({
  covers: ['CoachScreen'],
  shows: 'Your lifts are falling',
  scenario: liftsFallingScenario,
  open: onCoach,
});

/**
 * MM-135: twelve unbroken weeks of a cut with recovery fine: the same card as the relief offer, with the
 * calendar, offering the two-week break or carrying on; no slower pace, since the answer here is a rest.
 */
export const CoachBreakOffer = screenStory({
  covers: ['CoachScreen'],
  shows: '12 weeks in a deficit',
  scenario: breakOfferScenario,
  open: onCoach,
});

/** MM-135: the first week of the break the person chose: targets at maintenance, the next check-in two weeks out. */
export const CoachOnChosenBreak = screenStory({
  covers: ['CoachScreen'],
  shows: /^This is the two-week break you chose/,
  scenario: onBreakScenario('requestedBreak'),
  open: onCoach,
});

/** MM-135: the break the app planned at twenty weeks, the safety floor, in its first week. */
export const CoachOnPlannedBreak = screenStory({
  covers: ['CoachScreen'],
  shows: /^You’ve been in a deficit for 20 weeks/,
  scenario: onBreakScenario('dietBreak'),
  open: onCoach,
});

/** MM-135 (the panel's UX-6): the relief card's three buttons at 200% text, "Carry on" on its own line. */
export const CoachReliefOfferLargeText = screenStory({
  covers: ['CoachScreen'],
  shows: 'Two hard weeks in a row',
  scenario: reliefScenario,
  open: onCoach,
  textScale: 2,
});

/** MM-321: twelve weeks of recomposition: the review is due on Coach. */
export const CoachRecompReview = screenStory({
  covers: ['CoachScreen'],
  shows: /^Recomp review, week/,
  scenario: recompScenario,
  open: onCoach,
});

/** MM-129: ten weeks of lean gain, waist up 4 cm on 3 kg, lifts flat: fat-heavy, strength flat, and a goal offered. */
export const CoachLeanGainFatHeavy = screenStory({
  covers: ['CoachScreen'],
  shows: /The gain looks fat-heavy/,
  scenario: leanGainScenario({ bodyFatPercent: 15 }),
  open: onCoach,
  walk: pressOnCoach('Choose a goal'),
});

/** MM-129: the same gain with estimated body fat past 20%: the coach recommends ending it, and the goal stays. */
export const CoachLeanGainTimeToStop = screenStory({
  covers: ['CoachScreen'],
  shows: /The coach recommends ending the gain now/,
  scenario: leanGainScenario(),
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

/**
 * A month of whole days, one missed day forgiven, and squats that rose: the report's longest logging run and its
 * personal records (MM-92).
 */
const monthOfWorkScenario: StoryScenario = async (repos, today) => {
  const onboardedOn = today.addDays(-31);
  await monthInScenario(repos, today);
  for (let i = 0; i < 28; i++) {
    if (i === 12) continue;
    const day = onboardedOn.addDays(i);
    await repos.food.addFood(
      new FoodEntry({ id: 0, date: day, meal: 'dinner', name: 'Demo day of food', kcal: 2300, proteinG: 150, carbsG: 220, fatG: 70, source: 'quickAdd' }),
    );
    await repos.dayMarks.setCompleteness(day, 'complete');
  }
  for (const [day, kg] of [[2, 80], [9, 82.5], [16, 82.5], [23, 85]] as const) {
    await repos.workouts.saveWorkout(storyWorkout(onboardedOn.addDays(day), [['back-squat', 5, kg]]));
  }
};

/** MM-92: the monthly report with the month's longest logging run and its personal records. */
export const MonthlyReportWithRecords = screenStory({
  covers: ['CoachScreen', 'MonthlyReportScreen'],
  shows: 'Personal records',
  scenario: monthOfWorkScenario,
  open: onCoach,
  walk: async (canvas) => {
    const header = await within(canvas).findByRole('button', { name: /^Monthly reports/ }, { timeout: 5000 });
    const report = /^[A-Z][a-z]{2} \d+ – /;
    // The section is open in the week a report arrives (MM-256); fold-proof either way.
    if (within(canvas).queryAllByRole('button', { name: report }).length === 0) {
      reveal(header);
      await userEvent.click(header);
    }
    const [row] = await within(canvas).findAllByRole('button', { name: report });
    if (row !== undefined) {
      reveal(row);
      await userEvent.click(row);
    }
  },
});

/** MM-321: the one thing to do is this week's check-in, and it opens. */
export const OneThingCheckIn = screenStory({
  covers: ['CoachScreen', 'RecoveryCheckInScreen'],
  shows: 'This week',
  scenario: checkInDueScenario,
  open: onCoach,
  walk: pressOnCoach(/^Answer this week’s five questions/),
});

/** MM-321: "How you are holding up" opens the check-in; MM-391: from the section only when it is not due. */
export const RecoveryOpens = screenStory({
  covers: ['CoachScreen', 'RecoveryCheckInScreen'],
  shows: 'This week',
  scenario: shortSleepScenario,
  open: onCoach,
  walk: async (canvas) => {
    await pressOnCoach(/^How you are holding up/)(canvas);
    await pressOnCoach('Answer again')(canvas);
  },
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

/** MM-342: the week's intake with every part of its detail: the target, the distance, and what it rests on. */
export const CoachFewDaysEstimated = screenStory({
  covers: ['CoachScreen'],
  shows: /rests on 3 days · mostly estimated/,
  scenario: async (repos, today) => {
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-70), healthCheckConfirmedOn: today }));
    await repos.targets.saveTargets(
      storyTargets(today.addDays(-60), { kcal: 2100, proteinG: 160, proteinMinimumG: 130, carbsG: 220, tdeeSigmaKcal: 150, tdeeStatus: 'updated' }),
    );
    for (let i = 0; i <= 50; i++) await repos.weights.saveWeight(today.addDays(-i), 82);
    // Only three of the last seven days complete, every one of them estimated.
    for (let i = 1; i <= 7; i++) {
      const day = today.addDays(-i);
      await repos.food.addFood(
        new FoodEntry({ id: 0, date: day, meal: 'dinner', name: 'Demo day of food', kcal: 2350, proteinG: 150, carbsG: 220, fatG: 70, source: 'quickAdd' }),
      );
      await repos.dayMarks.setCompleteness(day, i <= 3 ? 'complete' : 'partial');
    }
  },
  open: onCoach,
});

/** MM-342, MM-91: Coach at 200% text; a stat row's detail wraps under its figure. */
export const CoachLargeText = screenStory({
  covers: ['CoachScreen'],
  shows: 'Your last 7 days',
  scenario: stalledScenario(2350),
  open: onCoach,
  textScale: 2,
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

// ---- MM-252: the coach reads sleep ----

/** MM-252: a fortnight of short nights with hunger and energy fine: the offer of its own, the one sentence the evidence supports, and the gentler pace one press away. */
export const CoachShortSleep = screenStory({
  covers: ['CoachScreen'],
  shows: 'Two weeks of short sleep',
  scenario: shortSleepScenario,
  open: onCoach,
});

/** MM-252: the sleep line in "How you are holding up": the fourteen-night average and the nights, no score. */
export const CoachSleepLine = screenStory({
  covers: ['CoachScreen'],
  shows: 'Sleep, last 14 nights',
  scenario: shortSleepScenario,
  open: onCoach,
  walk: pressOnCoach(/^How you are holding up/),
});

/** MM-252: the check-in with no night recorded: typical hours start empty, and nothing is said of an average. */
export const RecoveryCheckInNoNights = screenStory({
  covers: ['RecoveryCheckInScreen'],
  shows: 'Typical hours of sleep (optional)',
  scenario: firstDayScenario,
  open: ({ navigator }) => void navigator.push(() => <RecoveryCheckInScreen />),
});

/** MM-252: why the targets changed, with sleep that averaged short named before anything about the log. */
export const WhyYourTargetsShortSleep = screenStory({
  covers: ['TargetChangeSheet'],
  shows: /^Your sleep averaged 5 h 30 m over the last 12 nights\./,
  scenario: explainedScenario(
    new TargetsExplanation({
      lines: [new ExplanationLine('expenditureEstimate', -80, { from: 2700, to: 2620 }), new ExplanationLine('paceAndWeight', -20)],
      newKcal: 2300,
      previousKcal: 2400,
      estimateStatus: 'updated',
      usableIntakeDays: 24,
      excludedPartialDays: 2,
      weighIns: 16,
      shortSleepAverageMinutes: 330,
      shortSleepNights: 12,
    }),
  ),
  open: openWhy,
});

/** MM-252: the check-in with more than a day typed: refused under the field, and Save waits. */
export const RecoveryCheckInMistyped = screenStory({
  covers: ['RecoveryCheckInScreen'],
  shows: 'Up to 24 hours.',
  open: ({ navigator }) => void navigator.push(() => <RecoveryCheckInScreen />),
  walk: async (canvas) => {
    const hours = await within(canvas).findByRole('textbox', { name: 'Typical hours of sleep, Hours' });
    await userEvent.clear(hours);
    await userEvent.type(hours, '25');
  },
});

/** MM-252: the nights could not be read: the sleep line says so, never "Not recorded". */
export const CoachSleepReadFailed = screenStory({
  covers: ['CoachScreen'],
  shows: 'Not read',
  scenario: shortSleepScenario,
  stores: failingRead('sleep', 'watchSleepNights'),
  open: onCoach,
  walk: pressOnCoach(/^How you are holding up/),
});

// ---- MM-417: places of MM-130 and MM-134 no story drew ----

/** MM-134: "Change goal" for someone who does not lift yet: each goal says what it rests on, and what training means here. */
export const ChooseGoalNotTraining = screenStory({
  covers: ['CoachScreen'],
  shows: /^Training here means/,
  scenario: demoWith({
    then: async (repos) => {
      const setup = await repos.setup.loadSetup();
      if (setup !== undefined) await repos.setup.saveSetup(setup.copyWith({ trainingDaysPerWeek: 0 }));
    },
  }),
  open: onCoach,
  walk: pressOnCoach('Change goal'),
});

/** MM-130: "See why" on the change that ended a cut: the scale's rise said before it happens. */
export const ChangeSheetLeavingDeficit = screenStory({
  covers: ['CoachScreen', 'TargetChangeSheet'],
  shows: /^Expect the scale to rise/,
  scenario: maintenanceScenario({ daysAgo: 4 }),
  open: onCoach,
  walk: pressOnCoach('See why'),
});

/** MM-130: outside the band for a few days, not yet the fourteen the coach waits: said, and nothing asked. */
export const MaintenanceDrifting = screenStory({
  covers: ['CoachScreen'],
  shows: /the band for \d+ days?\. At 14 the coach will ask what you want\./,
  scenario: maintenanceScenario({ daysAgo: 30, driftKg: 2.5 }),
  open: onCoach,
});

/** MM-130: drifted, and "Correct back" chosen: a gentle pace toward the anchor, until the trend is back. */
export const MaintenanceCorrecting = screenStory({
  covers: ['CoachScreen'],
  shows: /^Correcting back toward/,
  scenario: maintenanceScenario({ daysAgo: 60, driftKg: 2.5 }),
  open: onCoach,
  walk: pressOnCoach('Correct back'),
});
