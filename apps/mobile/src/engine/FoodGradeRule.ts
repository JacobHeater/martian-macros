/**
 * The figures of the food grade (MM-369, MM-370): the point tables of the
 * general-foods algorithm published for the Nutri-Score label by Santé
 * publique France's Scientific Committee (2023 update), applied here to
 * every food per 100 g, on twelve steps instead of five letters, and with
 * the deviations the evidence register records (no fruit, vegetable and
 * legume share; one table for every food). The grades are not Nutri-Scores
 * and the app never says they are (the panel's NU-5). Each value is a row
 * in the register. Every threshold is a strict "greater than".
 */
export const FoodGradeRule = {
  /** Unfavourable points: energy in kJ per 100 g, one point per threshold passed (max 10). */
  energyKJ: [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350],
  /** Total sugars in g per 100 g (max 15). */
  sugarsG: [3.4, 6.8, 10, 14, 17, 20, 24, 27, 31, 34, 37, 41, 44, 48, 51],
  /** Saturated fat in g per 100 g (max 10). */
  saturatedFatG: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  /** Salt in g per 100 g (max 20); salt is sodium × `saltPerSodium`. */
  saltG: [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0, 3.2, 3.4, 3.6, 3.8, 4.0],
  /** Favourable points: fiber in g per 100 g (max 5). */
  fiberG: [3.0, 4.1, 5.2, 6.3, 7.4],
  /** Protein in g per 100 g (max 7). */
  proteinG: [2.4, 4.8, 7.2, 9.6, 12, 14, 17],
  /** From this many unfavourable points, protein no longer counts. */
  proteinNotCountedFrom: 11,
  /** A food with more alcohol than this per 100 g is outside the method's scope. */
  alcoholLimitG: 1.2,
  kJPerKcal: 4.184,
  saltPerSodium: 2.5,
  /** A meal or a day has a grade when its graded entries carry at least this share of its calories. */
  rollupCoverage: 0.7,
  /**
   * The twelve steps, as the highest score each still reaches: A+ ≤ −6, A ≤ −3,
   * A- ≤ 0, B+ ≤ 1, B ≤ 2, B- ≤ 3, C+ ≤ 5, C ≤ 7, C- ≤ 10, D+ ≤ 14, D ≤ 18,
   * and D- above. The published letters are A ≤ 0, B ≤ 2, C ≤ 10, D ≤ 18, E
   * above; B- takes the published C's first point and E is folded into D-.
   */
  letterSteps: [-6, -3, 0, 1, 2, 3, 5, 7, 10, 14, 18],
} as const;
