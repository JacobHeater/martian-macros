/**
 * The figures of the coach's orders (MM-617): the owner's voice standard,
 * chosen without asking where the ticket gives none. Tune them here; each
 * has an evidence row (`docs/evidence.md`).
 */
export const CoachAdviceRule = {
  /** A day over target: dinner, if eaten, stays under this. */
  dinnerLimitKcal: 400,
  /** A day over target with dinner already logged: a snack, if eaten, stays under this. */
  snackLimitKcal: 200,
  /** The evening, in minutes after midnight: fiber short by now is a fix, not a strength missed. */
  eveningMinute: 18 * 60,
  /** Fiber short of the guide by at least this many grams is a fix on 1d. */
  dayFiberShortG: 5,
  /** A food with under this much protein per 100 kcal "does nothing for your goal"… */
  lowProteinPer100Kcal: 2,
  /** …at this many calories a time or more. */
  lowProteinMinKcal: 150,
  /** A meal or food at this many calories or more is looked at for a swap on 1d. */
  swapMinKcal: 300,
  /** A logged meal is the meal's subject when it gives this share of its slot's calories. */
  mealSubjectShare: 0.7,
  /** The worst food of a meal: its calories that carried little protein, plus this share of its fat's calories… */
  worstFatWeight: 0.5,
  /** …plus this many calories' worth for each mg of sodium. */
  worstSodiumWeight: 0.05,
  /** A second food is named beside the worst when it scores at least this share of it. */
  secondWorstShare: 0.8,
  /** "Fill the plate with" the meal's food with the most protein per calorie, with at least this much protein. */
  keepMinProteinG: 10,
  /** "Take one spoonful" is said for a meal logged as one of at least this many foods (a buffet, a plate). */
  spoonfulMinFoods: 3,
  /** 1d names the foods giving at least this share of the day's sodium, at most `contributorsMost`. */
  daySodiumFoodShare: 0.1,
  /** Sodium is said as a multiple of the limit at this many times it or more. */
  sodiumMultipleFrom: 1.5,
  /** A swap counts when it saves at least this share of the calories… */
  swapKcalSaving: 0.2,
  /** …or this share of the fat… */
  swapFatSaving: 0.4,
  /** …with protein no lower than this share of the food's. */
  swapProteinKept: 0.6,
  /** A lean gain short of calories: about this much more a day. */
  leanGainAddKcal: 250,
  /** A meal or food at `swapMinKcal` or more is "high-calorie, low-protein" under this share of the protein per 100 kcal the targets need. */
  swapDensityShareOfRequired: 0.85,
  /** 1d fiber short: add about this many cups of vegetables. */
  fiberCups: 2,
  /** A span's calorie fix: one day "drove" it when it gave at least this share of the calories over target of the span's days. */
  dominantDayShare: 0.5,
  /** Training stopped (T1): this many sessions this week to restart. */
  restartSessions: 2,
  /** Stalled lifts (T6): one more hard set a session on each, this many. */
  stalledAddSets: 1,
  /** Lifts falling with short sleep (T7): at least this much a night, in minutes (7 hours). */
  sleepMinutes: 7 * 60,
} as const;
