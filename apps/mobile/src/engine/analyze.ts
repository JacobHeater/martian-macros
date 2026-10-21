import type { SiteObservation } from '../domain/measurements/SiteObservation';
import type { BodyFatObservation } from '../domain/BodyFatObservation';
import type { CalendarDate } from '../domain/CalendarDate';
import { CoachingPolicy } from '../domain/CoachingPolicy';
import type { IntakeDay } from '../domain/IntakeDay';
import type { MenstruationDay } from '../domain/MenstruationDay';
import type { Pause } from '../domain/Pause';
import { TrainingStatus } from '../domain/TrainingStatus';
import type { UserSetup } from '../domain/UserSetup';
import type { WaistObservation } from '../domain/WaistObservation';
import type { WeightEvent } from '../domain/WeightEvent';
import type { WeightObservation } from '../domain/WeightObservation';
import { activityGaps } from './activityGaps';
import { assessCoachConfidence } from './assessCoachConfidence';
import { CoachSnapshot } from './CoachSnapshot';
import { combineTrendShifts } from './combineTrendShifts';
import { creatineEventShift } from './creatineEventShift';
import { creatineWeightEvents } from './creatineWeightEvents';
import { cycleNoiseMultiplier } from './cycleNoiseMultiplier';
import { effectiveWeightEvents } from './effectiveWeightEvents';
import { gapPrior } from './gapPrior';
import { GapRule } from './GapRule';
import { initialTdeePrior } from './initialTdeePrior';
import { mifflinStJeorKcal } from './mifflinStJeorKcal';
import { energyDensityForSlope } from './energyDensityForSlope';
import { estimateBodyFat } from './estimateBodyFat';
import { passingWeightEventNoise } from './passingWeightEventNoise';
import { pauseDeficitRestartOn } from './pauseDeficitRestartOn';
import { recommendMode } from './recommendMode';
import { safetyBodyFatPercent } from './safetyBodyFatPercent';
import { SafetyBounds } from './SafetyBounds';
import { settlingShift } from './settlingShift';
import { settlingWindows } from './settlingWindows';
import type { TargetsRecord } from './TargetsRecord';
import { TdeeEstimator } from './TdeeEstimator';
import type { TdeePrior } from './TdeePrior';
import { weightEventStepDays } from './weightEventConstants';
import { weightEventSettlingWindows } from './weightEventSettlingWindows';
import { WeightTrendModel } from './WeightTrendModel';
import type { WeightTrendPoint } from './WeightTrendPoint';
import { withoutPausedDays } from './withoutPausedDays';

/** The latest of `dates`, or undefined when there are none. */
function latestOf(dates: readonly CalendarDate[]): CalendarDate | undefined {
  let latest: CalendarDate | undefined;
  for (const date of dates) {
    if (latest === undefined || date.isAfter(latest)) latest = date;
  }
  return latest;
}

/**
 * Analyses stored history. Returns undefined until there is a weigh-in.
 *
 * TDEE is estimated as of yesterday: today's intake is still in progress.
 */
