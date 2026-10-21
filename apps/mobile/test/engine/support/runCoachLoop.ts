import {
  CoachingPolicy,
  type DailyActivity,
  type GoalMode,
  type IntakeDay,
  type Profile,
  ScreeningAnswers,
  TrainingStatus,
  type WeightObservation,
} from '../../../src/domain';
import {
  type BodyFatEstimate,
  breakFlagOf,
  breakInForce,
  computeTargetsTraced,
  consecutiveDeficitWeeks,
  type DailyTargets,
  deurenbergBodyFat,
  energyDensityForSlope,
  explainTargets,
  initialTdeePrior,
  lossSafetyRaiseKcal,
  mifflinStJeorKcal,
  safetyBodyFatPercent,
  settlingShift,
  settlingWindows,
  TargetInputs,
  type TargetsExplanation,
  TargetsRecord,
  TdeeEstimate,
  TdeeEstimator,
  WeightTrendModel,
  type WeightTrendPoint,
} from '../../../src/engine';
import type { SyntheticUser } from './SyntheticUser';
import type { WeekResult } from './WeekResult';

/**
 * Runs the full coaching loop the app will run: daily logs and weigh-ins,
 * a weekly check-in that re-smooths the trend, re-estimates TDEE, and
 * recomputes bounded targets.
 */
