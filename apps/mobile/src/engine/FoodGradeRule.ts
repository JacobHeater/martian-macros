/**
 * The figures of the food grade (MM-380, MM-382): the app's own measure of
 * what a food gives per calorie. Protein, fiber and the vitamins and
 * minerals count for a food; sodium, sugars, saturated fat and calories per
 * gram count against it. A list "for" gives one point per threshold the
 * value reaches (≥); a list "against" one per threshold it passes (>), so
 * a value exactly on a threshold gets the benefit of the doubt (the panel's
 * ME-7). Each value is a row in the evidence register; the method is the
 * app's own, so the rows are judgement, held to a calibration set of
 * reference foods in `test/engine/foodGrade.test.ts`.
 */
export const FoodGradeRule = {
  /**
   * What counts against a food is read per 100 kcal, or per this many
   * calories' worth of a food with fewer calories than this per 100 g (so
   * per 200 g at 20 kcal per 100 g): below it the per-calorie multiplier
   * turns a label's sodium rounding into whole points and a broth into a
   * D (the panel's ME-3). What counts for a food is read per 100 kcal
   * whatever its calories, so a vegetable's density is its own (the
   * panel's NU-12): the chair's reconciliation of the two.
   */
  againstFloorKcal: 40,
  /** Protein in g per 100 kcal, for (max 8). */
  proteinGPer100Kcal: [1.5, 3, 4.5, 6, 8, 10, 12.5, 15],
  /** Fiber in g per 100 kcal, for (max 7). */
  fiberGPer100Kcal: [0.7, 1.4, 2.1, 2.8, 3.5, 4.5, 6],
  /**
   * The vitamins and minerals, for (max 6): the mean, over the ones the
   * food states (never over the ten, MM-310), of each one's share of its
   * Daily Value per 100 kcal, each share capped at `micronutrientCapPercent`;
   * and never more points than the food has nutrients at or above
   * `micronutrientBreadthPercent`, so a label that states one rich nutrient
   * cannot outscore a full profile (the panel's MN-2).
   */
  micronutrientsPercentPer100Kcal: [2.5, 5, 7.5, 10, 15, 20],
  /** A single nutrient's share of its Daily Value per 100 kcal counts no further than this. */
  micronutrientCapPercent: 100,
  /** A nutrient counts toward breadth at this share per 100 kcal: 2,000 kcal of the food gives its whole Daily Value. */
  micronutrientBreadthPercent: 5,
  /**
   * A food whose counted sugars (after the waiver) pass this many grams per
   * 100 kcal earns at most this many points for its vitamins and minerals,
   * so a fortified sweetened cereal does not reach the B band on its
   * fortificants (the panel's NU-9, MN-4).
   */
  micronutrientsCapWithSugars: { sugarsGPer100Kcal: 8, points: 3 },
  /**
   * The vitamins and minerals count only when a food states at least this
   * many of the ten: the four a US label must state (vitamin D, calcium,
   * iron, potassium; 21 CFR 101.9(c)(8)(ii)), so a label-only food is
   * counted (the panel's MN-3).
   */
  micronutrientsMinStated: 4,
  /**
   * The Daily Values on the US food label (21 CFR 101.9(c)(8)(iv), adults
   * and children of 4 and over), one reference for every person: the grade
   * is universal, so it does not use the person's own reference amounts
   * (MM-310). Potassium, calcium, magnesium, iron, zinc and vitamin C in
   * mg; vitamin A in µg RAE, vitamin D and B12 in µg, folate in µg DFE.
   */
  dailyValues: {
    potassium: 4700,
    calcium: 1300,
    iron: 18,
    magnesium: 420,
    zinc: 11,
    vitaminA: 900,
    vitaminC: 90,
    vitaminD: 20,
    vitaminB12: 2.4,
    folate: 400,
  },
  /**
   * Calories per gram, against (max 4): starts where no food is mostly
   * water, so a food and its cooked state differ by at most a step, and
   * says "concentrated" without outranking fiber (the panel's NU-1, ME-5).
   */
  kcalPerGram: [3, 4, 5, 6, 7.5],
  /** Sodium in mg per 100 kcal, against (max 14); the scale runs on so a brine's protein cannot net it out (the panel's ME-6, NU-3). */
  sodiumMgPer100Kcal: [120, 240, 360, 480, 600, 800, 1000, 1500, 2000, 3000, 5000, 8000, 10000, 14000],
  /** Sugars in g per 100 kcal, against (max 8), when stated, scaled by the waiver below. */
  sugarsGPer100Kcal: [3, 6, 9, 12, 16, 20, 25, 30],
  /**
   * The sugars waiver, a stand-in for the intrinsic sugars of fruit and
   * dairy, which the sources do not tell from added sugars (the panel's
   * NU-2, ME-4). A watery food (fresh fruit, vegetables, plain dairy) has
   * its sugars points waived by how far its fiber or protein per 100 kcal
   * has climbed its ramp: fully at 1 g of fiber or 4.5 g of protein, by
   * half at 0.75 g or 3.4 g, not at all at 0.5 g or 2.25 g. The waiver
   * itself fades out between 1.5 and 2 kcal per gram, so a sweetened
   * cereal with added fiber, a granola bar, dried fruit, honey and
   * chocolate keep their sugars points. The points kept are rounded half
   * up.
   */
  sugarsWaiverProteinG: { from: 2.25, to: 4.5 },
  sugarsWaiverFiberG: { from: 0.5, to: 1 },
  sugarsWaiverKcalPerGram: { from: 1.5, to: 2 },
  /** Saturated fat in g per 100 kcal, against (max 6), when stated. */
  saturatedFatGPer100Kcal: [1.5, 2.5, 3.5, 4.5, 5.5, 6.5],
  /** A food with fewer calories than this per 100 g has nothing to grade per calorie. */
  minKcalPer100g: 10,
  /** A food with more alcohol than this per 100 g is not graded. */
  alcoholLimitG: 1.2,
  /** A meal or a day has a grade when its graded entries carry at least this share of its calories. */
  rollupCoverage: 0.7,
  /**
   * The twelve steps, as the lowest score each still reaches: A+ ≥ 16,
   * A ≥ 13, A- ≥ 10, B+ ≥ 7, B ≥ 5, B- ≥ 3, C+ ≥ 1, C ≥ −1, C- ≥ −3,
   * D+ ≥ −5, D ≥ −8, and D- below (the panel's NU-6). A step is about the
   * resolution of the inputs (the panel's ME-2): neighbouring letters are
   * not a ranking to act on.
   */
  letterSteps: [16, 13, 10, 7, 5, 3, 1, -1, -3, -5, -8],
} as const;