export function analyze({
  setup,
  weights,
  intake,
  today,
  flowDays = [],
  weightEvents = [],
  history = [],
  pauses = [],
  waists = [],
  bodyFatReadings = [],
  sites = [],
  trendModel = new WeightTrendModel(),
  estimator = new TdeeEstimator(),
}: {
  setup: UserSetup;
  weights: readonly WeightObservation[];
  intake: readonly IntakeDay[];
  today: CalendarDate;
  flowDays?: readonly MenstruationDay[];
  weightEvents?: readonly WeightEvent[];
  history?: readonly TargetsRecord[];
  pauses?: readonly Pause[];
  waists?: readonly WaistObservation[];
  /** Smart-scale body-fat readings (MM-502). */
  bodyFatReadings?: readonly BodyFatObservation[];
  /** Every site's tape measurements (MM-156): neck and hip join the range by the Navy method (MM-501). */
  sites?: readonly SiteObservation[];
  trendModel?: WeightTrendModel;
  estimator?: TdeeEstimator;
}): CoachSnapshot | undefined {
  const firstWeight = weights[0];
  if (firstWeight === undefined) return undefined;
  const profile = setup.profile;

  const creatineEvents = creatineWeightEvents({ events: weightEvents, creatineStartedOn: setup.creatineStartedOn });
  const lastCreatineEventOn = latestOf(
    creatineEvents.filter((event) => !event.date.isAfter(today)).map((event) => event.date),
  );
  const passingEvents = effectiveWeightEvents(weightEvents);
  const phaseSettling = settlingWindows(history);
  const settling = [...phaseSettling, ...weightEventSettlingWindows(creatineEvents)];
  const cycleNoise = flowDays.length === 0 ? undefined : cycleNoiseMultiplier(flowDays);
  const eventNoise = passingEvents.length === 0 ? undefined : passingWeightEventNoise(passingEvents);
  let noiseMultiplier: ((date: CalendarDate) => number) | undefined;
  if (cycleNoise !== undefined || eventNoise !== undefined) {
    noiseMultiplier = (date) => Math.max(cycleNoise?.(date) ?? 1, eventNoise?.(date) ?? 1);
  }
  const transitionShift = combineTrendShifts(
    phaseSettling.length === 0 ? undefined : settlingShift(phaseSettling, firstWeight.weightKg),
    creatineEvents.length === 0 ? undefined : creatineEventShift(creatineEvents),
  );
  const trend = trendModel.smooth(weights, { through: today, noiseMultiplier, shift: transitionShift });
  const trendWeight = (trend[trend.length - 1] as WeightTrendPoint).levelKg;

  // Body mass index is judged on the highest trend weight of the last seven
  // days, so one low reading, or a dip that lasts a day, changes nothing
  // (MM-111).
  const recent = trend.length > 7 ? trend.slice(trend.length - 7) : trend;
  const policy = CoachingPolicy.derive({
    profile,
    screening: setup.screening,
    today,
    weightKg: Math.max(...recent.map((p) => p.levelKg)),
  });
  const age = profile.ageOn(today);

  // The user's figure, or the formula joined by their waist entries (MM-34), the Navy tape (MM-501) and a smart
  // scale's readings (MM-502).
  const estimatedBodyFat = estimateBodyFat({ setup, trendWeightKg: trendWeight, waists, bodyFatReadings, sites, today });
  const bodyFat = estimatedBodyFat.estimate;

  const bmr = mifflinStJeorKcal({ sex: profile.sex, weightKg: trendWeight, heightCm: profile.heightCm, ageYears: age });

  const asOf = today.addDays(-1);
  const gaps = activityGaps({ weights, intake, today, pauses });
  const breaks = gaps.filter((g) => g.days >= GapRule.deficitBreakDays);
  const gapRestart = breaks[breaks.length - 1]?.returnOn;
  const pauseRestart = pauseDeficitRestartOn(pauses, today);
  const initialPrior = initialTdeePrior({
    bmrKcal: bmr,
    dailyActivity: setup.dailyActivity,
    trainingDaysPerWeek: setup.trainingDaysPerWeek,
  });

  // A transition must not make a previously measured TDEE fall back to the
  // formula prior while its scale change is excluded from the slope.
  const tdee = estimator.estimate({
    asOf,
    // Paused days are left out unless they were marked complete (MM-148).
    intake: withoutPausedDays(intake, pauses, { keepComplete: true }),
    trend,
    prior:
      weightEventPrior({
        history,
        creatineEvents,
        asOf,
        windowDays: estimator.windowDays,
        profileRevision: setup.profileRevision,
      }) ??
      gapPrior({
        gaps,
        history,
        trend,
        asOf,
        windowDays: estimator.windowDays,
        profileRevision: setup.profileRevision,
        restingEnergyAt: (weightKg) =>
          mifflinStJeorKcal({ sex: profile.sex, weightKg, heightCm: profile.heightCm, ageYears: age }),
      }) ??
      initialPrior,
    bmrKcal: bmr,
    energyDensityForSlope: (slope) =>
      energyDensityForSlope({
        slopeKgPerDay: slope,
        fatMassKg: bodyFat.fatMassKg(trendWeight),
        resistanceTrained: TrainingStatus.isResistanceTrained(setup.trainingStatus),
      }),
    settling,
  });

  return new CoachSnapshot({
    lastCreatineEventOn,
    gaps,
    deficitRestartOn:
      gapRestart === undefined || (pauseRestart !== undefined && pauseRestart.isAfter(gapRestart))
        ? pauseRestart
        : gapRestart,
    policy,
    trend,
    trendWeightKg: trendWeight,
    bodyFat,
    bodyFatBasis: estimatedBodyFat.basis,
    bmrKcal: bmr,
    calorieFloorKcal: SafetyBounds.calorieFloorKcal({
      sex: profile.sex,
      bmrKcal: bmr,
      bodyFatPercent: safetyBodyFatPercent(bodyFat, {
        previous: history[history.length - 1]?.safetyBodyFatPercent,
      }),
      fatFreeMassUpperKg: bodyFat.fatFreeMassUpperKg(trendWeight),
      trainingKcalPerDay: 0,
    }),
    tdee,
    confidence: assessCoachConfidence({
      estimate: tdee,
      asOf,
      intake,
      trend,
      history,
      lastWeightEventOn: latestOf(
        creatineEvents.filter((event) => !event.date.isAfter(asOf)).map((event) => event.date),
      ),
      lastGapEndedOn: latestOf(gaps.filter((gap) => !gap.to.isAfter(asOf)).map((gap) => gap.to)),
    }),
    recommendation: recommendMode({
      sex: profile.sex,
      bodyFatPercent: bodyFat.percent,
      trainingStatus: setup.trainingStatus,
      policy,
    }),
  });
}

function weightEventPrior({
  history,
  creatineEvents,
  asOf,
  windowDays,
  profileRevision,
}: {
  history: readonly TargetsRecord[];
  creatineEvents: readonly WeightEvent[];
  asOf: CalendarDate;
  windowDays: number;
  profileRevision: number;
}): TdeePrior | undefined {
  const windowStart = asOf.addDays(1 - windowDays);
  const mostRecentEvent = latestOf(
    creatineEvents
      .filter(
        (event) =>
          !event.date.isAfter(asOf) && !event.date.addDays(weightEventStepDays - 1).isBefore(windowStart),
      )
      .map((event) => event.date),
  );
  if (mostRecentEvent === undefined) return undefined;
  const priorRecords = history.filter(
    (record) =>
      !record.effectiveFrom.isAfter(mostRecentEvent) &&
      record.profileRevision === profileRevision &&
      record.tdeeStatus === 'updated',
  );
  const previous = priorRecords[priorRecords.length - 1];
  if (previous === undefined) return undefined;
  return { kcal: previous.tdeeKcal, sigmaKcal: previous.tdeeSigmaKcal };
}