export function runCoachLoop({
  user,
  profile,
  mode,
  weeks,
  trainingStatus = 'intermediate',
  trainingDaysPerWeek = 3,
  dailyActivity = 'light',
  beforeWeek,
  estimator = new TdeeEstimator(),
  settle = true,
  modeAt,
  bodyFat,
  beforeCheckIn,
}: {
  user: SyntheticUser;
  profile: Profile;
  mode: GoalMode;
  weeks: number;
  trainingStatus?: TrainingStatus;
  trainingDaysPerWeek?: number;
  dailyActivity?: DailyActivity;
  beforeWeek?: (week: number, user: SyntheticUser) => void;
  estimator?: TdeeEstimator;
  settle?: boolean;
  modeAt?: (week: number) => GoalMode | undefined;
  /** The body-fat estimate the engine works from; by default the formula one. */
  bodyFat?: BodyFatEstimate;
  /**
   * Sees the targets history before each week's check-in, and may have the
   * simulated person take the diet break the coach offers (MM-135), as the
   * Coach screen's button would.
   */
  beforeCheckIn?: (week: number, history: readonly TargetsRecord[]) => { takeBreak?: boolean } | undefined;
}): WeekResult[] {
  const policy = CoachingPolicy.derive({ profile, screening: new ScreeningAnswers(), today: user.today });
  const intakeLog: IntakeDay[] = [];
  const weightLog: WeightObservation[] = [];
  const trendModel = new WeightTrendModel();
  const resistanceTrained = TrainingStatus.isResistanceTrained(trainingStatus);

  const bmrFor = (weightKg: number) =>
    mifflinStJeorKcal({
      sex: profile.sex,
      weightKg,
      heightCm: profile.heightCm,
      ageYears: profile.ageOn(user.today),
    });

  const startBmr = bmrFor(user.weightKg);
  const prior = initialTdeePrior({ bmrKcal: startBmr, dailyActivity, trainingDaysPerWeek });
  let tdee = new TdeeEstimate({ kcal: prior.kcal, sigmaKcal: prior.sigmaKcal, status: 'held' });
  const startBodyFat =
    bodyFat ??
    deurenbergBodyFat({
      sex: profile.sex,
      weightKg: user.weightKg,
      heightCm: profile.heightCm,
      ageYears: profile.ageOn(user.today),
    });

  let targets: DailyTargets | undefined;
  let trendWeight = user.weightKg;
  let safetyBf: number | undefined;
  const results: WeekResult[] = [];
  const history: TargetsRecord[] = [];
  let currentMode = mode;

  for (let week = 0; week < weeks; week++) {
    beforeWeek?.(week, user);
    const weekMode = modeAt?.(week) ?? mode;
    const modeChanged = weekMode !== currentMode;
    currentMode = weekMode;

    let safetyRaise = 0;
    if (week > 0) {
      const asOf = user.today.addDays(-1);
      const settling = settle ? settlingWindows(history) : [];
      const trend = trendModel.smooth(weightLog, {
        through: asOf,
        shift: settlingShift(settling, user.startWeightKg),
      });
      const weightNow = (trend[trend.length - 1] as WeightTrendPoint).levelKg;
      trendWeight = weightNow;
      const bmr = bmrFor(weightNow);
      tdee = estimator.estimate({
        asOf,
        intake: intakeLog,
        trend,
        prior,
        bmrKcal: bmr,
        energyDensityForSlope: (slope) =>
          energyDensityForSlope({
            slopeKgPerDay: slope,
            fatMassKg: startBodyFat.fatMassKg(weightNow),
            resistanceTrained,
          }),
        settling,
      });
      // As in `nextTargets`: a too-fast loss is not noise, so it can raise
      // targets during calibration and while the estimate is held.
      safetyBf = safetyBodyFatPercent(startBodyFat, { previous: safetyBf });
      safetyRaise = lossSafetyRaiseKcal({
        trend,
        history,
        sex: profile.sex,
        bodyFat: startBodyFat,
        safetyBodyFatPercent: safetyBf,
        resistanceTrained,
      });
    }

    let explanation: TargetsExplanation | undefined;
    // As in `nextTargets`: a diet break holds for its length (MM-135), and
    // the deficit then resumes at once, unthrottled, as after a change of
    // goal. The count of deficit weeks is the engine's own.
    const previousRecord = history[history.length - 1];
    const onBreak = !modeChanged && breakInForce(history, user.today) !== undefined;
    const breakOver =
      !modeChanged &&
      !onBreak &&
      previousRecord !== undefined &&
      breakFlagOf(previousRecord.targets.flags) !== undefined;
    // A break the person takes starts at once, like the Coach's button (MM-117, MM-135).
    const asked = targets === undefined ? undefined : beforeCheckIn?.(week, history);
    const takeBreak = !onBreak && targets !== undefined && targets.weeklyRateFraction < 0 && asked?.takeBreak === true;
    // As in `nextTargets`: nothing changes during calibration or while the
    // estimate is held, and a change of goal applies at once, unthrottled.
    if (
      !onBreak &&
      (targets === undefined ||
        modeChanged ||
        breakOver ||
        takeBreak ||
        safetyRaise > 0 ||
        (week >= 2 && tdee.status === 'updated'))
    ) {
      const traced = computeTargetsTraced(
        new TargetInputs({
          sex: profile.sex,
          heightCm: profile.heightCm,
          trendWeightKg: trendWeight,
          bodyFat: startBodyFat,
          mode: currentMode,
          trainingStatus,
          trainingDaysPerWeek,
          policy,
          tdeeKcal: tdee.kcal,
          bmrKcal: bmrFor(trendWeight),
          previous: modeChanged || breakOver ? undefined : targets,
          consecutiveDeficitWeeks: consecutiveDeficitWeeks(history, user.today),
          safetyBodyFatPercent: safetyBf,
          safetyRaiseKcal: modeChanged || breakOver ? 0 : safetyRaise,
          breakRequested: takeBreak,
        }),
      );
      targets = traced.targets;
      explanation = explainTargets({
        trigger: previousRecord === undefined ? 'firstTargets' : modeChanged ? 'goalChange' : breakOver ? 'breakEnded' : 'checkIn',
        previous: previousRecord,
        targets: traced.targets,
        trace: traced.trace,
        tdee,
      });
    }
    // The first week always issues targets; the `onBreak` guard above cannot hold before any exist.
    const inForce = targets as DailyTargets;
    if (history[history.length - 1]?.targets !== inForce) {
      history.push(
        new TargetsRecord({
          effectiveFrom: user.today,
          targets: inForce,
          mode: currentMode,
          tdeeKcal: tdee.kcal,
          tdeeSigmaKcal: tdee.sigmaKcal,
          tdeeStatus: tdee.status,
          explanation,
        }),
      );
    }
    results.push({
      week,
      targets: inForce,
      tdee,
      trueTdeeKcal: user.trueTdeeKcal,
      trueWeightKg: user.weightKg,
      underReportFraction: user.underReportFraction,
      explanation,
    });

    for (let day = 0; day < 7; day++) {
      const { intake, weight } = user.liveDay(inForce.kcal);
      if (intake !== undefined) intakeLog.push(intake);
      if (weight !== undefined) weightLog.push(weight);
    }
  }
  return results;
}
