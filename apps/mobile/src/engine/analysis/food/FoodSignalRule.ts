/**
 * The thresholds of MM-606's food signals and MM-612's single day, from the
 * nutrition panel (2026-10-24). Those the panel marked uncertain are
 * calibrated by MM-605's null simulation. Tune them here.
 */
export const FoodSignalRule = {
  /**
   * A span's level rules need at least this many judged days, and at least
   * the trend engine's coverage (60% of the span's calendar days).
   */
  minimumJudgedDays: 5,

  /** N1: change when met on under this share of judged days. */
  proteinMinimumChangeShare: 0.5,
  /** N1: holding up when met on at least this share (uncertain). */
  proteinMinimumHoldingShare: 0.8,
  /** N1: a fix in change is over (MM-605's exit threshold) only once met on at least this share. */
  proteinMinimumExitShare: 0.65,

  /** N2: read only when the target is at least this far above the minimum. */
  proteinTargetAboveMinimumG: 15,
  /** N2: change when at least this fraction under the target… */
  proteinTargetShortFraction: 0.1,
  /** …on at least this share of judged days (uncertain). */
  proteinTargetChangeShare: 0.6,
  /** N2: holding up when within this fraction of the target, or over it… */
  proteinTargetHoldingFraction: 0.05,
  /** …on at least this share. */
  proteinTargetHoldingShare: 0.7,

  /** N3: a main meal with under this much protein has almost none (`ProteinSpreadRule.almostNoneG`). */
  mealAlmostNoneG: 10,
  /** N3: holding up when each main meal carries this much per kg of body weight… */
  mealHoldingGPerKg: 0.3,
  /** …on at least this share of judged days (uncertain). */
  mealHoldingShare: 0.7,

  /** N4: change when the span's density is under this share of what the targets need (uncertain). */
  densityChangeShareOfRequired: 0.85,
  /** N4: holding up with protein at least this share of its target. */
  densityHoldingProteinShare: 0.95,

  /** N5 high: a day at least this multiple of the fat target… */
  fatHighMultiple: 1.25,
  /** …and at least this many grams over it… */
  fatHighOverG: 15,
  /** …on at least this share of judged days (uncertain). */
  fatHighShare: 0.6,
  /** N5 low: under the fat minimum on at least this share. */
  fatLowShare: 0.5,
  /** N5: holding up within this fraction of the target… */
  fatHoldingFraction: 0.15,
  /** …on at least this share (a choice made without asking: the ticket gives no share). */
  fatHoldingShare: 0.7,

  /** N6: fat's share of calories at least this many points over the plan… */
  fatSharePointsOver: 10,
  /** …and over this share (uncertain). */
  fatShareCeilingPercent: 35,

  /** N7: the carbohydrate floor a chosen balance keeps (`CarbFatBalance.carbFloorG`). */
  carbFloorG: 100,
  /** N7: change when under the floor on at least this share (a choice made without asking). */
  carbLowShare: 0.5,
  /** N7: holding up within this fraction of the target… */
  carbHoldingFraction: 0.15,
  /** …on at least this share. */
  carbHoldingShare: 0.7,

  /** N8: the largest share off by at least this many points (uncertain). */
  splitChangePoints: 8,
  /** N8: holding up with every share within this many points. */
  splitHoldingPoints: 5,

  /** N9: a food at least this many kcal a gram… */
  denseKcalPerG: 4,
  /** …with under this much protein per 100 kcal… */
  denseProteinPer100Kcal: 5,
  /** …on at least this many days… */
  denseMinimumDays: 3,
  /** …giving at least this share of the span's calories (uncertain). */
  denseShareOfKcal: 0.1,
  /** Calories per gram is read only when grams are known for at least this share of the calories. */
  gramsCoverShare: 0.8,
  /** N9 holding up: a water-rich food is under this many kcal a gram (Rolls' lowest band)… */
  waterRichKcalPerG: 0.6,
  /** …and a meal is mostly of them at this share of its grams… */
  waterRichMealShare: 0.5,
  /** …on at least this many days. */
  waterRichDays: 3,

  /** N11: a food named on at least this many days… */
  contributorMinimumDays: 3,
  /** …at least this share of the total or gap… */
  contributorShare: 0.15,
  /** …and none when the top foods explain less than this share together. */
  contributorsQuietShare: 0.3,
  /** At most this many foods are named. */
  contributorsMost: 3,

  /** N12 holding up: the guide met on average over at least this many counted days. */
  fiberHoldingDays: 7,

  /** N13: judged days needed, as MM-312. */
  sodiumMinimumDays: 7,
  /** N13 holding up: under the limit on at least this share. */
  sodiumHoldingShare: 0.8,

  /** N14: change when outside the band on at least this share of judged days. */
  caloriesChangeShare: 0.6,
  /** N14: holding up within the band on at least this share. */
  caloriesHoldingShare: 0.7,

  /** N15 on fat loss: intake averaging at least the energy use less this many of its standard deviations. */
  energyUseFatLossSigmas: 1,
  /**
   * N15 on lean gain: intake averaging at most the energy use plus this many
   * of its standard deviations. Calibrated 1 → 0 by the cross-signal null
   * simulation (`test/engine/coachNullSimulation.test.ts`): a lean-gain
   * surplus (0.15–0.35% of body weight a week, about 100–250 kcal) is
   * usually within one standard deviation of an updated estimate (Good is
   * under 200 kcal), so at 1 the line fired on a person eating exactly to
   * plan about half the days and came and went daily. At 0 it says only
   * what the log shows: no surplus at all.
   */
  energyUseLeanGainSigmas: 0,

  /** N16: a meal slot giving at least this share of the span's calories… */
  mealShareOfKcal: 0.25,
  /** …at under this share of the density the targets need. */
  mealDensityShareOfRequired: 0.5,
  /** N16 holding up: every such slot at least this share. */
  mealHoldingShareOfRequired: 0.7,

  /** Partial days: more than this share of logged days (MM-27). */
  partialShare: 1 / 3,
  /** Estimates: more than this share of whole days' calories (MM-150). */
  estimatedShare: 0.5,

  /** 1d (MM-612): fat over its target by this multiple… */
  dayFatMultiple: 1.25,
  /** …and this many grams. */
  dayFatOverG: 15,
  /** 1d: protein density under this share of what the targets need… */
  dayDensityShareOfRequired: 0.85,
  /** …on at least this many calories logged (uncertain). */
  dayDensityMinimumKcal: 400,
  /** 1d: a food named needs at least this share of the day's total or gap. */
  dayContributorShare: 0.15,

  /** The foods that fit what is left: logged on at least this many days… */
  fitsMinimumDays: 2,
  /** …with at least this much protein… */
  fitsMinimumProteinG: 10,
  /** …and at least this much per 100 kcal, a fifth of its energy. */
  fitsMinimumProteinPer100Kcal: 5,
  /** At most this many are named. */
  fitsMost: 2,

  /** A logging-style switch, as the expenditure estimate finds it (`TdeeEstimator`'s defaults): the change in style… */
  styleSwitchThreshold: 0.5,
  /** …with at least this many whole days on each side. */
  styleSwitchMinimumDays: 7,

  /** The days a trade's Y and the foods that fit are looked for in. */
  historyDays: 56,
} as const;
