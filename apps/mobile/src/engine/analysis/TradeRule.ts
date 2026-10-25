/**
 * The figures of trade X for Y (MM-607): the nutrition panel's, chosen
 * without asking and marked uncertain in the ticket where they are.
 */
export const TradeRule = {
  /** X is eaten on at least this many distinct days of the span… */
  xMinDays: 3,
  /** …at least this many calories a time. */
  xMinKcal: 150,
  /** A food counts only when its macros explain this share of its calories. */
  knownMacrosShare: 0.75,
  /** A protein food (this share of energy from protein) is never X for a protein or fat trade. */
  proteinFoodShare: 0.2,
  /** …unless it is breaded or fried (its name's tags), or has at least this share of its macros' energy from fat (MM-617). */
  friedProteinFatShare: 0.4,
  /** Alcohol (this share of a food's energy) is never an X or a Y. */
  alcoholShare: 0.5,
  /** A food the person logs: in X's meal slot on at least this many days of the history. */
  loggedMinDays: 2,
  /** Y's calories a time are at least this share of X's (not "eat less" in disguise)… */
  kcalFloorRatio: 0.6,
  /** …and at most this share, except on lean gain… */
  kcalCeilingRatio: 1.1,
  /** …where they are at least this share, with no ceiling. */
  leanGainFloorRatio: 0.9,
  /** For protein: Y has at least this much more protein per 100 kcal… */
  proteinDensityGainG: 3,
  /** …and at least this many grams more a time. */
  proteinGainG: 8,
  /** For fat: Y's fat share of calories is at least this much lower… */
  fatShareDrop: 0.15,
  /** …with at least this many grams less fat a time, and protein no lower. */
  fatDropG: 8,
  /** For calories: at least this much less a time, protein no lower and calories per gram no higher. */
  kcalDrop: 80,
  /** For sodium: Y's sodium per 100 kcal is at most this share of X's. */
  sodiumDensityRatio: 0.7,
  /** While fiber is in change, Y has no more than this much less fiber. */
  fiberDropG: 2,
  /** With insulin or a sulfonylurea, Y has no more than this much less carbohydrate. */
  insulinCarbDropG: 5,
  /** Y is not "mostly fat": this share of its calories from fat, on this many calories, unless protein-dense (MM-365). */
  mostlyFatShare: 0.55,
  mostlyFatMinKcal: 150,
  /** Y is not "light on protein": under this share from protein, on this many calories (MM-365). */
  lightOnProteinShare: 0.1,
  lightOnProteinMinKcal: 400,
  /** The MM-606 signal ids a trade must do no harm to. */
  sodiumSignal: 'sodium',
  fiberSignal: 'fiber',
} as const;
